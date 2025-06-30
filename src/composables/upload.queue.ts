/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-27 15:01:34
 * @LastEditTime: 2025-06-30 13:00:30
 * @LastEditors: 安知鱼
 */
// src/composables/upload.queue.ts

import { reactive } from "vue";
import type { UploadItem } from "@/api/sys-file/type";

let uploadIdCounter = 0;

// uploadQueue 本身是响应式的，它能追踪到成员的增、删、替换。
const uploadQueue = reactive<UploadItem[]>([]);

export function useUploadQueue() {
  const addTask = (taskData: Omit<UploadItem, "id">): UploadItem => {
    // 1. 先创建包含完整数据的普通对象。
    const taskWithId = { ...taskData, id: uploadIdCounter++ };
    // 2. 使用 reactive() 将这个普通对象转换为一个深度响应式代理。
    const reactiveTask = reactive(taskWithId) as UploadItem;

    // 3. 将这个确保是响应式的代理对象推入队列。
    uploadQueue.push(reactiveTask);

    // 4. 返回这个响应式对象，以便后续的逻辑能操作它。
    return reactiveTask;
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
    // 使用 splice 和展开运算符来原地修改数组，以保持响应性
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
