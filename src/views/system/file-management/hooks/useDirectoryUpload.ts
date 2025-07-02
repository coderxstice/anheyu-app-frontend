/*
 * @Description: 处理文件和目录上传的 Hook (包含目录遍历逻辑)
 * @Author: 安知鱼
 * @Date: 2025-06-26 16:44:23
 * @LastEditTime: 2025-07-02 10:06:02
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
          name: file.name,
          webkitRelativePath: file.webkitRelativePath,
          size: file.size
        });

        // 如果 webkitRelativePath 为空 (例如拖拽单个文件)，则使用文件名本身
        const relativePath = file.webkitRelativePath || file.name;

        return {
          name: file.name, // [修复] UI上显示的名称应该是纯粹的文件名
          size: file.size,
          file: file,
          relativePath: relativePath, // [正确] 用于后端构建路径的应包含目录结构
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
