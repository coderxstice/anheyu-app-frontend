/*
 * @Description: 文件上传核心 Composable，实现文件级流畅并行，并通过路径创建锁解决后端死锁问题，同时过滤系统文件。
 * @Author: 安知鱼
 * @Date: 2025-07-01 04:30:00
 * @LastEditTime: 2025-07-02 10:15:40
 * @LastEditors: 安知鱼
 */
import { ref, computed, onUnmounted, type ComputedRef, reactive } from "vue";
import { ElMessageBox } from "element-plus";
import type { UploadItem, StoragePolicy, FileItem } from "@/api/sys-file/type";
import {
  createUploadSessionApi,
  deleteUploadSessionApi,
  validateUploadSessionApi
} from "@/api/sys-file/sys-file";
import {
  joinPath,
  extractLogicalPathFromUri,
  getFileFingerprint,
  getParentPath
} from "@/utils/fileUtils";
import { useUploadQueue } from "./upload.queue";
import { uploadFileChunksWorker } from "./upload.worker";

/**
 * @description: 动态创建一个隐藏的文件输入框，用于以编程方式触发文件选择对话框。
 * @param {(files: FileList) => void} callback - 用户选择文件后要执行的回调函数。
 * @param {{ multiple?: boolean; accept?: string }} [options={}] - input 元素的配置选项，如是否多选、接受的文件类型。
 * @returns {void}
 */
function createFileInput(
  callback: (files: FileList) => void,
  options: { multiple?: boolean; accept?: string } = {}
) {
  const input = document.createElement("input");
  input.type = "file";
  input.multiple = options.multiple || false;
  if (options.accept) {
    input.accept = options.accept;
  }
  input.style.display = "none";
  input.onchange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      callback(target.files);
    }
    // 完成后自销毁
    document.body.removeChild(input);
  };
  document.body.appendChild(input);
  input.click();
}

/**
 * @description: 文件上传核心 Composable，管理整个上传流程，包括队列、并发、状态、错误处理和用户交互。
 * @param {ComputedRef<FileItem[]>} existingFiles - 一个计算属性，引用当前目录已存在的文件列表，用于预检测冲突。
 * @param {ComputedRef<StoragePolicy | null>} storagePolicy - 一个计算属性，引用当前选中的存储策略。
 * @param {() => void} onQueueFinished - 当队列中所有任务处理完毕后需要执行的回调，通常用于刷新文件列表。
 * @returns {object} 返回一个包含队列状态和所有控制方法的对象。
 */
