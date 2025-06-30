/*
 * @Description: 负责执行“上传单个文件分片”任务的具体 Uploader。
 * @Author: 安知鱼
 * @Date: 2025-06-30 20:30:00
 * @LastEditors: 安知鱼
 */
import BaseUploader from "./base-uploader";
import { uploadChunkApi } from "@/api/sys-file/sys-file";
import type { UploadItem } from "@/api/sys-file/type";

export class ChunkUploader extends BaseUploader {
  constructor(
    item: UploadItem,
    private chunkIndex: number
  ) {
    super(item);
  }

  /**
   * 分片任务的唯一标识符由会话ID和分片索引组成，确保全局唯一。
   */
  getIdentifier(): string {
    return `chunk-${this.item.sessionId}-${this.chunkIndex}`;
  }

  /**
   * 执行上传分片的 API 调用。
   */
  async run(): Promise<void> {
    const { sessionId, chunkSize, file } = this.item;

    if (!sessionId || !chunkSize) {
      throw new Error("分片上传前必须拥有有效的会话信息。");
    }

    const start = this.chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunkBlob = file.slice(start, end);

    const chunkRes = await uploadChunkApi(
      sessionId,
      this.chunkIndex,
      chunkBlob
    );

    if (!chunkRes || chunkRes.code !== 200) {
      const message =
        chunkRes?.message || `分片 ${this.chunkIndex + 1} 上传失败`;
      const error: any = new Error(message);
      error.code = chunkRes?.code;
      throw error;
    }

    // 成功后，更新共享的 UploadItem 对象的进度信息
    this.item.uploadedChunks.add(this.chunkIndex);
    this.item.uploadedSize += chunkBlob.size;
    this.item.progress = Math.round(
      (this.item.uploadedSize / this.item.size) * 100
    );

    if (this.item.uploadedChunks.size === this.item.totalChunks) {
      console.log(
        `[ChunkUploader] 文件 ${this.item.name} 的所有分片上传完毕，更新状态为 success。`
      );
      this.item.status = "success";
    }
  }
}
