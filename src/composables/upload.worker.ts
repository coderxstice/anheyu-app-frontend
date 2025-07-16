/*
 * @Description: 负责处理单个文件上传流程的 Worker。
 *              它作为调度器，支持【服务端中转分片】和【客户端直传分片】两种模式。
 * @Author: 安知鱼
 * @Date: 2025-07-01 06:30:00
 * @LastEditors: 安知鱼
 */

// 导入与后端标准 API 交互的函数
import { uploadChunkApi } from "@/api/sys-file/sys-file";
// 导入与第三方服务（OneDrive）直接交互的函数
import { uploadChunkToOneDriveApi } from "@/api/external/onedrive";
// 导入类型定义
import type { UploadItem } from "@/api/sys-file/type";

/**
 * 负责串行上传一个文件的所有分片。
 * 它会根据 item.uploadMethod 自动选择上传模式。
 * @param item - 要上传的文件项 (必须是响应式对象，且已包含有效的会话信息)
 */
export async function uploadFileChunksWorker(item: UploadItem): Promise<void> {
  console.log(`[ChunkWorker] 开始为文件 ${item.name} 上传分片...`);

  try {
    // 1. 前置条件检查
    if (!item.chunkSize || item.totalChunks === undefined) {
      throw new Error("分片上传前必须拥有有效的分片信息。");
    }

    // 根据上传模式检查必要的会话信息
    if (item.uploadMethod === "client") {
      if (!item.uploadUrl) {
        throw new Error("客户端直传模式需要一个有效的 upload_url。");
      }
    } else {
      // 默认为 "server" 模式
      if (!item.sessionId) {
        throw new Error("服务端中转模式需要一个有效的 sessionId。");
      }
    }

    // 2. 检查是否需要上传（秒传逻辑）
    if (item.uploadedChunks?.size === item.totalChunks) {
      console.log(`[ChunkWorker] ${item.name} 所有分片已存在，无需上传。`);
      if (item.status !== "success") item.status = "success";
      return;
    }

    // 3. 串行上传所有分片
    for (let i = 0; i < item.totalChunks; i++) {
      // a. 检查任务是否被取消
      if (item.status === "canceled") {
        console.log(`[ChunkWorker] ${item.name}: 任务被取消，中断上传。`);
        return;
      }

      // b. 跳过已上传的分片
      if (item.uploadedChunks?.has(i)) {
        continue;
      }

      console.log(`[ChunkWorker] 准备上传分片 ${i} for ${item.name}`);

      // c. 切割分片
      const start = i * item.chunkSize!;
      const end = Math.min(start + item.chunkSize!, item.size);
      const chunkBlob = item.file.slice(start, end);

      // d. [核心] 根据模式选择上传方式
      if (item.uploadMethod === "client") {
        // 模式一：客户端直传
        // (未来可根据 item.storageType 等字段进一步分发到不同的外部 API)
        await uploadChunkToOneDriveApi(
          item.uploadUrl!,
          chunkBlob,
          start,
          end,
          item.size
        );
      } else {
        // 模式二：服务端中转（默认）
        const chunkRes = await uploadChunkApi(item.sessionId!, i, chunkBlob);
        if (!chunkRes || chunkRes.code !== 200) {
          throw new Error(chunkRes?.message || `分片 ${i + 1} 上传失败`);
        }
      }

      // e. 无论哪种模式，成功后都更新本地状态
      item.uploadedChunks!.add(i);
      item.uploadedSize += chunkBlob.size;
      item.progress = Math.round((item.uploadedSize / item.size) * 100);
    }

    // 4. 所有分片处理完毕，标记成功
    // 注意：真正的“文件合并/完成”是在此 Worker 之外处理的。
    // - 客户端直传：由最后一个分片上传成功后云服务商自动完成。
    // - 服务端中转：需要上层调用者（如 useFileUploader）再发起一个“合并”请求。
    item.status = "success";
    console.log(`[ChunkWorker] ${item.name} 所有分片上传成功。`);
  } catch (error: any) {
    // 5. 统一错误处理
    if (item.status !== "canceled") {
      // 将错误向上抛出，让 useFileUploader 的 Promise 链统一处理
      console.error(`[ChunkWorker] 文件 ${item.name} 上传失败:`, error);
      throw error;
    }
  }
}
