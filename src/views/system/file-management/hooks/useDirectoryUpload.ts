/*
 * @Description: 处理文件和目录上传的 Hook (包含目录遍历逻辑)
 * @Author: 安知鱼
 * @Date: 2025-06-26 16:44:23
 * @LastEditTime: 2025-07-23 11:20:22
 * @LastEditors: 安知鱼
 */
import type { UploadItem } from "@/api/sys-file/type";
import { ElMessage } from "element-plus";
import type { Ref } from "vue";
import { joinPath } from "@/utils/fileUtils";

/**
 * @description: 定义一个接口，用于存储处理后的文件对象及其手动构建的相对路径。
 */
interface ProcessedFile {
  file: File;
  relativePath: string;
}

/**
 * @description: 从 FileSystemFileEntry 获取 File 对象，并将其与手动构建的相对路径打包。
 * @param {FileSystemFileEntry} fileEntry - 文件系统文件条目。
 * @param {string} path - 手动构建的完整相对路径。
 * @returns {Promise<ProcessedFile>} - 返回一个解析为 ProcessedFile 对象的 Promise。
 */
const getFileWithRelativePath = (
  fileEntry: FileSystemFileEntry,
  path: string
): Promise<ProcessedFile> => {
  return new Promise((resolve, reject) => {
    fileEntry.file(file => {
      resolve({ file, relativePath: path });
    }, reject);
  });
};

/**
 * @description: [核心修复] 递归地遍历目录，并返回所有文件的扁平化列表，每个文件都带有其正确的相对路径。
 * @param {FileSystemDirectoryEntry} directoryEntry - 要遍历的文件系统目录条目。
 * @param {string} currentPath - 当前递归层级的路径。
 * @returns {Promise<ProcessedFile[]>} - 返回一个解析为 ProcessedFile 对象数组的 Promise。
 */
const traverseDirectory = (
  directoryEntry: FileSystemDirectoryEntry,
  currentPath: string
): Promise<ProcessedFile[]> => {
  const reader = directoryEntry.createReader();
  return new Promise((resolve, reject) => {
    const allEntries: FileSystemEntry[] = [];

    const readEntries = () => {
      // 分批读取目录条目，直到全部读取完毕
      reader.readEntries(async entries => {
        // 当 entries 为空数组时，表示该目录下的所有条目都已读取完毕
        if (entries.length === 0) {
          try {
            // 对所有收集到的条目进行并行处理
            const promises = allEntries.map(entry => {
              // 构建下一级的相对路径
              const entryPath = joinPath(currentPath, entry.name);

              if (entry.isFile) {
                // 如果是文件，直接获取并打包其路径
                return getFileWithRelativePath(
                  entry as FileSystemFileEntry,
                  entryPath
                );
              }
              if (entry.isDirectory) {
                // 如果是目录，递归调用遍历函数，并传入更新后的路径
                return traverseDirectory(
                  entry as FileSystemDirectoryEntry,
                  entryPath
                );
              }
              // 对于其他类型的条目（如符号链接），我们忽略它，并返回一个解析为空数组的 Promise
              return Promise.resolve([]);
            });

            // 等待所有异步操作完成
            const nestedFiles = await Promise.all(promises);
            // 将多层嵌套的数组完全展平为一维数组
            resolve(nestedFiles.flat(Infinity) as ProcessedFile[]);
          } catch (e) {
            reject(e);
          }
        } else {
          // 将当前批次的条目收集起来，并继续读取下一批
          allEntries.push(...entries);
          readEntries();
        }
      }, reject); // readEntries 的第二个参数是错误回调
    };

    readEntries();
  });
};

/**
 * @description: 处理文件和目录拖拽上传的 Hook
 * @param addUploadsToQueue - 一个能将文件添加至上传队列的函数，应返回 Promise<boolean>
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
  ) => Promise<boolean>,
  currentPath: Ref<string>,
  onNewUploads: (hasAdded: boolean) => void
) {
  /**
   * @description: 处理拖放事件，遍历拖入的项目，并将其添加到上传队列。
   * @param {DataTransfer} dataTransfer - 拖放事件中的 DataTransfer 对象。
   */
  const handleDrop = async (dataTransfer: DataTransfer) => {
    const currentTargetPath = currentPath.value;
    const promises: Promise<ProcessedFile | ProcessedFile[] | null>[] = [];

    // 遍历所有拖拽进来的项目
    for (const item of Array.from(dataTransfer.items)) {
      // webkitGetAsEntry() 是获取文件系统条目的标准方式
      const entry = item.webkitGetAsEntry();

      if (entry) {
        if (entry.isFile) {
          // 如果拖拽的是顶层文件，其相对路径就是它的文件名
          promises.push(
            getFileWithRelativePath(entry as FileSystemFileEntry, entry.name)
          );
        } else if (entry.isDirectory) {
          // 如果拖拽的是顶层目录，从它的名字开始构建路径
          promises.push(
            traverseDirectory(entry as FileSystemDirectoryEntry, entry.name)
          );
        }
      }
    }

    try {
      // 等待所有文件和目录的遍历完成
      const nestedProcessedFiles = await Promise.all(promises);
      // 将结果完全展平，并过滤掉可能出现的 null 值
      const allProcessedFiles = (
        nestedProcessedFiles.flat(Infinity) as (ProcessedFile | null)[]
      ).filter((item): item is ProcessedFile => item !== null);

      if (allProcessedFiles.length === 0) {
        ElMessage.info("您拖拽的项目中没有可上传的文件。");
        return;
      }

      // 将处理好的文件列表转换成上传队列需要的格式
      const newUploads = allProcessedFiles.map(processedFile => {
        const { file, relativePath } = processedFile;

        console.log(`[Upload Debug] 正在处理文件 (拖拽):`, {
          name: file.name,
          computedRelativePath: relativePath, // 这是我们手动构建的、正确的相对路径
          size: file.size
        });

        return {
          name: file.name,
          size: file.size,
          file: file,
          // [关键] 使用我们手动构建的路径，而不是不可靠的 file.webkitRelativePath
          relativePath: relativePath,
          targetPath: currentTargetPath,
          needsRefresh: true
        };
      });

      // 将构建好的上传任务添加到队列
      const hasAdded = await addUploadsToQueue(newUploads);
      // 触发回调，通知父组件UI更新（如显示上传面板）
      onNewUploads(hasAdded);
    } catch (error) {
      console.error("[UploadHook] 遍历文件或目录时出错:", error);
      ElMessage.error("读取拖拽内容时出错，请重试。");
    }
  };

  return { handleDrop };
}
