import {
  ref,
  reactive,
  computed,
  onMounted,
  onUnmounted,
  type ComputedRef
} from "vue";
import { ElMessageBox } from "element-plus";
import {
  createUploadSessionApi,
  uploadChunkApi,
  deleteUploadSessionApi,
  validateUploadSessionApi
} from "@/api/sys-file/sys-file";
import type { UploadItem, StoragePolicy, FileItem } from "@/api/sys-file/type";
import {
  joinPath,
  getFileFingerprint,
  uploadProgressStorage
} from "@/utils/fileUtils";

let uploadIdCounter = 0;

export function useFileUploader(
  existingFiles: ComputedRef<FileItem[]>,
  storagePolicy: ComputedRef<StoragePolicy | null>,
  onQueueFinished: () => void
) {
  const uploadQueue = reactive<UploadItem[]>([]);
  const isProcessingQueue = ref(false);
  let debounceTimer: number | null = null;
  let speedInterval: number | null = null;

  const concurrency = ref(4);
  const globalOverwrite = ref(false);
  const speedDisplayMode = ref<"instant" | "average">("instant");

  const showUploadProgress = computed(() => uploadQueue.length > 0);

  const calculateSpeed = () => {
    uploadQueue.forEach(item => {
      if (item.status === "uploading") {
        const now = Date.now();
        const currentSize = item.uploadedSize;

        // 计算瞬时速度
        const instantTimeDiff = (now - (item.lastTime || now)) / 1000;
        const instantSizeDiff = currentSize - (item.lastSize || currentSize);
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

  onMounted(() => {
    restoreInterruptedUploads();
  });

  onUnmounted(() => {
    if (speedInterval) clearInterval(speedInterval);
  });

  const _debounceRefresh = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      onQueueFinished();
    }, 500);
  };

  const _uploadFile = async (item: UploadItem) => {
    const controller = new AbortController();
    item.abortController = controller;
    item.errorMessage = undefined;

    const fileFingerprint = getFileFingerprint(item.file);
    const uploadLogicalPath = joinPath(item.targetPath, item.relativePath);

    try {
      if (!storagePolicy.value?.id) {
        throw new Error("存储策略不可用。");
      }

      let chunkSize: number;
      let totalChunks: number;

      item.startTime = Date.now();
      item.lastSize = item.uploadedSize;
      item.lastTime = item.startTime;

      if (!item.sessionId) {
        const shouldUseOverwrite = item.overwrite || globalOverwrite.value;
        const sessionRes = await createUploadSessionApi(
          uploadLogicalPath,
          item.size,
          storagePolicy.value.id,
          shouldUseOverwrite
        );

        if (sessionRes.code !== 200) {
          const isConflictError =
            sessionRes.code === 409 ||
            (sessionRes.message || "").includes("exists") ||
            (sessionRes.message || "").includes("存在");
          if (isConflictError) throw new Error("conflict:同名对象已存在");
          throw new Error(sessionRes.message || "创建上传会话失败");
        }

        const { session_id, chunk_size } = sessionRes.data;
        item.sessionId = session_id;
        chunkSize = chunk_size;
        item.totalChunks = Math.ceil(item.size / chunkSize);
        totalChunks = item.totalChunks;

        uploadProgressStorage.set(fileFingerprint, {
          sessionId: session_id,
          totalChunks: item.totalChunks,
          uploadedChunks: [],
          uploadPath: uploadLogicalPath,
          name: item.name,
          size: item.size,
          lastModified: item.file.lastModified,
          chunkSize: chunkSize
        });
      } else {
        const validationRes = await validateUploadSessionApi(item.sessionId);
        const resData = validationRes.data;
        if (!(validationRes.code === 200 && resData.is_valid)) {
          uploadProgressStorage.remove(fileFingerprint);
          item.sessionId = undefined;
          item.uploadedChunks = new Set();
          throw new Error("无法恢复上传会话，会话已失效。");
        }
        chunkSize = resData.chunk_size;
        totalChunks = item.totalChunks!;
      }

      if (!item.sessionId || !totalChunks) {
        throw new Error("上传会话信息不完整。");
      }

      const allChunkIndexes = Array.from({ length: totalChunks }, (_, i) => i);
      const chunksToUpload = allChunkIndexes.filter(
        index => !item.uploadedChunks?.has(index)
      );

      const chunkPromises = chunksToUpload.map(chunkIndex => async () => {
        if (controller.signal.aborted)
          throw new DOMException("Aborted", "AbortError");

        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, item.size);
        const chunk = item.file.slice(start, end);

        await uploadChunkApi(item.sessionId!, chunkIndex, chunk);

        item.uploadedChunks?.add(chunkIndex);
        item.uploadedSize += chunk.size;
        item.progress = Math.round((item.uploadedSize / item.size) * 100);

        const currentRecord = uploadProgressStorage.get(fileFingerprint);
        if (currentRecord) {
          currentRecord.uploadedChunks = Array.from(item.uploadedChunks!);
          uploadProgressStorage.set(fileFingerprint, currentRecord);
        }
      });

      const chunkConcurrency = Math.min(concurrency.value, totalChunks);
      for (let i = 0; i < chunkPromises.length; i += chunkConcurrency) {
        const batch = chunkPromises.slice(i, i + chunkConcurrency);
        await Promise.all(batch.map(p => p()));
      }

      item.progress = 100;
      item.status = "success";
      uploadProgressStorage.remove(fileFingerprint);
      if (item.needsRefresh) _debounceRefresh();
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error(`上传文件 ${item.name} 失败:`, error);
      }
      throw error;
    } finally {
      item.instantSpeed = 0;
      delete item.abortController;
    }
  };

  const processUploadQueue = async () => {
    if (isProcessingQueue.value) return;
    isProcessingQueue.value = true;
    const workers = new Set<Promise<any>>();
    const startTask = (item: UploadItem) => {
      const promise = _uploadFile(item)
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
    };
    while (
      uploadQueue.some(item => item.status === "pending") ||
      workers.size > 0
    ) {
      const availableSlots = concurrency.value - workers.size;
      if (availableSlots > 0) {
        const itemsToStart = uploadQueue
          .filter(item => item.status === "pending")
          .slice(0, availableSlots);
        for (const item of itemsToStart) {
          item.status = "uploading";
          manageSpeedCalculator();
          startTask(item);
        }
      }
      if (workers.size > 0) {
        await Promise.race(workers);
      } else {
        break;
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
    >[]
  ) => {
    if (uploads.length === 0) return;

    const existingFileNames = new Set(existingFiles.value.map(f => f.name));
    const newUploadItems: UploadItem[] = [];

    for (const u of uploads) {
      const fingerprint = getFileFingerprint(u.file);
      const oldRecord = uploadProgressStorage.get(fingerprint);
      const uploadLogicalPath = joinPath(u.targetPath, u.relativePath);
      let isResumable = false;

      if (oldRecord && oldRecord.uploadPath === uploadLogicalPath) {
        try {
          const validationRes = await validateUploadSessionApi(
            oldRecord.sessionId
          );
          const resData = validationRes.data;
          if (validationRes.code === 200 && resData.is_valid) {
            const uploadedSize =
              resData.uploaded_chunks.length * resData.chunk_size;
            newUploadItems.push({
              ...u,
              id: uploadIdCounter++,
              status: "resumable",
              progress: Math.round((uploadedSize / oldRecord.size) * 100),
              sessionId: oldRecord.sessionId,
              totalChunks: resData.total_chunks,
              uploadedChunks: new Set(resData.uploaded_chunks),
              errorMessage: `该任务上次上传中断，可继续。`,
              uploadedSize: uploadedSize,
              instantSpeed: 0,
              averageSpeed: 0,
              isResuming: true
            });
            isResumable = true;
          } else {
            uploadProgressStorage.remove(fingerprint);
          }
        } catch (e) {
          console.error("验证 session 失败，将作为新任务处理", e);
          uploadProgressStorage.remove(fingerprint);
        }
      }

      if (isResumable) {
        continue;
      }

      if (existingFileNames.has(u.name)) {
        newUploadItems.push({
          ...u,
          id: uploadIdCounter++,
          status: "conflict",
          progress: 0,
          errorMessage: "同名文件已存在",
          uploadedChunks: new Set(),
          uploadedSize: 0,
          instantSpeed: 0,
          averageSpeed: 0
        });
        continue;
      }

      newUploadItems.push({
        ...u,
        id: uploadIdCounter++,
        status: "pending",
        progress: 0,
        uploadedChunks: new Set(),
        uploadedSize: 0,
        instantSpeed: 0,
        averageSpeed: 0
      });
    }

    if (newUploadItems.length > 0) {
      uploadQueue.push(...newUploadItems);
      if (!isProcessingQueue.value) {
        processUploadQueue();
      }
    }
  };

  const removeItem = async (itemId: number) => {
    const itemIndex = uploadQueue.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;
    const itemToRemove = uploadQueue[itemIndex];

    const fingerprint = getFileFingerprint(itemToRemove.file);
    uploadProgressStorage.remove(fingerprint);

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
          console.log(`[Uploader] 成功删除后端会话: ${sessionId}`);
        } catch (err) {
          console.error(`[Uploader] 删除后端会话 ${sessionId} 失败:`, err);
        }
      }
    }
    uploadQueue.splice(itemIndex, 1);
  };

  const retryItem = (itemId: number) => {
    const item = uploadQueue.find(item => item.id === itemId);
    if (item && ["error", "conflict", "resumable"].includes(item.status)) {
      if (item.status === "resumable" && item.file.size === 0) {
        ElMessageBox.alert(
          "这是一个已恢复的上传任务。请通过“上传文件”按钮重新选择相同的文件以继续上传。",
          "操作提示",
          { confirmButtonText: "好的" }
        );
        return;
      }

      const isResumable = item.status === "resumable";
      if (!isResumable) {
        item.progress = 0;
        item.uploadedChunks = new Set();
        item.uploadedSize = 0;
      }

      item.status = "pending";
      item.errorMessage = undefined;
      item.instantSpeed = 0;
      item.averageSpeed = 0;

      if (!isProcessingQueue.value) {
        processUploadQueue();
      }
    }
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
    if (!isProcessingQueue.value) {
      processUploadQueue();
    }
  };

  const resolveConflict = (
    itemId: number,
    strategy: "overwrite" | "rename"
  ) => {
    const item = uploadQueue.find(item => item.id === itemId);
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
    const activeUploads = uploadQueue.filter(
      item => !["success", "canceled"].includes(item.status)
    );
    uploadQueue.splice(0, uploadQueue.length, ...activeUploads);
  };

  const setConcurrency = (newConcurrency: number) => {
    const num = Math.max(1, Math.min(10, newConcurrency));
    concurrency.value = num;
    if (!isProcessingQueue.value) {
      processUploadQueue();
    }
  };

  const setSpeedMode = (mode: "instant" | "average") => {
    speedDisplayMode.value = mode;
  };

  const restoreInterruptedUploads = () => {
    const allRecords = uploadProgressStorage.getAll();
    const restoredItems: UploadItem[] = [];

    for (const fingerprint in allRecords) {
      const record = allRecords[fingerprint];
      const pseudoFile = new File([], record.name, {
        type: "application/octet-stream",
        lastModified: record.lastModified
      });
      const uploadedSize =
        record.uploadedChunks.length * (record.chunkSize || 0);

      restoredItems.push({
        id: uploadIdCounter++,
        name: record.name,
        size: record.size,
        status: "resumable",
        progress: Math.round((uploadedSize / record.size) * 100) || 0,
        file: pseudoFile,
        relativePath: record.uploadPath.split("/").pop() || record.name,
        targetPath:
          record.uploadPath.substring(0, record.uploadPath.lastIndexOf("/")) ||
          "/",
        sessionId: record.sessionId,
        totalChunks: record.totalChunks,
        uploadedChunks: new Set(record.uploadedChunks),
        errorMessage: "该任务上次未完成，可继续上传。",
        overwrite: false,
        needsRefresh: true,
        uploadedSize: uploadedSize,
        instantSpeed: 0,
        averageSpeed: 0,
        isResuming: true
      });
    }

    if (restoredItems.length > 0) {
      console.log(
        `[Uploader] 恢复了 ${restoredItems.length} 个未完成的上传任务。`
      );
      uploadQueue.push(...restoredItems);
    }
  };

  return {
    uploadQueue,
    showUploadProgress,
    concurrency,
    speedDisplayMode,
    addUploadsToQueue,
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
