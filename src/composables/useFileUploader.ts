import { ref, reactive, computed, type ComputedRef } from "vue";
import { ElMessageBox } from "element-plus";
import {
  createUploadSessionApi,
  uploadChunkApi,
  deleteUploadSessionApi
} from "@/api/sys-file/sys-file";
import type { UploadItem, StoragePolicy } from "@/api/sys-file/type";
import { joinPath } from "@/utils/fileUtils";

let uploadIdCounter = 0;

/**
 * 一个功能强大的文件上传引擎 (Vue Composable Hook)。
 * 支持队列、并发、分片、重试、错误处理和覆盖策略。
 * @param storagePolicy 一个包含当前存储策略的计算属性引用。
 * @param onQueueFinished 一个回调函数，当上传任务成功并需要刷新列表时被（防抖）调用。
 */
export function useFileUploader(
  storagePolicy: ComputedRef<StoragePolicy | null>,
  onQueueFinished: () => void
) {
  const uploadQueue = reactive<UploadItem[]>([]);
  const isProcessingQueue = ref(false);
  let debounceTimer: number | null = null;

  // --- 可配置状态 ---
  const concurrency = ref(4); // 上传并发数
  const globalOverwrite = ref(false); // 全局覆盖策略

  // --- 计算属性 ---
  const showUploadProgress = computed(() => uploadQueue.length > 0);

  // --- 私有方法 ---
  const _debounceRefresh = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      onQueueFinished();
    }, 500);
  };

  const _uploadFile = async (item: UploadItem) => {
    const controller = new AbortController();
    item.abortController = controller;
    item.status = "uploading";
    item.errorMessage = undefined;

    try {
      if (!storagePolicy.value?.id) {
        throw new Error("存储策略不可用，无法开始上传。");
      }

      const uploadLogicalPath = joinPath(item.targetPath, item.relativePath);
      const shouldUseOverwrite = item.overwrite || globalOverwrite.value;

      const sessionRes = await createUploadSessionApi(
        uploadLogicalPath,
        item.size,
        storagePolicy.value.id,
        shouldUseOverwrite
      );

      // 假设 API 对文件冲突返回特定代码，例如 409
      if (sessionRes.code === 409) {
        throw new Error("conflict:同名对象已存在");
      }
      if (sessionRes.code !== 200) {
        throw new Error(sessionRes.message || "创建上传会话失败");
      }

      const { session_id, chunk_size } = sessionRes.data;
      item.sessionId = session_id;
      const totalChunks = Math.ceil(item.size / chunk_size);
      item.totalChunks = totalChunks;

      const chunkIndexes = Array.from({ length: totalChunks }, (_, i) => i);
      const promises: Promise<void>[] = [];

      const worker = async () => {
        while (true) {
          if (controller.signal.aborted)
            throw new DOMException("Aborted", "AbortError");
          const chunkIndex = chunkIndexes.shift();
          if (chunkIndex === undefined) break;

          try {
            const start = chunkIndex * chunk_size;
            const end = Math.min(start + chunk_size, item.size);
            const chunk = item.file.slice(start, end);
            await uploadChunkApi(session_id, chunkIndex, chunk);
            item.uploadedChunks.add(chunkIndex);
            item.progress = Math.round(
              (item.uploadedChunks.size / totalChunks) * 100
            );
          } catch (err) {
            chunkIndexes.push(chunkIndex);
            throw err;
          }
        }
      };

      for (let i = 0; i < concurrency.value; i++) {
        promises.push(worker());
      }
      await Promise.all(promises);

      item.progress = 100;
      item.status = "success";

      if (item.needsRefresh) {
        _debounceRefresh();
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error(`上传文件 ${item.name} 失败:`, error);
      }
      throw error;
    } finally {
      delete item.abortController;
    }
  };

  const processUploadQueue = async () => {
    if (isProcessingQueue.value) return;
    isProcessingQueue.value = true;
    try {
      while (true) {
        const currentItem = uploadQueue.find(item => item.status === "pending");
        if (!currentItem) break;

        try {
          await _uploadFile(currentItem);
        } catch (error: any) {
          if (error.message?.startsWith("conflict:")) {
            currentItem.status = "conflict";
            currentItem.errorMessage = error.message.replace("conflict:", "");
          } else if (error.name !== "AbortError") {
            currentItem.status = "error";
            currentItem.errorMessage = error.message || "未知上传错误";
          }
        }
      }
    } finally {
      isProcessingQueue.value = false;
    }
  };

  // --- 公共 API 方法 ---

  const addUploadsToQueue = (
    uploads: Omit<
      UploadItem,
      | "id"
      | "status"
      | "progress"
      | "uploadedChunks"
      | "abortController"
      | "overwrite"
    >[]
  ) => {
    if (uploads.length === 0) {
      console.warn("[Uploader] addUploadsToQueue 被调用，但传入的列表为空。");
      return;
    }

    const newUploadItems: UploadItem[] = uploads.map(u => ({
      ...u,
      id: uploadIdCounter++,
      status: "pending",
      progress: 0,
      uploadedChunks: new Set(),
      overwrite: false // 默认不覆盖
    }));

    uploadQueue.push(...newUploadItems);
    processUploadQueue();
  };

  const removeItem = async (itemId: number) => {
    const itemIndex = uploadQueue.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;
    const itemToRemove = uploadQueue[itemIndex];

    // 如果任务正在上传，则中止它
    if (itemToRemove.status === "uploading" && itemToRemove.abortController) {
      itemToRemove.abortController.abort();
    }
    // 如果任务已创建会话，则通知后端删除
    if (itemToRemove.sessionId) {
      try {
        await deleteUploadSessionApi(
          itemToRemove.sessionId,
          joinPath(itemToRemove.targetPath, itemToRemove.relativePath)
        );
      } catch (err) {
        console.error(`删除后端会话 ${itemToRemove.sessionId} 失败:`, err);
      }
    }
    uploadQueue.splice(itemIndex, 1);
  };

  const retryItem = (itemId: number) => {
    const item = uploadQueue.find(item => item.id === itemId);
    // 只重试错误或冲突的任务
    if (item && (item.status === "error" || item.status === "conflict")) {
      item.status = "pending";
      item.errorMessage = undefined;
      item.progress = 0;
      processUploadQueue();
    }
  };

  const retryAllFailed = () => {
    uploadQueue.forEach(item => {
      if (item.status === "error") {
        item.status = "pending";
        item.errorMessage = undefined;
        item.progress = 0;
      }
    });
    processUploadQueue();
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
        // 简单的文件名验证
        inputValidator: val => (val ? true : "文件名不能为空")
      })
        .then(({ value }) => {
          // 注意：如果文件在子目录中，这里需要更复杂的路径处理
          // 假设 webkitRelativePath 是 "folder/file.txt"
          const oldPath = item.relativePath;
          const lastSlash = oldPath.lastIndexOf("/");
          const newRelativePath =
            lastSlash === -1
              ? value
              : `${oldPath.substring(0, lastSlash)}/${value}`;

          item.name = value; // UI上显示新名字
          item.relativePath = newRelativePath; // 上传时用新路径
          retryItem(itemId);
        })
        .catch(() => {});
    }
  };

  const setGlobalOverwriteAndRetry = (overwrite: boolean) => {
    globalOverwrite.value = overwrite;
    // 如果开启全局覆盖，则重试所有冲突的文件
    if (overwrite) {
      uploadQueue.forEach(item => {
        if (item.status === "conflict") {
          retryItem(item.id);
        }
      });
    }
  };

  const clearFinishedUploads = () => {
    const activeUploads = uploadQueue.filter(
      item =>
        item.status === "pending" ||
        item.status === "uploading" ||
        item.status === "error" ||
        item.status === "conflict"
    );
    uploadQueue.splice(0, uploadQueue.length, ...activeUploads);
  };

  return {
    // 状态
    uploadQueue,
    showUploadProgress,
    concurrency, // 暴露出去以便设置

    // 方法
    addUploadsToQueue,
    removeItem,
    retryItem,
    retryAllFailed,
    resolveConflict,
    setGlobalOverwriteAndRetry,
    clearFinishedUploads
  };
}
