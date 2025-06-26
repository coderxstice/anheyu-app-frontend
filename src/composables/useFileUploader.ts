// src/composables/useFileUploader.ts

import { ref, reactive, computed, type ComputedRef } from "vue";
import { ElMessageBox } from "element-plus";
import {
  createUploadSessionApi,
  uploadChunkApi,
  deleteUploadSessionApi
} from "@/api/sys-file/sys-file";
import type { UploadItem, StoragePolicy, FileItem } from "@/api/sys-file/type";
import { joinPath } from "@/utils/fileUtils";

let uploadIdCounter = 0;

/**
 * 一个功能强大的文件上传引擎 (Vue Composable Hook)。
 * 支持队列、并发、分片、重试、错误处理和覆盖策略。
 * @param existingFiles 一个包含当前目录中已存在文件的计算属性引用。
 * @param storagePolicy 一个包含当前存储策略的计算属性引用。
 * @param onQueueFinished 一个回调函数，当上传任务成功并需要刷新列表时被（防抖）调用。
 */
export function useFileUploader(
  existingFiles: ComputedRef<FileItem[]>,
  storagePolicy: ComputedRef<StoragePolicy | null>,
  onQueueFinished: () => void
) {
  const uploadQueue = reactive<UploadItem[]>([]);
  const isProcessingQueue = ref(false);
  let debounceTimer: number | null = null;

  // --- 可配置状态 ---
  const concurrency = ref(4);
  const globalOverwrite = ref(false);

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
    // 这个函数本身只负责处理单个文件的上传流程，逻辑是正确的。
    // ... (此函数内部逻辑无需修改)
    const controller = new AbortController();
    item.abortController = controller;
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

      // 后端冲突检查作为最后一道防线 (例如，在校验和上传之间有其他用户上传了同名文件)
      if (sessionRes.code !== 200) {
        const isConflictError =
          sessionRes.code === 409 || // 409 Conflict
          sessionRes.message.includes("exists") ||
          sessionRes.message.includes("存在");

        if (isConflictError) {
          throw new Error("conflict:同名对象已存在");
        }
        throw new Error(sessionRes.message || "创建上传会话失败");
      }

      const { session_id, chunk_size } = sessionRes.data;
      item.sessionId = session_id;
      item.uploadedChunks = new Set();
      const totalChunks = Math.ceil(item.size / chunk_size);
      item.totalChunks = totalChunks;

      const chunkPromises = Array.from(
        { length: totalChunks },
        (_, i) => i
      ).map(chunkIndex => async () => {
        if (controller.signal.aborted)
          throw new DOMException("Aborted", "AbortError");

        const start = chunkIndex * chunk_size;
        const end = Math.min(start + chunk_size, item.size);
        const chunk = item.file.slice(start, end);
        await uploadChunkApi(session_id, chunkIndex, chunk);

        item.uploadedChunks.add(chunkIndex);
        item.progress = Math.round(
          (item.uploadedChunks.size / totalChunks) * 100
        );
      });

      // 并发执行分片上传
      const chunkConcurrency = Math.min(4, totalChunks); // 分片并发数
      for (let i = 0; i < chunkPromises.length; i += chunkConcurrency) {
        const batch = chunkPromises.slice(i, i + chunkConcurrency);
        await Promise.all(batch.map(p => p()));
      }

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

  /**
   * **第二道防线和执行核心：健壮的队列处理器**
   * 这个函数现在使用一个清晰的循环来管理并发。
   * 它只挑选 `status` 为 `pending` 的任务来执行，从而保证了任务的独立性。
   */
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
        });
      workers.add(promise);
    };

    // 只要队列中还有待处理的任务，或有任务正在执行，循环就继续
    while (
      uploadQueue.some(item => item.status === "pending") ||
      workers.size > 0
    ) {
      const availableSlots = concurrency.value - workers.size;
      if (availableSlots > 0) {
        // 找到所有待处理的任务
        const itemsToStart = uploadQueue
          .filter(item => item.status === "pending")
          .slice(0, availableSlots);

        // 启动这些任务
        for (const item of itemsToStart) {
          item.status = "uploading"; // 关键：在启动前就标记，防止被重复拾取
          startTask(item);
        }
      }

      // 等待任何一个正在运行的任务完成，或者短暂等待后再次检查
      if (workers.size > 0) {
        await Promise.race(workers);
      } else {
        // 如果没有任务在跑了（说明全都处理完了），就退出循环
        break;
      }
    }

    isProcessingQueue.value = false;
  };

  /**
   * **第一道防线：前端预校验**
   * 在这里，我们对每个要添加的文件进行独立检查。
   * 这是保证同名文件不发起请求的关键。
   */
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
    if (uploads.length === 0) return;

    // 1. 创建一个当前目录下所有文件名的 Set，用于快速查找
    const existingFileNames = new Set(existingFiles.value.map(f => f.name));

    const newUploadItems: UploadItem[] = uploads.map(u => {
      // 2. 对每一个待上传文件，独立检查其是否存在
      const isConflict = existingFileNames.has(u.name);

      return {
        ...u,
        id: uploadIdCounter++,
        // 3. 根据检查结果，立即设置正确的初始状态
        status: isConflict ? "conflict" : "pending",
        errorMessage: isConflict ? "同名文件已存在" : undefined,
        progress: 0,
        uploadedChunks: new Set(),
        overwrite: false
      };
    });

    uploadQueue.push(...newUploadItems);

    // 启动队列处理器
    processUploadQueue();
  };

  const removeItem = async (itemId: number) => {
    const itemIndex = uploadQueue.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;

    const itemToRemove = uploadQueue[itemIndex];
    const { status, abortController, sessionId, targetPath, relativePath } =
      itemToRemove;

    // **核心逻辑**：
    // 仅当任务处于“未完成”状态时，才需要考虑中止和调用后端API。
    // 这些状态包括：pending, uploading, error, conflict。
    if (status !== "success" && status !== "canceled") {
      // 1. 如果任务正在上传，则中止它
      if (abortController) {
        abortController.abort();
        itemToRemove.status = "canceled"; // 更新状态为已取消
      }

      // 2. 如果任务已经创建了后端上传会话，则通知后端删除
      if (sessionId) {
        try {
          await deleteUploadSessionApi(
            sessionId,
            joinPath(targetPath, relativePath)
          );
          console.log(`[Uploader] 成功删除后端会话: ${sessionId}`);
        } catch (err) {
          // 即便后端删除失败，我们依然要从UI上移除，所以这里只打印错误。
          console.error(`[Uploader] 删除后端会话 ${sessionId} 失败:`, err);
        }
      }
    }

    // 对于所有情况（包括已成功、已取消或未完成的任务），最后都从UI队列中移除。
    uploadQueue.splice(itemIndex, 1);
  };

  const retryItem = (itemId: number) => {
    const item = uploadQueue.find(item => item.id === itemId);
    if (item && (item.status === "error" || item.status === "conflict")) {
      item.status = "pending";
      item.errorMessage = undefined;
      item.progress = 0;
      item.uploadedChunks = new Set();
      processUploadQueue();
    }
  };

  const retryAllFailed = () => {
    uploadQueue.forEach(item => {
      if (item.status === "error") {
        item.status = "pending";
        item.errorMessage = undefined;
        item.progress = 0;
        item.uploadedChunks = new Set();
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

  return {
    uploadQueue,
    showUploadProgress,
    concurrency,
    addUploadsToQueue,
    removeItem,
    retryItem,
    retryAllFailed,
    resolveConflict,
    setGlobalOverwriteAndRetry,
    clearFinishedUploads,
    setConcurrency
  };
}
