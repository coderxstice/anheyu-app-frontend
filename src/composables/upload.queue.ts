/*
 * @Description: 上传队列的状态管理 Composable，提供对全局上传队列的增删查改等原子操作。
 * @Author: 安知鱼
 * @Date: 2025-06-27 15:01:34
 * @LastEditTime: 2025-07-01 18:35:40
 * @LastEditors: 安知鱼
 */
import { reactive } from "vue";
import type { UploadItem } from "@/api/sys-file/type";

/**
 * 全局唯一的上传任务响应式队列。
 * 所有上传项都应添加到此队列中，以便在整个应用中共享状态。
 */
const uploadQueue = reactive<UploadItem[]>([]);

/**
 * @description: 提供对全局上传队列进行操作的 Composable 函数。
 * @returns {object} 包含操作队列的各种方法。
 */
export function useUploadQueue() {
  /**
   * @description: 向上传队列中添加一个新的、已经是响应式的上传任务。
   * @param {UploadItem} reactiveItem - 已经通过 `reactive()` 创建的上传项。
   * @returns {void}
   */
  const addTask = (reactiveItem: UploadItem) => {
    uploadQueue.push(reactiveItem);
  };

  /**
   * @description: 根据任务ID从上传队列中移除一个任务。
   * @param {number} itemId - 要移除的任务的唯一ID。
   * @returns {boolean} - 如果找到并成功移除则返回 true，否则返回 false。
   */
  const removeTask = (itemId: number): boolean => {
    const index = uploadQueue.findIndex(item => item.id === itemId);
    if (index > -1) {
      uploadQueue.splice(index, 1);
      return true;
    }
    return false;
  };

  /**
   * @description: 根据任务ID在上传队列中查找一个任务。
   * @param {number} itemId - 要查找的任务的唯一ID。
   * @returns {UploadItem | undefined} - 如果找到则返回任务对象，否则返回 undefined。
   */
  const findTask = (itemId: number): UploadItem | undefined => {
    return uploadQueue.find(item => item.id === itemId);
  };

  /**
   * @description: 在上传队列中查找第一个状态为 "pending" (待处理) 的任务。
   * 这是文件级并行调度器获取下一个任务的核心方法。
   * @returns {UploadItem | undefined} - 如果找到则返回待处理的任务对象，否则返回 undefined。
   */
  const findPendingTask = (): UploadItem | undefined => {
    return uploadQueue.find(item => item.status === "pending");
  };

  /**
   * @description: 清理上传队列中所有已完成（成功或已取消）的任务。
   * 通常由用户手动触发，用于清理上传列表界面。
   * @returns {void}
   */
  const clearFinishedTasks = () => {
    const active = uploadQueue.filter(
      item => !["success", "canceled"].includes(item.status)
    );
    // 使用 splice 和扩展运算符 (...) 来高效地替换数组内容，以保持原始的响应式引用
    uploadQueue.splice(0, uploadQueue.length, ...active);
  };

  return {
    uploadQueue,
    addTask,
    removeTask,
    findTask,
    findPendingTask,
    clearFinishedTasks
  };
}
