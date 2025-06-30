/*
 * @Description: Uploader 的抽象基类，定义了所有具体上传任务的通用接口。
 * @Author: 安知鱼
 * @Date: 2025-06-30 20:30:00
 * @LastEditors: 安知鱼
 */
import type { UploadItem } from "@/api/sys-file/type";

export default abstract class BaseUploader {
  constructor(protected item: UploadItem) {}

  /**
   * 每个任务必须实现的核心执行逻辑。
   * 它应该返回一个 Promise，在任务完成时 resolve，在失败时 reject。
   */
  abstract run(): Promise<void>;

  /**
   * 返回一个唯一的字符串标识符，用于任务池防止重复执行相同的任务。
   * 例如 "session-文件名" 或 "chunk-会话ID-分片索引"。
   */
  abstract getIdentifier(): string;
}
