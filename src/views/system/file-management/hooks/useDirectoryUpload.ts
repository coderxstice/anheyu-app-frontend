/*
 * @Description: 处理文件和目录上传的 Hook (包含目录遍历逻辑)
 * @Author: 安知鱼
 * @Date: 2025-06-26 16:44:23
 * @LastEditTime: 2025-06-28 03:47:21
 * @LastEditors: 安知鱼
 */
import type { UploadItem } from "@/api/sys-file/type";
import { ElMessage } from "element-plus";
import type { Ref } from "vue";

// --- 目录遍历核心函数 (这部分逻辑很棒，保持不变) ---

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
              return Promise.resolve(null);
            });

            const filesOrNulls = await Promise.all(filePromises);
            // 使用 flat(Infinity) 来深度扁平化数组，并过滤掉 null
            const flattenedFiles = (
              filesOrNulls.flat(Infinity) as (File | null)[]
            ).filter((file): file is File => file !== null);
            resolve(flattenedFiles);
          } catch (e) {
            reject(e);
          }
        } else {
          allEntries.push(...entries);
          readEntries(); // 继续读取下一批
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
      // **核心修复 B**: 这里也同步更新一下类型定义，因为它与 useFileActions.ts 一致。
      | "instantSpeed"
      | "averageSpeed"
      | "uploadedSize"
    >[]
  ) => void,
  currentPath: Ref<string>
) {
  console.log(
    "%c[Check-1B useDirectoryUpload] Hook Initialized. Current Path:",
    "color: blue; font-weight: bold;",
    currentPath.value
  );
  /**
   * 处理拖拽事件的核心函数。
   * @param dataTransfer - 从拖拽事件中获取的 DataTransfer 对象。
   */
  const handleDrop = async (dataTransfer: DataTransfer) => {
    console.log(
      `[UploadHook] handleDrop 被调用，接收到 ${dataTransfer.items.length} 个拖拽项目。`
    );

    const currentTargetPath = currentPath.value; // 从传入的 Ref 获取当前路径
    console.log(`[UploadHook] 当前目标路径为: ${currentTargetPath}`);

    const promises: Promise<File | File[] | null>[] = [];

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
      const allFiles = (nestedFiles.flat(Infinity) as (File | null)[]).filter(
        (file): file is File => file !== null
      );

      console.log(
        `[UploadHook] 目录遍历完成，共找到 ${allFiles.length} 个可上传的文件。`
      );

      if (allFiles.length === 0) {
        ElMessage.info("您拖拽的项目中没有可上传的文件。");
        return;
      }

      // **核心修复 A**: 在这里创建对象时，不再需要手动添加 instantSpeed 等字段，
      // 因为它们已经从 Omit 类型中排除了，这与 useFileActions.ts 保持了一致。
      const newUploads: Omit<
        UploadItem,
        | "id"
        | "status"
        | "progress"
        | "uploadedChunks"
        | "abortController"
        | "instantSpeed"
        | "averageSpeed"
        | "uploadedSize"
      >[] = allFiles.map(file => ({
        // 在 UI 上显示相对路径，这样用户可以区分同名但不同目录的文件
        name: file.webkitRelativePath || file.name,
        size: file.size,
        file: file,
        // 上传时，后端需要这个相对路径来重建目录结构
        relativePath: file.webkitRelativePath || file.name,
        // 所有文件都上传到当前的目标路径下
        targetPath: currentTargetPath,
        // 标记为需要刷新，以便上传完成后更新文件列表
        needsRefresh: true
      }));

      console.log(
        "[UploadHook] 准备将以下任务添加到队列:",
        JSON.parse(
          JSON.stringify(
            newUploads.map(u => ({
              name: u.name,
              size: u.size,
              path: u.relativePath
            }))
          )
        )
      );

      // 调用从外部注入的函数来添加上传任务
      addUploadsToQueue(newUploads);
    } catch (error) {
      console.error("[UploadHook] 遍历文件或目录时出错:", error);
      ElMessage.error("读取拖拽内容时出错，请重试。");
    }
  };

  return {
    handleDrop
  };
}
