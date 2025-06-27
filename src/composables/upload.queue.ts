// src/composables/upload.queue.ts

import { reactive } from "vue";
import type { UploadItem } from "@/api/sys-file/type";

let uploadIdCounter = 0;

const uploadQueue = reactive<UploadItem[]>([]);

export function useUploadQueue() {
  const addTask = (taskData: Omit<UploadItem, "id">): UploadItem => {
    const newTask = { ...taskData, id: uploadIdCounter++ };
    uploadQueue.push(newTask);
    return newTask;
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
