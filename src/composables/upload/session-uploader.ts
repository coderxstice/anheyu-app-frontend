/*
 * @Description: 负责执行“创建上传会话”任务的具体 Uploader。
 * @Author: 安知鱼
 * @Date: 2025-06-30 20:30:00
 * @LastEditors: 安知鱼
 */
import BaseUploader from "./base-uploader";
import { createUploadSessionApi } from "@/api/sys-file/sys-file";
import type { UploadItem } from "@/api/sys-file/type";
import { joinPath } from "@/utils/fileUtils";

interface SessionUploaderOptions {
  storagePolicyId: string;
  overwrite: boolean;
}

export class SessionUploader extends BaseUploader {
  constructor(
    item: UploadItem,
    private options: SessionUploaderOptions
  ) {
    super(item);
  }

  /**
   * 会话任务的唯一标识符由目标路径和文件名组成。
   */
  getIdentifier(): string {
    return `session-${joinPath(this.item.targetPath, this.item.relativePath)}`;
  }

  /**
   * 执行创建会话的 API 调用。
   */
  async run(): Promise<void> {
    console.log(`[SessionUploader] ${this.item.name}: 开始创建会话...`);
    const uploadLogicalPath = joinPath(
      this.item.targetPath,
      this.item.relativePath
    );

    const sessionRes = await createUploadSessionApi(
      uploadLogicalPath,
      this.item.size,
      this.options.storagePolicyId,
      this.options.overwrite
    );

    if (!sessionRes || sessionRes.code !== 200) {
      const message = sessionRes?.message || "创建上传会话失败";
      const error: any = new Error(message);
      error.code = sessionRes?.code;
      // 标记为冲突错误，以便上层逻辑可以特殊处理
      if (error.code === 409 || message.includes("exists")) {
        error.isConflict = true;
      }
      throw error;
    }

    // 将获取到的会话信息写回共享的 UploadItem 对象
    const { session_id, chunk_size } = sessionRes.data;
    this.item.sessionId = session_id;
    this.item.totalChunks = Math.ceil(this.item.size / chunk_size);
    this.item.chunkSize = chunk_size;
    console.log(
      `[SessionUploader] ${this.item.name}: 会话创建成功, ID: ${this.item.sessionId}`
    );
  }
}
