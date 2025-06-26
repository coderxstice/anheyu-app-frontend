/*
 * @Description: 处理文件和目录上传的 Hook (包含目录遍历逻辑)
 * @Author: 安知鱼
 * @Date: 2025-06-26 16:44:23
 * @LastEditTime: 2025-06-26 17:48:47
 * @LastEditors: 安知鱼
 */
import { useFileStore } from "@/store/modules/fileStore";
import type { UploadItem } from "@/api/sys-file/type";
import { ElMessage } from "element-plus";

// --- 目录遍历核心函数 ---

/**
 * 从 FileSystemFileEntry 获取 File 对象。
 * @param fileEntry - 文件系统中的文件条目。
 * @returns 返回一个 Promise，解析为 File 对象。
 */
const getFileFromFileEntry = (
  fileEntry: FileSystemFileEntry
): Promise<File> => {
  return new Promise((resolve, reject) => {
    fileEntry.file(resolve, reject);
  });
};

/**
 * 递归遍历目录以获取所有文件。
 * @param directoryEntry - 文件系统中的目录条目。
 * @returns 返回一个 Promise，解析为一个包含所有文件的 File 对象数组。
 */
const traverseDirectory = (
  directoryEntry: FileSystemDirectoryEntry
): Promise<File[]> => {
  const reader = directoryEntry.createReader();
  // readEntries() 每次可能只返回一部分条目，需要循环读取
  return new Promise((resolve, reject) => {
    const allEntries: FileSystemEntry[] = [];

    const readEntries = () => {
      reader.readEntries(async entries => {
        if (entries.length === 0) {
          // 读取完毕，开始处理收集到的所有条目
          try {
            const filePromises = allEntries.map(entry => {
              if (entry.isFile) {
                return getFileFromFileEntry(entry as FileSystemFileEntry);
              }
              if (entry.isDirectory) {
                // 递归遍历子目录
                return traverseDirectory(entry as FileSystemDirectoryEntry);
              }
              return Promise.resolve(null); // 忽略其他类型
            });

            // 等待所有 Promise 完成，然后扁平化数组并过滤掉空值
            const filesOrNulls = await Promise.all(filePromises);
            const flattenedFiles = filesOrNulls
              .flat(Infinity)
              .filter(Boolean) as File[];
            resolve(flattenedFiles);
          } catch (e) {
            reject(e);
          }
        } else {
          // 将当前批次的条目添加到总列表中，并继续读取下一批
          allEntries.push(...entries);
          readEntries();
        }
      }, reject);
    };

    readEntries();
  });
};

/**
 * 处理文件和目录上传的 Hook
 */
export function useDirectoryUpload() {
  const fileStore = useFileStore();

  /**
   * **修复**: 新的处理函数，接收 DataTransfer 对象，并能遍历目录。
   * @param dataTransfer - 从拖拽事件中获取的 DataTransfer 对象。
   */
  const handleDrop = async (dataTransfer: DataTransfer) => {
    console.log(
      `[UploadHook] handleDrop 被调用，接收到 ${dataTransfer.items.length} 个拖拽项目。`
    );

    const currentTargetPath = fileStore.path;
    console.log(`[UploadHook] 当前目标路径为: ${currentTargetPath}`);

    const promises: Promise<(File | File[]) | null>[] = [];

    // 遍历所有拖拽项目
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
      // 等待所有文件和目录的遍历完成
      const nestedFiles = await Promise.all(promises);
      const allFiles = nestedFiles.flat(Infinity).filter(Boolean) as File[];

      console.log(
        `[UploadHook] 目录遍历完成，共找到 ${allFiles.length} 个可上传的文件。`
      );

      if (allFiles.length === 0) {
        ElMessage.info("您拖拽的目录中没有可上传的文件。");
        return;
      }

      const newUploads: Omit<
        UploadItem,
        "id" | "status" | "progress" | "uploadedChunks" | "abortController"
      >[] = allFiles.map(file => ({
        // UI上显示相对路径，避免同名文件混淆
        name: file.webkitRelativePath || file.name,
        size: file.size,
        file: file,
        relativePath: file.webkitRelativePath || file.name,
        targetPath: currentTargetPath
      }));

      console.log(
        "[UploadHook] 准备将以下任务添加到队列:",
        JSON.parse(
          JSON.stringify(newUploads.map(u => ({ name: u.name, size: u.size })))
        )
      );
      fileStore.addUploadsToQueue(newUploads);
    } catch (error) {
      console.error("[UploadHook] 遍历文件或目录时出错:", error);
      ElMessage.error("读取目录内容时出错，请重试。");
    }
  };

  return {
    handleDrop
  };
}
