/*
 * @Description: 负责处理单个文件上传流程的 Worker。
 *              它作为调度器，支持【服务端中转分片】和【客户端直传】两种模式。
 *              客户端直传支持 OneDrive（分片）、COS/OSS/S3（整文件预签名URL）。
 * @Author: 安知鱼
 * @Date: 2025-07-01 06:30:00
 * @LastEditors: 安知鱼
 */

// 导入与后端标准 API 交互的函数
import { uploadChunkApi } from "@/api/sys-file/sys-file";
// 导入与第三方服务（OneDrive）直接交互的函数
import { uploadChunkToOneDriveApi } from "@/api/external/onedrive";
// 导入云存储直传函数
import { uploadToCloudStorage } from "@/api/external/cloud-storage";
// 导入类型定义
import type { UploadItem } from "@/api/sys-file/type";

/**
 * 负责上传单个文件。
 * 它会根据 item.uploadMethod 和 item.storageType 自动选择上传模式：
 * - server 模式：服务端中转分片上传
 * - client 模式：
 *   - OneDrive：分片直传
 *   - COS/OSS/S3：整文件预签名URL上传
 *
 * @param item - 要上传的文件项 (必须是响应式对象，且已包含有效的会话信息)
 */
export async function uploadFileChunksWorker(item: UploadItem): Promise<void> {
  console.log(
    `[ChunkWorker] 开始为文件 ${item.name} 上传, 模式: ${item.uploadMethod}, 存储类型: ${item.storageType}`
  );

  try {
    // 客户端直传模式
    if (item.uploadMethod === "client") {
      if (!item.uploadUrl) {
        throw new Error("客户端直传模式需要一个有效的 upload_url。");
      }

      // 根据存储类型选择上传方式
      switch (item.storageType) {
        case "onedrive":
          // OneDrive 使用分片上传
          await uploadOneDriveChunks(item);
          break;

        case "tencent_cos":
        case "aliyun_oss":
        case "aws_s3":
          // COS/OSS/S3 使用整文件预签名URL上传
          await uploadCloudStorageFile(item);
          break;

        default:
          throw new Error(`不支持的存储类型: ${item.storageType}`);
      }

      item.status = "success";
      console.log(`[ChunkWorker] ${item.name} 客户端直传成功。`);
      return;
    }

    // 服务端中转模式（默认）
    await uploadServerChunks(item);
    item.status = "success";
    console.log(`[ChunkWorker] ${item.name} 所有分片上传成功。`);
  } catch (error: any) {
    // 统一错误处理
    if (item.status !== "canceled") {
      console.error(`[ChunkWorker] 文件 ${item.name} 上传失败:`, error);
      throw error;
    }
  }
}

/**
 * OneDrive 分片上传
 */
async function uploadOneDriveChunks(item: UploadItem): Promise<void> {
  if (!item.chunkSize || item.totalChunks === undefined) {
    throw new Error("OneDrive 分片上传前必须拥有有效的分片信息。");
  }

  // 检查是否已全部上传
  if (item.uploadedChunks?.size === item.totalChunks) {
    console.log(`[ChunkWorker] ${item.name} 所有分片已存在，无需上传。`);
    return;
  }

  // 串行上传所有分片
  for (let i = 0; i < item.totalChunks; i++) {
    if (item.status === "canceled") {
      console.log(`[ChunkWorker] ${item.name}: 任务被取消，中断上传。`);
      return;
    }

    if (item.uploadedChunks?.has(i)) {
      continue;
    }

    const start = i * item.chunkSize!;
    const end = Math.min(start + item.chunkSize!, item.size);
    const chunkBlob = item.file.slice(start, end);

    await uploadChunkToOneDriveApi(
      item.uploadUrl!,
      chunkBlob,
      start,
      end,
      item.size
    );

    item.uploadedChunks!.add(i);
    item.uploadedSize += chunkBlob.size;
    item.progress = Math.round((item.uploadedSize / item.size) * 100);
  }
}

/**
 * COS/OSS/S3 整文件上传（使用预签名URL）
 */
async function uploadCloudStorageFile(item: UploadItem): Promise<void> {
  console.log(
    `[ChunkWorker] ${item.name}: 开始云存储直传 (${item.storageType})`
  );

  // 使用预签名URL上传整个文件
  // 对于阿里云OSS，必须使用后端返回的 contentType 以确保签名匹配
  await uploadToCloudStorage(
    item.uploadUrl!,
    item.file,
    item.storageType as "tencent_cos" | "aliyun_oss" | "aws_s3",
    progress => {
      item.progress = progress;
      item.uploadedSize = Math.round((progress / 100) * item.size);
    },
    item.contentType // 传递后端返回的 Content-Type
  );

  // 上传完成
  item.uploadedSize = item.size;
  item.progress = 100;
}

/**
 * 服务端中转分片上传
 */
async function uploadServerChunks(item: UploadItem): Promise<void> {
  if (!item.sessionId) {
    throw new Error("服务端中转模式需要一个有效的 sessionId。");
  }

  if (!item.chunkSize || item.totalChunks === undefined) {
    throw new Error("分片上传前必须拥有有效的分片信息。");
  }

  // 检查是否已全部上传
  if (item.uploadedChunks?.size === item.totalChunks) {
    console.log(`[ChunkWorker] ${item.name} 所有分片已存在，无需上传。`);
    return;
  }

  // 串行上传所有分片
  for (let i = 0; i < item.totalChunks; i++) {
    if (item.status === "canceled") {
      console.log(`[ChunkWorker] ${item.name}: 任务被取消，中断上传。`);
      return;
    }

    if (item.uploadedChunks?.has(i)) {
      continue;
    }

    console.log(`[ChunkWorker] 准备上传分片 ${i} for ${item.name}`);

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
}
