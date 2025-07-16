/*
 * @Description: 文件上传核心 Composable，实现文件级流畅并行，并通过路径创建锁解决后端死锁问题，同时过滤系统文件。
 * @Author: 安知鱼
 * @Date: 2025-07-01 04:30:00
 * @LastEditTime: 2025-07-16 18:17:53
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
import { constant } from "@/constant";

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
  const {
    uploadQueue,
    addTask,
    removeTask,
    findTask,
    findPendingTask,
    clearFinishedTasks
  } = useUploadQueue();

  const concurrency = ref(4);
  const isProcessingQueue = ref(false);
  const globalOverwrite = ref(false);
  const speedDisplayMode = ref<"instant" | "average">("instant");

  const pathCreationLock = new Map<string, Promise<any>>();
  let lastApiCallTimestamp = 0;
  const API_CALL_INTERVAL = 20;
  let speedInterval: number | null = null;

  const showUploadProgress = computed(() => uploadQueue.length > 0);
  const ignoredFileNames = new Set([".DS_Store", "Thumbs.db"]);

  const calculateSpeed = () => {
    uploadQueue.forEach(item => {
      if (item.status === "uploading") {
        const now = Date.now();
        const currentSize = item.uploadedSize;
        const instantTimeDiff = (now - (item.lastTime || now)) / 1000;
        const instantSizeDiff = currentSize - (item.lastSize || 0);
        if (instantTimeDiff > 0) {
          item.instantSpeed = instantSizeDiff / instantTimeDiff;
        }
        const averageTimeDiff = (now - (item.startTime || now)) / 1000;
        if (averageTimeDiff > 0) {
          item.averageSpeed = currentSize / averageTimeDiff;
        }
        item.lastTime = now;
        item.lastSize = currentSize;
      } else {
        item.instantSpeed = 0;
      }
    });
  };

  const manageSpeedCalculator = () => {
    const isUploading = uploadQueue.some(item => item.status === "uploading");
    if (isUploading && !speedInterval) {
      speedInterval = window.setInterval(calculateSpeed, 1000);
    } else if (!isUploading && speedInterval) {
      clearInterval(speedInterval);
      speedInterval = null;
      uploadQueue.forEach(item => {
        if (item.status !== "uploading") item.instantSpeed = 0;
      });
    }
  };

  onUnmounted(() => {
    if (speedInterval) clearInterval(speedInterval);
  });

  const createSessionWithLock = async (item: UploadItem): Promise<void> => {
    const parentPath = getParentPath(
      joinPath(item.targetPath, item.relativePath)
    );
    while (pathCreationLock.has(parentPath)) {
      await pathCreationLock.get(parentPath);
    }
    const promise = (async () => {
      try {
        const now = Date.now();
        const timeSinceLastCall = now - lastApiCallTimestamp;
        if (timeSinceLastCall < API_CALL_INTERVAL) {
          const delay = API_CALL_INTERVAL - timeSinceLastCall;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
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
        const sessionData = sessionRes.data;

        // 1. 获取 chunk_size，如果后端没有返回，则使用前端的默认值作为回退
        const chunkSize = sessionData.chunk_size || constant.DEFAULT_CHUNK_SIZE;
        item.chunkSize = chunkSize;
        item.totalChunks = Math.ceil(item.size / chunkSize);

        // 2. 判断上传模式并赋值相应字段
        if (sessionData.upload_method === "client") {
          item.uploadMethod = "client";
          item.uploadUrl = sessionData.upload_url;
          // 在客户端模式下，sessionId 不是必须的，可以不赋值或设为 undefined
          item.sessionId = undefined;
        } else {
          // 默认为服务端中转模式
          item.uploadMethod = "server";
          item.sessionId = sessionData.session_id;
          item.uploadUrl = undefined;
        }
      } finally {
        pathCreationLock.delete(parentPath);
      }
    })();
    pathCreationLock.set(parentPath, promise);
    return promise;
  };

  const processFilePipeline = async (item: UploadItem): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      item.status = "uploading";
      item.startTime = Date.now();
      manageSpeedCalculator();
      await createSessionWithLock(item);
      await uploadFileChunksWorker(item);
    } catch (error: any) {
      if (item.status !== "canceled") {
        item.status = error.isConflict ? "conflict" : "error";
        item.errorMessage = error.message || "未知错误";
      }
    } finally {
      manageSpeedCalculator();
    }
  };

  const processUploadQueue = async () => {
    if (isProcessingQueue.value) return;
    isProcessingQueue.value = true;
    const workers = new Set<Promise<void>>();
    let hasSuccessfulUploads = false;
    const loop = () => {
      while (workers.size < concurrency.value) {
        const item = findPendingTask();
        if (!item) break;
        item.status = "processing";
        const promise = processFilePipeline(item).finally(() => {
          if (item.status === "success" && item.needsRefresh) {
            hasSuccessfulUploads = true;
          }
          workers.delete(promise);
          loop();
        });
        workers.add(promise);
      }
      if (workers.size === 0 && !findPendingTask()) {
        isProcessingQueue.value = false;
        if (hasSuccessfulUploads) {
          onQueueFinished();
        }
      }
    };
    loop();
  };

  const addUploadsToQueue = async (
    uploads: Pick<
      UploadItem,
      "name" | "size" | "file" | "relativePath" | "targetPath"
    >[]
  ): Promise<boolean> => {
    if (!storagePolicy.value) {
      ElMessageBox.alert("没有可用的存储策略，无法上传文件。", "错误", {
        type: "error"
      });
      return false;
    }
    if (uploads.length === 0) return false;
    const existingFileLogicalPaths = new Set(
      existingFiles.value.map(f => extractLogicalPathFromUri(f.path))
    );
    let addedCount = 0;
    for (const u of uploads) {
      if (ignoredFileNames.has(u.name)) continue;
      const uploadLogicalPath = joinPath(u.targetPath, u.relativePath);
      const isAlreadyInQueue = uploadQueue.some(
        item =>
          joinPath(item.targetPath, item.relativePath) === uploadLogicalPath
      );
      if (isAlreadyInQueue) continue;
      const isConflictOnServer =
        existingFileLogicalPaths.has(uploadLogicalPath);
      const newItemData: UploadItem = {
        id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // 生成字符串ID
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
      addedCount++;
    }
    const hasAddedTasks = addedCount > 0;
    if (hasAddedTasks && !isProcessingQueue.value) {
      processUploadQueue();
    }
    return hasAddedTasks;
  };

  const addResumableTaskFromFileItem = async (fileItem: FileItem) => {
    const sessionId = fileItem.metadata?.["sys:upload_session_id"];
    if (!sessionId || uploadQueue.some(item => item.sessionId === sessionId))
      return;
    try {
      const validationRes = await validateUploadSessionApi(sessionId);
      if (validationRes?.code === 200 && validationRes.data.is_valid) {
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
          id: `resumable-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // 生成字符串ID
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

  const removeItem = async (itemId: string) => {
    // 参数类型为 string
    const itemToRemove = findTask(itemId);
    if (!itemToRemove) return;
    itemToRemove.status = "canceled";
    if (itemToRemove.sessionId) {
      try {
        await deleteUploadSessionApi(
          itemToRemove.sessionId,
          joinPath(itemToRemove.targetPath, itemToRemove.relativePath)
        );
      } catch (err) {
        console.error(`请求删除后端会话 ${itemToRemove.sessionId} 失败:`, err);
      }
    }
    removeTask(itemId);
  };

  const retryItem = (itemId: string) => {
    // 参数类型为 string
    const item = findTask(itemId);
    if (!item || !["error", "conflict", "resumable"].includes(item.status))
      return;
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
            if (
              getFileFingerprint(userFile) === `file-${item.name}-${item.size}`
            ) {
              item.file = userFile;
              item.status = "pending";
              item.errorMessage = undefined;
              item.isResuming = false;
              if (!isProcessingQueue.value) processUploadQueue();
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
    item.status = "pending";
    item.errorMessage = undefined;
    item.progress = 0;
    item.uploadedChunks = new Set();
    item.uploadedSize = 0;
    item.sessionId = undefined;
    item.chunkSize = undefined;
    item.totalChunks = undefined;
    if (!isProcessingQueue.value) {
      processUploadQueue();
    }
  };

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

  const resolveConflict = (
    itemId: string,
    strategy: "overwrite" | "rename"
  ) => {
    // 参数类型为 string
    const item = findTask(itemId);
    if (!item || item.status !== "conflict") return;
    if (strategy === "overwrite") {
      item.overwrite = true;
      retryItem(itemId);
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
          item.relativePath =
            lastSlash === -1
              ? value
              : `${oldPath.substring(0, lastSlash)}/${value}`;
          item.name = value;
          item.overwrite = false;
          retryItem(itemId);
        })
        .catch(() => {});
    }
  };

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

  const clearFinishedUploads = () => clearFinishedTasks();
  const setConcurrency = (num: number) => {
    concurrency.value = Math.max(1, Math.min(10, num));
  };
  const setSpeedMode = (mode: "instant" | "average") => {
    speedDisplayMode.value = mode;
  };

  return {
    uploadQueue,
    showUploadProgress,
    concurrency,
    speedDisplayMode,
    globalOverwrite,
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
