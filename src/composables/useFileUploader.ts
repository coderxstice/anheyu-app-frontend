import { ref, computed, onUnmounted, type ComputedRef } from "vue";
import { ElMessageBox } from "element-plus";
import {
  deleteUploadSessionApi,
  validateUploadSessionApi
} from "@/api/sys-file/sys-file";
import type { UploadItem, StoragePolicy, FileItem } from "@/api/sys-file/type";
import {
  joinPath,
  extractLogicalPathFromUri,
  getFileFingerprint
} from "@/utils/fileUtils";
import { useUploadQueue } from "./upload.queue";
import { uploadFileWorker } from "./upload.worker";

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
  const {
    uploadQueue,
    addTask,
    removeTask,
    findTask,
    findPendingTask,
    clearFinishedTasks
  } = useUploadQueue();
  const isProcessingQueue = ref(false);
  let debounceTimer: number | null = null;
  let speedInterval: number | null = null;

  const concurrency = ref(4); // 文件并发数
  const globalOverwrite = ref(false);
  const speedDisplayMode = ref<"instant" | "average">("instant");

  const showUploadProgress = computed(() => uploadQueue.length > 0);

  const calculateSpeed = () => {
    uploadQueue.forEach(item => {
      if (item.status === "uploading") {
        const now = Date.now();
        const currentSize = item.uploadedSize;
        const instantTimeDiff = (now - (item.lastTime || now)) / 1000;
        const instantSizeDiff = currentSize - (item.lastSize || currentSize);
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
        if (item.status !== "uploading") {
          item.instantSpeed = 0;
        }
      });
    }
  };

  onUnmounted(() => {
    if (speedInterval) clearInterval(speedInterval);
  });

  const _debounceRefresh = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(onQueueFinished, 500);
  };

  const processUploadQueue = async () => {
    if (isProcessingQueue.value) return;
    isProcessingQueue.value = true;
    console.log(`[UPLOADER] 开始处理队列，文件并发数: ${concurrency.value}`);
    const workers = new Set<Promise<any>>();

    while (true) {
      while (workers.size < concurrency.value) {
        const item = findPendingTask();
        if (!item) break;

        console.log(`[UPLOADER] 分配任务: ${item.name}`);
        item.status = "uploading";
        manageSpeedCalculator();

        const promise = uploadFileWorker(item, {
          storagePolicy: storagePolicy.value!,
          overwrite: item.overwrite || globalOverwrite.value
        })
          .then(() => {
            if (item.needsRefresh) _debounceRefresh();
          })
          .catch(error => {
            if (error.message?.startsWith("conflict:")) {
              item.status = "conflict";
              item.errorMessage = error.message.replace("conflict:", "");
            } else if (error.name !== "AbortError") {
              item.status = "error";
              item.errorMessage = error.message || "未知上传错误";
            }
          })
          .finally(() => {
            workers.delete(promise);
            manageSpeedCalculator();
          });
        workers.add(promise);
      }

      if (workers.size === 0 && !findPendingTask()) {
        console.log("[UPLOADER] 队列处理完成。");
        break;
      }

      if (workers.size > 0) {
        await Promise.race(workers);
      }
    }
    isProcessingQueue.value = false;
  };

  const addUploadsToQueue = async (
    uploads: Omit<
      UploadItem,
      | "id"
      | "status"
      | "progress"
      | "uploadedChunks"
      | "abortController"
      | "overwrite"
      | "instantSpeed"
      | "averageSpeed"
      | "uploadedSize"
      | "needsRefresh"
    >[]
  ) => {
    if (uploads.length === 0) return;
    const existingFileNames = new Set(existingFiles.value.map(f => f.name));
    const newUploadItems: Partial<UploadItem>[] = [];

    for (const u of uploads) {
      if (existingFileNames.has(u.name)) {
        newUploadItems.push({
          ...u,
          status: "conflict",
          errorMessage: "同名文件已存在"
        });
        continue;
      }
      newUploadItems.push({ ...u, status: "pending" });
    }

    if (newUploadItems.length > 0) {
      newUploadItems.forEach(u => {
        addTask({
          name: u.name!,
          size: u.size!,
          status: u.status!,
          progress: 0,
          file: u.file!,
          relativePath: u.relativePath!,
          targetPath: u.targetPath!,
          uploadedSize: 0,
          instantSpeed: 0,
          averageSpeed: 0,
          errorMessage: u.errorMessage,
          overwrite: false,
          needsRefresh: true,
          uploadedChunks: new Set()
        });
      });
      if (!isProcessingQueue.value) processUploadQueue();
    }
  };

  const addResumableTaskFromFileItem = async (fileItem: FileItem) => {
    const sessionId = fileItem.metadata?.["sys:upload_session_id"];
    if (!sessionId) return;
    if (uploadQueue.some(item => item.sessionId === sessionId)) return;
    try {
      const validationRes = await validateUploadSessionApi(sessionId);
      const resData = validationRes.data;
      if (validationRes.code === 200 && resData.is_valid) {
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
        addTask({
          name: fileItem.name,
          size: fileItem.size,
          status: "resumable",
          progress: Math.round((uploadedSize / fileItem.size) * 100),
          file: pseudoFile,
          relativePath: fileItem.name,
          targetPath: targetPath,
          sessionId: sessionId,
          totalChunks: resData.total_chunks,
          uploadedChunks: new Set(resData.uploaded_chunks),
          errorMessage: "这是一个未完成的上传任务",
          isResuming: true,
          uploadedSize: uploadedSize,
          instantSpeed: 0,
          averageSpeed: 0,
          overwrite: false,
          needsRefresh: true
        });
      }
    } catch (e) {
      console.error(`验证会话 ${sessionId} 失败`, e);
    }
  };

  const removeItem = async (itemId: number) => {
    const itemToRemove = findTask(itemId);
    if (!itemToRemove) return;
    const { status, abortController, sessionId, targetPath, relativePath } =
      itemToRemove;
    if (status !== "success" && status !== "canceled") {
      if (abortController) {
        abortController.abort();
        itemToRemove.status = "canceled";
      }
      if (sessionId) {
        try {
          await deleteUploadSessionApi(
            sessionId,
            joinPath(targetPath, relativePath)
          );
          console.log(`[Uploader] 成功请求删除后端会话: ${sessionId}`);
        } catch (err) {
          console.error(`[Uploader] 请求删除后端会话 ${sessionId} 失败:`, err);
        }
      }
    }
    removeTask(itemId);
  };

  const retryItem = (itemId: number) => {
    const item = findTask(itemId);
    if (!item) return;
    const status = item.status;
    if (!["error", "conflict", "resumable"].includes(status)) return;

    if (status === "resumable") {
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
            const originalFingerprint = `file-${item.name}-${item.size}`;
            const newUserFileFingerprint = getFileFingerprint(userFile);
            if (originalFingerprint === newUserFileFingerprint) {
              item.file = userFile;
              item.status = "pending";
              item.errorMessage = undefined;
              item.instantSpeed = 0;
              item.averageSpeed = 0;
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

    item.progress = 0;
    item.uploadedChunks = new Set();
    item.uploadedSize = 0;
    item.status = "pending";
    item.errorMessage = undefined;
    item.instantSpeed = 0;
    item.averageSpeed = 0;
    if (!isProcessingQueue.value) processUploadQueue();
  };

  const retryAllFailed = () => {
    uploadQueue.forEach(item => {
      if (item.status === "error") {
        item.status = "pending";
        item.errorMessage = undefined;
        item.progress = 0;
        item.uploadedChunks = new Set();
        item.uploadedSize = 0;
        item.instantSpeed = 0;
        item.averageSpeed = 0;
      }
    });
    if (!isProcessingQueue.value) processUploadQueue();
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
          const newRelativePath =
            lastSlash === -1
              ? value
              : `${oldPath.substring(0, lastSlash)}/${value}`;
          item.name = value;
          item.relativePath = newRelativePath;
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

  const clearFinishedUploads = () => {
    clearFinishedTasks();
  };

  const setConcurrency = (newConcurrency: number) => {
    const num = Math.max(1, Math.min(10, newConcurrency));
    concurrency.value = num;
    if (!isProcessingQueue.value) processUploadQueue();
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
