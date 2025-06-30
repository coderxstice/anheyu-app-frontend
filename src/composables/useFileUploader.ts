/*
 * @Description: 文件上传核心 Composable，使用任务池(Pool)来管理和调度上传任务，实现高效并行上传。
 * @Author: 安知鱼
 * @Date: 2025-06-27 15:02:40
 * @LastEditTime: 2025-06-30 15:17:41
 * @LastEditors: 安知鱼
 */
import {
  ref,
  computed,
  onUnmounted,
  type ComputedRef,
  shallowRef,
  nextTick
} from "vue";
import { ElMessageBox } from "element-plus";
import type { UploadItem, StoragePolicy, FileItem } from "@/api/sys-file/type";
import {
  deleteUploadSessionApi,
  validateUploadSessionApi
} from "@/api/sys-file/sys-file";
import {
  joinPath,
  extractLogicalPathFromUri,
  getFileFingerprint
} from "@/utils/fileUtils";
import { useUploadQueue } from "./upload.queue";
import { Pool } from "./upload/pool";
import { SessionUploader } from "./upload/session-uploader";
import { ChunkUploader } from "./upload/chunk-uploader";

/**
 * 动态创建一个隐藏的文件输入框，用于触发文件选择对话框。
 * @param callback 用户选择文件后的回调函数
 * @param options 输入框的配置，如多选、接受的文件类型
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
    document.body.removeChild(input);
  };
  document.body.appendChild(input);
  input.click();
}

export function useFileUploader(
  existingFiles: ComputedRef<FileItem[]>,
  storagePolicy: ComputedRef<StoragePolicy | null>,
  onQueueFinished: () => void
) {
  const { uploadQueue, addTask, removeTask, findTask, clearFinishedTasks } =
    useUploadQueue();

  const pool = shallowRef<Pool | null>(null);

  const concurrency = ref(3);
  const globalOverwrite = ref(false);
  const speedDisplayMode = ref<"instant" | "average">("instant");

  let speedInterval: number | null = null;
  let debounceTimer: number | null = null;

  const showUploadProgress = computed(() => uploadQueue.length > 0);

  // --- 内部核心方法 ---

  const startUploadProcess = (item: UploadItem) => {
    if (!pool.value) {
      pool.value = new Pool(concurrency.value);
    }

    item.status = "uploading";
    item.startTime = Date.now();
    item.lastTime = Date.now();
    manageSpeedCalculator();

    const sessionUploader = new SessionUploader(item, {
      storagePolicyId: storagePolicy.value!.id,
      overwrite: item.overwrite || globalOverwrite.value
    });

    pool.value
      .enqueue(sessionUploader)
      .then(() => {
        if (
          item.uploadedChunks &&
          item.totalChunks === item.uploadedChunks.size
        ) {
          return Promise.resolve();
        }

        const chunkPromises: Promise<void>[] = [];
        for (let i = 0; i < item.totalChunks!; i++) {
          if (!item.uploadedChunks?.has(i)) {
            const chunkUploader = new ChunkUploader(item, i);
            const chunkPromise = pool.value!.enqueue(chunkUploader);
            chunkPromises.push(chunkPromise);
          }
        }

        // 【类型修复】使用 .then(() => {}) 将 Promise<void[]> 转换为 Promise<void>
        return Promise.all(chunkPromises).then(() => {});
      })
      .then(() => {
        console.log(
          `[UPLOADER] 文件 ${item.name} 上传流程完成。`,
          item.status,
          item
        );
        if (item.status !== "error" && item.status !== "canceled") {
          nextTick(() => {
            item.status = "success";
          });
          console.log(`[UPLOADER] 文件 ${item.name} 上传成功。`);
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = window.setTimeout(onQueueFinished, 500);
        }
      })
      .catch((error: any) => {
        console.error(`[UPLOADER] 文件 ${item.name} 上传流程失败:`, error);
        if (item.status !== "canceled") {
          // 尝试从不同层级提取最详细的错误信息
          const backendMessage = error?.response?.data?.message;
          const finalErrorMessage =
            backendMessage || error.message || "上传失败";

          item.status = "error";
          item.errorMessage = finalErrorMessage;

          // 判断冲突错误
          const isConflictError =
            error.isConflict ||
            error?.response?.data?.code === 409 ||
            finalErrorMessage.includes("冲突");
          if (isConflictError) {
            item.status = "conflict";
            item.errorMessage = finalErrorMessage
              .replace("创建失败: ", "")
              .replace("创建目录冲突后查询失败: ", ""); // 可以做一些清理
          }
        }
      })
      .finally(() => {
        manageSpeedCalculator();
      });
  };

  const calculateSpeed = () => {
    uploadQueue.forEach(item => {
      if (item.status === "uploading") {
        const now = Date.now();
        const currentSize = item.uploadedSize;
        const instantTimeDiff = (now - (item.lastTime || now)) / 1000;
        const instantSizeDiff = currentSize - (item.lastSize || 0);
        if (instantTimeDiff > 0)
          item.instantSpeed = instantSizeDiff / instantTimeDiff;
        const averageTimeDiff = (now - (item.startTime || now)) / 1000;
        if (averageTimeDiff > 0)
          item.averageSpeed = currentSize / averageTimeDiff;
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
    if (debounceTimer) clearTimeout(debounceTimer);
  });

  // --- 暴露给外部的 API ---

  const addUploadsToQueue = async (
    uploads: Pick<
      UploadItem,
      "name" | "size" | "file" | "relativePath" | "targetPath"
    >[]
  ) => {
    if (uploads.length === 0) return;
    const existingFileNames = new Set(existingFiles.value.map(f => f.name));

    const itemsToStart: UploadItem[] = [];

    for (const u of uploads) {
      const isConflict = existingFileNames.has(u.name);
      // 1. 先准备好数据
      const uploadData: Omit<UploadItem, "id"> = {
        name: u.name,
        size: u.size,
        status: isConflict ? "conflict" : "pending",
        progress: 0,
        file: u.file,
        relativePath: u.relativePath,
        targetPath: u.targetPath,
        uploadedSize: 0,
        instantSpeed: 0,
        averageSpeed: 0,
        errorMessage: isConflict ? "同名文件已存在" : undefined,
        overwrite: false,
        needsRefresh: true,
        uploadedChunks: new Set<number>() // 明确一下 Set 的泛型
        // 如果 UploadItem 中还有其他非可选属性，需要在这里补全
      };

      // 2. 调用 addTask，并获取返回的【响应式对象】
      const reactiveItem = addTask(uploadData);

      // 3. 如果文件不是冲突状态，将【响应式对象】放入待启动列表
      if (!isConflict) {
        itemsToStart.push(reactiveItem);
      }
    }

    // 4. 现在，startUploadProcess 接收到的就是正确的、与UI共享的响应式对象了
    itemsToStart.forEach(startUploadProcess);
  };

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

        const resumableItem: UploadItem = {
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
        addTask(resumableItem);
      }
    } catch (e) {
      console.error(`验证会话 ${sessionId} 失败`, e);
    }
  };

  const removeItem = async (itemId: number) => {
    const itemToRemove = findTask(itemId);
    if (!itemToRemove) return;

    // TODO: 实现更精细的取消逻辑，例如通过 AbortController 真正中断请求
    itemToRemove.status = "canceled";

    if (itemToRemove.sessionId) {
      try {
        await deleteUploadSessionApi(
          itemToRemove.sessionId,
          joinPath(itemToRemove.targetPath, itemToRemove.relativePath)
        );
        console.log(
          `[UPLOADER] 成功请求删除后端会话: ${itemToRemove.sessionId}`
        );
      } catch (err) {
        console.error(
          `[UPLOADER] 请求删除后端会话 ${itemToRemove.sessionId} 失败:`,
          err
        );
      }
    }

    removeTask(itemId);
  };

  const retryItem = (itemId: number) => {
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
              item.isResuming = false;
              startUploadProcess(item);
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

    startUploadProcess(item);
  };

  const retryAllFailed = () => {
    uploadQueue.forEach(item => {
      if (item.status === "error") {
        retryItem(item.id);
      }
    });
  };

  const resolveConflict = (
    itemId: number,
    strategy: "overwrite" | "rename"
  ) => {
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
    if (pool.value) {
      pool.value.limit = concurrency.value;
      pool.value.check();
    }
  };

  const setSpeedMode = (mode: "instant" | "average") => {
    speedDisplayMode.value = mode;
  };

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
