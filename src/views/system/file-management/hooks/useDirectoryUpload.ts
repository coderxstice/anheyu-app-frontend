/*
 * @Description: 处理文件和目录上传的 Hook (包含目录遍历逻辑)
 * @Author: 安知鱼
 * @Date: 2025-06-26 16:44:23
 * @LastEditTime: 2025-07-02 14:41:31
 * @LastEditors: 安知鱼
 */
import type { UploadItem } from "@/api/sys-file/type";
import { ElMessage } from "element-plus";
import type { Ref } from "vue";

/**
 * @description: 异步地从 FileSystemFileEntry 获取 File 对象。
 * @param {FileSystemFileEntry} fileEntry - 文件系统文件条目。
 * @returns {Promise<File>} - 返回一个解析为 File 对象的 Promise。
 */
const getFileFromFileEntry = (
  fileEntry: FileSystemFileEntry
): Promise<File> => {
  return new Promise((resolve, reject) => fileEntry.file(resolve, reject));
};

/**
 * @description: 递归地遍历目录，并返回所有文件的扁平化列表。
 * @param {FileSystemDirectoryEntry} directoryEntry - 文件系统目录条目。
 * @returns {Promise<File[]>} - 返回一个解析为 File 对象数组的 Promise。
 */
const traverseDirectory = (
  directoryEntry: FileSystemDirectoryEntry
): Promise<File[]> => {
  const reader = directoryEntry.createReader();
  return new Promise((resolve, reject) => {
    const allEntries: FileSystemEntry[] = [];
    const readEntries = () => {
      reader.readEntries(async entries => {
        if (entries.length === 0) {
          try {
            const filePromises = allEntries.map(entry => {
              if (entry.isFile)
                return getFileFromFileEntry(entry as FileSystemFileEntry);
              if (entry.isDirectory)
                return traverseDirectory(entry as FileSystemDirectoryEntry);
              return Promise.resolve(null);
            });
            const filesOrNulls = await Promise.all(filePromises);
            const flattenedFiles = (
              filesOrNulls.flat(Infinity) as (File | null)[]
            ).filter((file): file is File => file !== null);
            resolve(flattenedFiles);
          } catch (e) {
            reject(e);
          }
        } else {
          allEntries.push(...entries);
          readEntries();
        }
      }, reject);
    };
    readEntries();
  });
};

/**
 * @description: 处理文件和目录拖拽上传的 Hook
 * @param addUploadsToQueue - 一个能将文件添加至上传队列的函数，现在应返回 Promise<boolean>
 * @param currentPath - 一个包含当前文件浏览器路径的响应式引用 (Ref)
 * @param onNewUploads - 当添加新上传任务后触发的回调函数
 */
export function useDirectoryUpload(
  addUploadsToQueue: (
    uploads: Omit<
      UploadItem,
      | "id"
      | "status"
      | "progress"
      | "uploadedChunks"
      | "abortController"
      | "instantSpeed"
      | "averageSpeed"
      | "uploadedSize"
    >[]
  ) => Promise<boolean>, // 确认函数签名返回 Promise<boolean>
  currentPath: Ref<string>,
  onNewUploads: (hasAdded: boolean) => void // 直接接收回调函数
) {
  /**
   * @description: 处理拖放事件，遍历拖入的项目，并将其添加到上传队列
   * @param {DataTransfer} dataTransfer - 拖放事件中的 DataTransfer 对象
   */
  const handleDrop = async (dataTransfer: DataTransfer) => {
    const currentTargetPath = currentPath.value;
    const promises: Promise<File | File[] | null>[] = [];

    for (const item of Array.from(dataTransfer.items)) {
      const entry = item.webkitGetAsEntry();
      if (entry) {
        if (entry.isFile) {
          promises.push(getFileFromFileEntry(entry as FileSystemFileEntry));
        } else if (entry.isDirectory) {
          promises.push(traverseDirectory(entry as FileSystemDirectoryEntry));
        }
      }
    }

    try {
      const nestedFiles = await Promise.all(promises);
      const allFiles = (nestedFiles.flat(Infinity) as (File | null)[]).filter(
        (file): file is File => file !== null
      );

      if (allFiles.length === 0) {
        ElMessage.info("您拖拽的项目中没有可上传的文件。");
        return;
      }

      const newUploads = allFiles.map(file => {
        console.log(`[Upload Debug] 正在处理文件 (拖拽):`, {
          name: file.name,
          webkitRelativePath: file.webkitRelativePath,
          size: file.size
        });

        const relativePath = file.webkitRelativePath || file.name;

        return {
          name: file.name,
          size: file.size,
          file: file,
          relativePath: relativePath,
          targetPath: currentTargetPath,
          needsRefresh: true
        };
      });

      // 等待 addUploadsToQueue 完成，并获取是否成功添加了任务的结果
      const hasAdded = await addUploadsToQueue(newUploads);
      // 调用回调函数，通知父组件处理 UI 变化（如显示上传面板）
      onNewUploads(hasAdded);
    } catch (error) {
      console.error("[UploadHook] 遍历文件或目录时出错:", error);
      ElMessage.error("读取拖拽内容时出错，请重试。");
    }
  };

  return { handleDrop };
}