export function useFileUploader(
  existingFiles: ComputedRef<FileItem[]>,
  storagePolicy: ComputedRef<StoragePolicy | null>,
  onQueueFinished: () => void
) {
  // 用于 API 节流的时间戳，记录上一次允许调用的时间
  let lastApiCallTimestamp = 0;
  const API_CALL_INTERVAL = 20; // 毫秒

  const {
    uploadQueue,
    addTask,
    removeTask,
    findTask,
    findPendingTask,
    clearFinishedTasks
  } = useUploadQueue();

  const concurrency = ref(4); // 并发数，即同时处理的文件数量
  const isProcessingQueue = ref(false); // 标志位，表示上传调度器是否正在运行
  const globalOverwrite = ref(false); // 全局覆盖设置，用于处理“全部覆盖”操作
  const speedDisplayMode = ref<"instant" | "average">("instant"); // 速度显示模式

  // 路径创建锁，用于解决上传文件夹时，多个文件同时创建同一个父目录导致的后端竞态问题
  const pathCreationLock = new Map<string, Promise<any>>();

  let speedInterval: number | null = null; // 速度计算器的定时器ID
  let debounceTimer: number | null = null; // 用于防抖刷新文件列表的定时器ID

  const showUploadProgress = computed(() => uploadQueue.length > 0);

  // 需要在上传时自动忽略的系统文件列表
  const ignoredFileNames = new Set([".DS_Store", "Thumbs.db"]);

  /**
   * @description: 计算队列中所有正在上传的文件的瞬时速度和平均速度。
   * @returns {void}
   */
  const calculateSpeed = () => {
    uploadQueue.forEach(item => {
      if (item.status === "uploading") {
        const now = Date.now();
        const currentSize = item.uploadedSize;
        // 计算瞬时速度
        const instantTimeDiff = (now - (item.lastTime || now)) / 1000;
        const instantSizeDiff = currentSize - (item.lastSize || 0);
        if (instantTimeDiff > 0) {
          item.instantSpeed = instantSizeDiff / instantTimeDiff;
        }
        // 计算平均速度
        const averageTimeDiff = (now - (item.startTime || now)) / 1000;
        if (averageTimeDiff > 0) {
          item.averageSpeed = currentSize / averageTimeDiff;
        }
        item.lastTime = now;
        item.lastSize = currentSize;
      } else {
        item.instantSpeed = 0; // 非上传状态则速度为0
      }
    });
  };

  /**
   * @description: 根据队列中是否有文件正在上传来动态启动或停止速度计算器。
   * @returns {void}
   */
  const manageSpeedCalculator = () => {
    const isUploading = uploadQueue.some(item => item.status === "uploading");
    if (isUploading && !speedInterval) {
      // 有文件在上传且计时器未启动，则启动计时器
      speedInterval = window.setInterval(calculateSpeed, 1000);
    } else if (!isUploading && speedInterval) {
      // 没有文件在上传且计时器仍在运行，则关闭计时器
      clearInterval(speedInterval);
      speedInterval = null;
      uploadQueue.forEach(item => {
        if (item.status !== "uploading") item.instantSpeed = 0;
      });
    }
  };

  /**
   * @description: 在组件卸载时清理所有定时器。
   */
  onUnmounted(() => {
    if (speedInterval) clearInterval(speedInterval);
    if (debounceTimer) clearTimeout(debounceTimer);
  });

  /**
   * @description: 对 onQueueFinished 回调进行防抖处理，避免在短时间内频繁刷新文件列表。
   * @returns {void}
   */
  const _debounceRefresh = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(onQueueFinished, 500);
  };

  /**
   * @description: 使用异步锁来创建上传会话。
   * 这可以防止在上传文件夹时，多个属于同一目录的文件同时请求创建该目录，从而避免后端API冲突。
   * @param {UploadItem} item - 要为其创建会话的上传项。
   * @returns {Promise<void>}
   */
  const createSessionWithLock = async (item: UploadItem): Promise<void> => {
    const parentPath = getParentPath(
      joinPath(item.targetPath, item.relativePath)
    );

    // 检查此父目录是否已被加锁，如果是，则等待锁的 Promise 完成
    while (pathCreationLock.has(parentPath)) {
      await pathCreationLock.get(parentPath);
    }

    // 将 API 调用包装在一个新的 Promise 中，并在其内部实现节流
    const promise = (async () => {
      try {
        const now = Date.now();
        const timeSinceLastCall = now - lastApiCallTimestamp;

        if (timeSinceLastCall < API_CALL_INTERVAL) {
          const delay = API_CALL_INTERVAL - timeSinceLastCall;
          console.log(`[UPLOADER-THROTTLE] API调用过于频繁, 等待 ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        // 更新时间戳为“现在”，表示令牌已被使用
        lastApiCallTimestamp = Date.now();

        const sessionRes = await createUploadSessionApi(
          joinPath(item.targetPath, item.relativePath),
          item.size,
          storagePolicy.value!.id,
          item.overwrite || globalOverwrite.value
        );

        if (!sessionRes || sessionRes.code !== 200) {
          const message = sessionRes?.message || "创建上传会话失败";
          const error: any = new Error(message);
          if (sessionRes?.code === 409 || message.includes("冲突")) {
            error.isConflict = true;
          }
          throw error;
        }

        const { session_id, chunk_size } = sessionRes.data;
        item.sessionId = session_id;
        item.totalChunks = Math.ceil(item.size / chunk_size);
        item.chunkSize = chunk_size;
        console.log(
          `[UPLOADER] ${item.name}: 会话创建成功, ID: ${item.sessionId}`
        );
      } finally {
        pathCreationLock.delete(parentPath);
      }
    })();

    pathCreationLock.set(parentPath, promise);
    return promise;
  };

  /**
   * @description: 处理单个文件上传的完整生命周期，包括创建会话和上传所有分片。
   * 这是每个并发“工人”(worker)执行的核心任务。
   * @param {UploadItem} item - 要处理的上传项。
   * @returns {Promise<void>}
   */
  const processFilePipeline = async (item: UploadItem): Promise<void> => {
    try {
      // --- 【调试延时】在每个文件开始处理前，增加一个延时 ---
      await new Promise(resolve => setTimeout(resolve, 200));
      // ---
      item.status = "uploading";
      item.startTime = Date.now();
      manageSpeedCalculator();

      // 第一步：创建会话
      await createSessionWithLock(item);
      // 第二步：上传所有分片
      await uploadFileChunksWorker(item);
    } catch (error: any) {
      // 捕获流程中发生的任何错误
      if (item.status !== "canceled") {
        item.status = error.isConflict ? "conflict" : "error";
        item.errorMessage = error.message || "未知错误";
      }
    } finally {
      // 任务结束后，如果是成功状态且需要刷新，则触发防抖刷新
      if (item.status === "success" && item.needsRefresh) {
        _debounceRefresh();
      }
      // 重新评估是否需要运行速度计算器
      manageSpeedCalculator();
    }
  };

  /**
   * @description: 并发调度器，负责管理整个上传队列的执行。
   * 它会根据设定的并发数，从队列中取出待处理任务并分配给“工人”去执行。
   * @returns {Promise<void>}
   */
  const processUploadQueue = async () => {
    if (isProcessingQueue.value) return;
    isProcessingQueue.value = true;
    console.log(
      `[UPLOADER] 启动文件级流畅并行上传，并发数: ${concurrency.value}`
    );

    const workers = new Set<Promise<void>>();

    const loop = () => {
      while (workers.size < concurrency.value) {
        const item = findPendingTask();
        if (!item) break;

        // [关键修复] 在调度器拾取任务后，立即同步修改其状态！
        // 这样，下一次 while 循环就不会再找到这个任务了。
        // 我们用一个临时的 "processing" 状态来表示“已被调度，即将开始”。
        item.status = "processing";

        const promise = processFilePipeline(item).finally(() => {
          workers.delete(promise);
          loop();
        });

        workers.add(promise);
      }

      if (workers.size === 0 && !findPendingTask()) {
        isProcessingQueue.value = false;
        console.log("[UPLOADER] 所有文件处理完毕。");
      }
    };

    loop();
  };

  /**
   * @description: 将用户选择的文件或文件夹添加到上传队列中。
   * @param {Pick<UploadItem, "name" | "size" | "file" | "relativePath" | "targetPath">[]} uploads - 要添加的上传项数组。
   * @returns {Promise<void>}
   */
  const addUploadsToQueue = async (
    uploads: Pick<
      UploadItem,
      "name" | "size" | "file" | "relativePath" | "targetPath"
    >[]
  ) => {
    if (!storagePolicy.value) {
      ElMessageBox.alert("没有可用的存储策略，无法上传文件。", "错误", {
        type: "error"
      });
      return;
    }

    if (uploads.length === 0) return;

    const existingFileLogicalPaths = new Set(
      existingFiles.value.map(f => extractLogicalPathFromUri(f.path))
    );

    for (const u of uploads) {
      // 过滤系统文件
      if (ignoredFileNames.has(u.name)) {
        console.log(`[UPLOADER] 忽略系统文件: ${u.name}`);
        continue;
      }

      const uploadLogicalPath = joinPath(u.targetPath, u.relativePath);

      const isAlreadyInQueue = uploadQueue.some(
        item =>
          joinPath(item.targetPath, item.relativePath) === uploadLogicalPath
      );

      if (isAlreadyInQueue) {
        console.warn(
          `文件 "${uploadLogicalPath}" 已存在于上传队列中，跳过添加。`
        );
        continue;
      }

      const isConflictOnServer =
        existingFileLogicalPaths.has(uploadLogicalPath);

      const newItemData: UploadItem = {
        id: Date.now() + Math.random(),
        name: u.name,
        size: u.size,
        status: isConflictOnServer ? "conflict" : "pending",
        progress: 0,
        file: u.file,
        relativePath: u.relativePath,
        targetPath: u.targetPath,
        uploadedSize: 0,
        instantSpeed: 0,
        averageSpeed: 0,
        errorMessage: isConflictOnServer ? "目标位置已存在同名文件" : undefined,
        overwrite: false,
        needsRefresh: true,
        uploadedChunks: new Set()
      };

      const reactiveItem = reactive(newItemData);
      addTask(reactiveItem);
    }

    // 如果调度器当前未运行，则启动它
    if (!isProcessingQueue.value) {
      processUploadQueue();
    }
  };

  /**
   * @description: 根据一个未完成的 FileItem（通常在页面加载时发现）尝试创建并添加一个可续传任务。
   * @param {FileItem} fileItem - 从后端获取的、可能包含未完成上传会话ID的文件项。
   * @returns {Promise<void>}
   */
  const addResumableTaskFromFileItem = async (fileItem: FileItem) => {
    const sessionId = fileItem.metadata?.["sys:upload_session_id"];
    if (!sessionId || uploadQueue.some(item => item.sessionId === sessionId))
      return;

    try {
      const validationRes = await validateUploadSessionApi(sessionId);
      if (
        validationRes &&
        validationRes.code === 200 &&
        validationRes.data.is_valid
      ) {
        const resData = validationRes.data;
        const uploadedSize =
          resData.uploaded_chunks.length * resData.chunk_size;

        const pseudoFile = new File([], fileItem.name, {
          type: "application/octet-stream",
          lastModified: new Date(fileItem.updated_at).getTime()
        });

        const targetPath =
          extractLogicalPathFromUri(fileItem.path).replace(
            `/${fileItem.name}`,
            ""
          ) || "/";

        const resumableData: UploadItem = {
          id: Date.now() + Math.random(),
          name: fileItem.name,
          size: fileItem.size,
          status: "resumable",
          progress: Math.round((uploadedSize / fileItem.size) * 100),
          file: pseudoFile,
          relativePath: fileItem.name,
          targetPath: targetPath,
          sessionId: sessionId,
          totalChunks: resData.total_chunks,
          chunkSize: resData.chunk_size,
          uploadedChunks: new Set(resData.uploaded_chunks),
          errorMessage: "这是一个未完成的上传任务",
          isResuming: true,
          uploadedSize: uploadedSize,
          instantSpeed: 0,
          averageSpeed: 0,
          overwrite: false,
          needsRefresh: true
        };
        const reactiveItem = reactive(resumableData);
        addTask(reactiveItem);
      }
    } catch (e) {
      console.error(`验证会话 ${sessionId} 失败`, e);
    }
  };

  /**
   * @description: 从队列中移除一个任务，并尝试通知后端删除对应的上传会话。
   * @param {number} itemId - 要移除的任务的ID。
   * @returns {Promise<void>}
   */
  const removeItem = async (itemId: number) => {
    const itemToRemove = findTask(itemId);
    if (!itemToRemove) return;

    // 标记为取消状态，这将中断正在进行的上传操作（如分片上传循环）
    itemToRemove.status = "canceled";

    // 如果任务已经创建了会话，则向后端发请求删除会话以释放资源
    if (itemToRemove.sessionId) {
      try {
        await deleteUploadSessionApi(
          itemToRemove.sessionId,
          joinPath(itemToRemove.targetPath, itemToRemove.relativePath)
        );
        console.log(
          `[Uploader] 成功请求删除后端会话: ${itemToRemove.sessionId}`
        );
      } catch (err) {
        console.error(
          `[Uploader] 请求删除后端会话 ${itemToRemove.sessionId} 失败:`,
          err
        );
      }
    }

    removeTask(itemId);
  };

  /**
   * @description: 重试一个失败、冲突或可续传的任务。
   * @param {number} itemId - 要重试的任务的ID。
   * @returns {void}
   */
  const retryItem = (itemId: number) => {
    const item = findTask(itemId);
    if (!item || !["error", "conflict", "resumable"].includes(item.status))
      return;

    // 对于可续传任务，需要用户重新选择原始文件
    if (item.status === "resumable") {
      ElMessageBox.confirm(
        `系统检测到文件 '${item.name}' 上次未上传完成。请重新选择该文件以继续上传。`,
        "继续上传",
        {
          confirmButtonText: "选择文件",
          cancelButtonText: "放弃",
          type: "info"
        }
      )
        .then(() => {
          createFileInput(selectedFiles => {
            const userFile = selectedFiles[0];
            // 通过文件指纹验证用户选择的是否为同一个文件
            if (
              getFileFingerprint(userFile) === `file-${item.name}-${item.size}`
            ) {
              item.file = userFile;
              item.status = "pending";
              item.errorMessage = undefined;
              item.isResuming = false;
              if (!isProcessingQueue.value) {
                processUploadQueue();
              }
            } else {
              ElMessageBox.alert(
                "您选择的文件与待续传的文件不匹配 (文件名或大小不同)。",
                "文件不匹配",
                { confirmButtonText: "好的" }
              );
            }
          });
        })
        .catch(() => {});
      return;
    }

    // 对于普通错误或冲突（在用户选择策略后），重置状态和属性
    item.status = "pending";
    item.errorMessage = undefined;
    item.progress = 0;
    item.uploadedChunks = new Set();
    item.uploadedSize = 0;
    item.sessionId = undefined;
    item.chunkSize = undefined;
    item.totalChunks = undefined;

    // 启动调度器
    if (!isProcessingQueue.value) {
      processUploadQueue();
    }
  };

  /**
   * @description: 重试队列中所有状态为 "error" 的任务。
   * @returns {void}
   */
  const retryAllFailed = () => {
    let hasFailedTasks = false;
    uploadQueue.forEach(item => {
      if (item.status === "error") {
        item.status = "pending";
        item.errorMessage = undefined;
        item.progress = 0;
        item.uploadedChunks = new Set();
        item.uploadedSize = 0;
        item.sessionId = undefined;
        item.chunkSize = undefined;
        item.totalChunks = undefined;
        hasFailedTasks = true;
      }
    });
    if (hasFailedTasks && !isProcessingQueue.value) {
      processUploadQueue();
    }
  };

  /**
   * @description: 解决单个文件的冲突。
   * @param {number} itemId - 冲突任务的ID。
   * @param {"overwrite" | "rename"} strategy - 解决策略：覆盖或重命名。
   * @returns {void}
   */
  const resolveConflict = (
    itemId: number,
    strategy: "overwrite" | "rename"
  ) => {
    const item = findTask(itemId);
    if (!item || item.status !== "conflict") return;
    if (strategy === "overwrite") {
      item.overwrite = true;
      retryItem(itemId); // 将任务交由 retryItem 处理
    } else if (strategy === "rename") {
      ElMessageBox.prompt("请输入新的文件名", "重命名上传", {
        inputValue: `(副本) ${item.name}`,
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputValidator: val => (val ? true : "文件名不能为空")
      })
        .then(({ value }) => {
          const oldPath = item.relativePath;
          const lastSlash = oldPath.lastIndexOf("/");
          // 更新相对路径和文件名
          item.relativePath =
            lastSlash === -1
              ? value
              : `${oldPath.substring(0, lastSlash)}/${value}`;
          item.name = value;
          item.overwrite = false; // 重命名后就不需要覆盖了
          retryItem(itemId); // 将任务交由 retryItem 处理
        })
        .catch(() => {});
    }
  };

  /**
   * @description: 设置全局覆盖选项，并自动重试所有冲突的任务。
   * @param {boolean} overwrite - 是否全局覆盖。
   * @returns {void}
   */
  const setGlobalOverwriteAndRetry = (overwrite: boolean) => {
    globalOverwrite.value = overwrite;
    if (overwrite) {
      uploadQueue.forEach(item => {
        if (item.status === "conflict") {
          item.overwrite = true;
          retryItem(item.id);
        }
      });
    }
  };

  /**
   * @description: 清理已完成的上传任务，是 clearFinishedTasks 的一个包装，用于从UI调用。
   * @returns {void}
   */
  const clearFinishedUploads = () => clearFinishedTasks();

  /**
   * @description: 设置上传并发数。
   * @param {number} num - 新的并发数值 (限制在1到10之间)。
   * @returns {void}
   */
  const setConcurrency = (num: number) => {
    concurrency.value = Math.max(1, Math.min(10, num));
  };

  /**
   * @description: 设置速度显示模式。
   * @param {"instant" | "average"} mode - 'instant' (瞬时) 或 'average' (平均)。
   * @returns {void}
   */
  const setSpeedMode = (mode: "instant" | "average") => {
    speedDisplayMode.value = mode;
  };

  // 返回所有公共状态和方法，供Vue组件使用
  return {
    uploadQueue,
    showUploadProgress,
    concurrency,
    speedDisplayMode,
    addUploadsToQueue,
    addResumableTaskFromFileItem,
    removeItem,
    retryItem,
    retryAllFailed,
    resolveConflict,
    setGlobalOverwriteAndRetry,
    clearFinishedUploads,
    setConcurrency,
    setSpeedMode
  };
}
