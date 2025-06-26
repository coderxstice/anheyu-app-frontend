import { ref, reactive, computed, type ComputedRef } from "vue";
// ElMessage 已被移除，因为这个 hook 不应直接负责 UI 提示
// 如果你确实需要它，请在 catch 块中添加调用
import {
  createUploadSessionApi,
  uploadChunkApi,
  deleteUploadSessionApi
} from "@/api/sys-file/sys-file";
import type { UploadItem, StoragePolicy } from "@/api/sys-file/type";
import { joinPath } from "@/utils/fileUtils";

let uploadIdCounter = 0;

/**
 * 一个管理文件上传队列和流程的 Vue Composable (Hook)。
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

  const showUploadProgress = computed(() => uploadQueue.length > 0);

  // 对刷新操作进行防抖处理，避免短时间内多次连续上传完成导致频繁刷新
  const _debounceRefresh = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      onQueueFinished();
    }, 500);
  };

  const addUploadsToQueue = (
    uploads: Omit<
      UploadItem,
      "id" | "status" | "progress" | "uploadedChunks" | "abortController"
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
      uploadedChunks: new Set()
    }));

    uploadQueue.push(...newUploadItems);
    processUploadQueue();
  };

  const _uploadFile = async (item: UploadItem) => {
    const controller = new AbortController();
    item.abortController = controller;
    item.status = "uploading";
    item.errorMessage = undefined; // 重置错误信息

    try {
      if (!storagePolicy.value?.id) {
        throw new Error("存储策略不可用，无法开始上传。");
      }

      const uploadLogicalPath = joinPath(item.targetPath, item.relativePath);
      const sessionRes = await createUploadSessionApi(
        uploadLogicalPath,
        item.size,
        storagePolicy.value.id
      );

      if (sessionRes.code !== 200) {
        throw new Error(sessionRes.message || "创建上传会话失败。");
      }

      const { session_id, chunk_size } = sessionRes.data;
      item.sessionId = session_id;
      const totalChunks = Math.ceil(item.size / chunk_size);
      item.totalChunks = totalChunks;

      const CONCURRENT_CHUNKS = 4;
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
            // 如果分片上传失败，将其重新放回队列以便重试
            chunkIndexes.push(chunkIndex);
            throw err;
          }
        }
      };

      for (let i = 0; i < CONCURRENT_CHUNKS; i++) {
        promises.push(worker());
      }
      await Promise.all(promises);

      item.progress = 100;
      item.status = "success";

      // 如果这个上传项被标记为需要刷新，则调用防抖刷新函数
      if (item.needsRefresh) {
        _debounceRefresh();
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error(`上传文件 ${item.name} 失败:`, error);
        // 更新条目状态以在 UI 中反映错误
        item.status = "error";
        item.errorMessage = error.message || "未知上传错误";
      }
      // 重新抛出错误，以便被队列处理器捕获和处理
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
        // 查找下一个待处理的上传项
        const currentItem = uploadQueue.find(item => item.status === "pending");
        if (!currentItem) break; // 队列处理完毕

        try {
          await _uploadFile(currentItem);
        } catch (error: any) {
          // 捕获由 _uploadFile 抛出的错误
          // 如果不是用户主动中止，则标记为错误状态
          if (error.name !== "AbortError") {
            currentItem.status = "error";
            // 错误消息已经在 _uploadFile 中设置好了
          }
        }
      }
    } finally {
      isProcessingQueue.value = false;
    }
  };

  const cancelUpload = async (itemId: number) => {
    const itemIndex = uploadQueue.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;
    const itemToCancel = uploadQueue[itemIndex];

    if (itemToCancel.status === "uploading" && itemToCancel.abortController) {
      itemToCancel.abortController.abort();
      itemToCancel.status = "canceled"; // 更新状态为已取消
    }

    if (itemToCancel.sessionId) {
      try {
        await deleteUploadSessionApi(
          itemToCancel.sessionId,
          joinPath(itemToCancel.targetPath, itemToCancel.relativePath)
        );
      } catch (error) {
        console.error(`删除后端会话 ${itemToCancel.sessionId} 失败:`, error);
      }
    }

    // 从队列中移除已取消的项目，或者你也可以保留它们并显示“已取消”状态
    // 这里我选择移除它
    uploadQueue.splice(itemIndex, 1);
  };

  const clearFinishedUploads = () => {
    const filteredQueue = uploadQueue.filter(
      item => item.status === "pending" || item.status === "uploading"
    );
    // 使用 splice 替换数组内容以保持响应性
    uploadQueue.splice(0, uploadQueue.length, ...filteredQueue);
  };

  return {
    uploadQueue,
    showUploadProgress,
    addUploadsToQueue,
    cancelUpload,
    clearFinishedUploads
  };
}
