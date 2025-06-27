/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-27 14:54:19
 * @LastEditTime: 2025-06-27 15:01:42
 * @LastEditors: 安知鱼
 */
// src/composables/upload.worker.ts

import {
  createUploadSessionApi,
  uploadChunkApi,
  validateUploadSessionApi
} from "@/api/sys-file/sys-file";
import type { UploadItem, StoragePolicy } from "@/api/sys-file/type";
import { joinPath } from "@/utils/fileUtils";

interface UploadOptions {
  storagePolicy: StoragePolicy;
  overwrite?: boolean;
}

/**
 * “上传工人”：负责单个文件的完整上传流程。
 * @param item - 要上传的任务项
 * @param options - 上传所需的配置
 * @returns Promise<void>
 */
export async function uploadFileWorker(
  item: UploadItem,
  options: UploadOptions
): Promise<void> {
  console.log(`[WORKER] 开始处理: ${item.name}`);
  const controller = new AbortController();
  item.abortController = controller;
  item.errorMessage = undefined;

  try {
    if (!options.storagePolicy.id) throw new Error("存储策略不可用。");

    let chunkSize: number;
    let totalChunks: number;

    item.startTime = Date.now();
    item.lastSize = item.uploadedSize;
    item.lastTime = item.startTime;

    if (!item.sessionId) {
      console.log(`[WORKER] ${item.name}: 没有 session ID，创建新会话...`);
      const uploadLogicalPath = joinPath(item.targetPath, item.relativePath);
      const sessionRes = await createUploadSessionApi(
        uploadLogicalPath,
        item.size,
        options.storagePolicy.id,
        options.overwrite || false
      );

      if (sessionRes.code !== 200) {
        const isConflictError =
          sessionRes.code === 409 ||
          (sessionRes.message || "").includes("exists");
        if (isConflictError) throw new Error("conflict:同名对象已存在");
        throw new Error(sessionRes.message || "创建上传会话失败");
      }
      const { session_id, chunk_size } = sessionRes.data;
      item.sessionId = session_id;
      chunkSize = chunk_size;
      item.totalChunks = Math.ceil(item.size / chunkSize);
      totalChunks = item.totalChunks;
      console.log(
        `[WORKER] ${item.name}: 新会话创建成功, ID: ${item.sessionId}`
      );
    } else {
      console.log(
        `[WORKER] ${item.name}: 发现 session ID: ${item.sessionId}，正在验证...`
      );
      const validationRes = await validateUploadSessionApi(item.sessionId);
      const resData = validationRes.data;
      if (!(validationRes.code === 200 && resData.is_valid)) {
        throw new Error("无法恢复上传会话，会话已失效。");
      }
      chunkSize = resData.chunk_size;
      totalChunks = item.totalChunks!;
      console.log(`[WORKER] ${item.name}: 会话验证成功。`);
    }

    if (!item.sessionId || !totalChunks)
      throw new Error("上传会话信息不完整。");

    const allChunkIndexes = Array.from({ length: totalChunks }, (_, i) => i);
    const chunksToUpload = allChunkIndexes.filter(
      index => !item.uploadedChunks?.has(index)
    );
    console.log(
      `[WORKER] ${item.name}: 总分片: ${totalChunks}, 待上传分片: ${chunksToUpload.length}`
    );

    if (chunksToUpload.length === 0) {
      console.log(
        `[WORKER] ${item.name}: 没有需要上传的分片，直接标记为成功。`
      );
      item.progress = 100;
      item.status = "success";
      return;
    }

    // **核心修复**: 使用简单的 for...of 循环来串行上传分片
    console.log(`[WORKER] ${item.name}: 开始串行上传分片...`);
    for (const chunkIndex of chunksToUpload) {
      if (controller.signal.aborted)
        throw new DOMException("Aborted", "AbortError");

      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, item.size);
      const chunk = item.file.slice(start, end);

      console.log(
        `[WORKER] ${item.name}: 正在上传分片 ${chunkIndex + 1}/${totalChunks}`
      );
      await uploadChunkApi(item.sessionId!, chunkIndex, chunk);

      item.uploadedChunks?.add(chunkIndex);
      item.uploadedSize += chunk.size;
      item.progress = Math.round((item.uploadedSize / item.size) * 100);
      console.log(
        `[WORKER] ${item.name}: 分片 ${chunkIndex + 1} 上传成功，当前进度: ${item.progress}%`
      );
    }

    console.log(`[WORKER] ${item.name}: 所有分片上传完毕，标记为成功。`);
    item.progress = 100;
    item.status = "success";
  } catch (error) {
    console.error(`[WORKER] ${item.name}: 上传过程中发生致命错误`, error);
    throw error;
  } finally {
    item.instantSpeed = 0;
    delete item.abortController;
    console.log(`[WORKER] ${item.name}: 作业完成/清理。`);
  }
}
