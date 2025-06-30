/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-27 15:01:34
 * @LastEditTime: 2025-06-30 18:04:06
 * @LastEditors: 安知鱼
 */
import { reactive } from "vue";
import type { UploadItem } from "@/api/sys-file/type";

const uploadQueue = reactive<UploadItem[]>([]);

export function useUploadQueue() {
  /**
   * 【重要修改】: addTask 现在只接收一个已经是响应式的 UploadItem 对象。
   * 它不再负责创建或转换对象。
   */
  const addTask = (reactiveItem: UploadItem) => {
    uploadQueue.push(reactiveItem);
  };

  const removeTask = (itemId: number): boolean => {
    const index = uploadQueue.findIndex(item => item.id === itemId);
    if (index > -1) {
      uploadQueue.splice(index, 1);
      return true;
    }
    return false;
  };

  const findTask = (itemId: number): UploadItem | undefined => {
    return uploadQueue.find(item => item.id === itemId);
  };

  const findPendingTask = (): UploadItem | undefined => {
    return uploadQueue.find(item => item.status === "pending");
  };

  const clearFinishedTasks = () => {
    const active = uploadQueue.filter(
      item => !["success", "canceled"].includes(item.status)
    );
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
