/*
 * @Description: 处理文件和目录上传的 Hook (包含目录遍历逻辑)
 * @Author: 安知鱼
 * @Date: 2025-06-26 16:44:23
 * @LastEditTime: 2025-06-30 17:11:24
 * @LastEditors: 安知鱼
 */
import type { UploadItem } from "@/api/sys-file/type";
import { ElMessage } from "element-plus";
import type { Ref } from "vue";

// --- 目录遍历核心函数 (保持不变) ---
const getFileFromFileEntry = (
  fileEntry: FileSystemFileEntry
): Promise<File> => {
  return new Promise((resolve, reject) => fileEntry.file(resolve, reject));
};
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
 * 处理文件和目录拖拽上传的 Hook
 * @param addUploadsToQueue - 一个能将文件添加至上传队列的函数。
 * @param currentPath - 一个包含当前文件浏览器路径的响应式引用 (Ref)。
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
  ) => void,
  currentPath: Ref<string>
) {
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
        // --- 核心修复与调试 ---
        console.log(`[Upload Debug] 正在处理文件 (拖拽):`, {
          name: file.name, // 预期: 'aaa.txt'
          webkitRelativePath: file.webkitRelativePath, // 预期: 'A/B/C/aaa.txt'
          size: file.size
        });

        // 如果 webkitRelativePath 为空或 undefined，上传的目录结构将会丢失。
        // 这通常意味着浏览器或选择模式存在问题。
        const relativePath = file.webkitRelativePath || file.name;

        return {
          name: relativePath, // UI上显示完整路径以便区分
          size: file.size,
          file: file,
          relativePath: relativePath, // 传递给后端用于创建目录结构
          targetPath: currentTargetPath,
          needsRefresh: true
        };
      });

      addUploadsToQueue(newUploads);
    } catch (error) {
      console.error("[UploadHook] 遍历文件或目录时出错:", error);
      ElMessage.error("读取拖拽内容时出错，请重试。");
    }
  };

  return { handleDrop };
}
