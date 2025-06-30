/*
 * @Description: 一个通用的并行任务池，用于控制并发执行的异步任务数量。
 * @Author: 安知鱼
 * @Date: 2025-06-30 20:30:00
 * @LastEditors: 安知鱼
 */
import type BaseUploader from "./base-uploader";

// 定义一个简单的错误类，用于表示重复任务
export class ProcessingTaskDuplicatedError extends Error {
  constructor(message = "一个具有相同标识符的任务已在处理中。") {
    super(message);
    this.name = "ProcessingTaskDuplicatedError";
  }
}

export interface QueueContent {
  uploader: BaseUploader;
  resolve: () => void;
  reject: (err?: any) => void;
}

export class Pool {
  // 等待执行的任务队列
  public queue: Array<QueueContent> = [];
  // 正在执行的任务列表
  public processing: Array<QueueContent> = [];

  constructor(public limit: number) {}

  /**
   * 将一个任务加入队列等待执行。
   * @param uploader 一个 BaseUploader 的实例
   * @returns 一个 Promise，在任务最终完成时 resolve 或 reject
   */
  enqueue(uploader: BaseUploader) {
    return new Promise<void>((resolve, reject) => {
      this.queue.push({
        uploader,
        resolve,
        reject
      });
      this.check();
    });
  }

  /**
   * 当一个任务完成后，将其从处理列表中移除，并触发新一轮的检查。
   * @param item 已完成的任务内容
   */
  private release(item: QueueContent) {
    this.processing = this.processing.filter(v => v !== item);
    this.check();
  }

  /**
   * 执行一个具体的任务。
   * @param item 要执行的任务内容
   */
  private run(item: QueueContent) {
    // 从等待队列中移除
    this.queue = this.queue.filter(v => v !== item);

    // 检查是否有具有相同唯一标识符的任务正在处理中
    if (
      this.processing.find(
        v => v.uploader.getIdentifier() === item.uploader.getIdentifier()
      )
    ) {
      item.reject(
        new ProcessingTaskDuplicatedError(
          `任务 "${item.uploader.getIdentifier()}" 重复。`
        )
      );
      // 注意：这里不需要调用 release，因为它从未被添加到 processing 列表中
      return;
    }

    // 移入处理列表并开始执行
    this.processing.push(item);
    item.uploader.run().then(
      () => {
        item.resolve();
        this.release(item);
      },
      err => {
        item.reject(err);
        this.release(item);
      }
    );
  }

  /**
   * 检查是否有空闲的“工位”来执行等待队列中的任务。
   * 这是任务池的调度核心。
   */
  public check() {
    const availableSlots = this.limit - this.processing.length;
    if (availableSlots <= 0) {
      return;
    }

    // 从等待队列的头部取出可执行的任务
    const tasksToRun = this.queue.slice(0, availableSlots);
    tasksToRun.forEach(item => {
      this.run(item);
    });
  }
}
