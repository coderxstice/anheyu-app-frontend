/*
 * @Description: 负责处理单个文件【仅分片上传】流程的 Worker。
 *              会话创建由上层的 useFileUploader 负责。
 * @Author: 安知鱼
 * @Date: 2025-07-01 06:30:00
 * @LastEditors: 安知鱼
 */
import { uploadChunkApi } from "@/api/sys-file/sys-file";
import type { UploadItem } from "@/api/sys-file/type";

/**
 * 只负责串行上传一个文件的所有分片。
 * @param item - 要上传的文件项 (必须是响应式对象，且已包含有效的 sessionId)
 */
export async function uploadFileChunksWorker(item: UploadItem): Promise<void> {
  console.log(`[ChunkWorker] 开始为文件 ${item.name} 上传分片...`);

  try {
    // 前置条件检查
    if (!item.sessionId || !item.chunkSize || item.totalChunks === undefined) {
      throw new Error("分片上传前必须拥有有效的会话信息。");
    }

    // 检查秒传（虽然在会话创建时已检查，这里作为双保险）
    if (item.uploadedChunks?.size === item.totalChunks) {
      console.log(`[ChunkWorker] ${item.name} 所有分片已存在，无需上传。`);
      if (item.status !== "success") item.status = "success";
      return;
    }

    // 串行上传所有分片
    for (let i = 0; i < item.totalChunks; i++) {
      if (item.uploadedChunks?.has(i)) continue;

      if (item.status === "canceled") {
        console.log(`[ChunkWorker] ${item.name}: 任务被取消，中断上传。`);
        return;
      }
      console.log(
        `[DEBUG-SPEED-LIMIT] Waiting 500ms before uploading chunk ${i}...`
      );
      await new Promise(resolve => setTimeout(resolve, 500));

      const start = i * item.chunkSize!;
      const end = Math.min(start + item.chunkSize!, item.size);
      const chunkBlob = item.file.slice(start, end);

      const chunkRes = await uploadChunkApi(item.sessionId!, i, chunkBlob);

      if (!chunkRes || chunkRes.code !== 200) {
        throw new Error(chunkRes?.message || `分片 ${i + 1} 上传失败`);
      }

      item.uploadedChunks!.add(i);
      item.uploadedSize += chunkBlob.size;
      item.progress = Math.round((item.uploadedSize / item.size) * 100);
    }

    // 所有分片上传完毕，标记成功
    item.status = "success";
    console.log(`[ChunkWorker] ${item.name} 所有分片上传成功。`);
  } catch (error: any) {
    // 将错误向上抛出，让 useFileUploader 的 Promise 链统一处理
    if (item.status !== "canceled") {
      throw error;
    }
  }
}
