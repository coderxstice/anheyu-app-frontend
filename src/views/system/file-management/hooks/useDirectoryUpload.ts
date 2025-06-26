/*
 * @Description: 处理文件和目录上传的 Hook
 * @Author: 安知鱼
 * @Date: 2025-06-26 16:44:23
 * @LastEditTime: 2025-06-26 17:22:01
 * @LastEditors: 安知鱼
 */
import { useFileStore } from "@/store/modules/fileStore";
import type { UploadItem } from "@/api/sys-file/type";
import { message } from "@/utils/message";

/**
 * 处理文件和目录上传的 Hook
 */
export function useDirectoryUpload() {
  const fileStore = useFileStore();

  /**
   * 判断一个 File 对象是否代表一个实际要上传的文件（而不是目录的占位符）。
   * @param file - 从 FileList 中获取的 File 对象。
   * @returns boolean - 如果是可上传的文件则返回 true。
   */
  const isUploadableFile = (file: File): boolean => {
    // 从 `webkitdirectory` 拖拽事件中，文件夹本身通常被表示为一个
    // type 属性为空字符串 "" 的 File 对象。我们通过此条件来过滤掉它们。
    // 真正的文件，即使是 0 字节的，通常也会有一个有效的 MIME type (如 'text/plain')。
    return file.type !== "";
  };

  /**
   * 处理拖拽或选择的文件列表，并将它们添加到上传队列。
   * @param files - 从 input 或拖拽事件中获取的 FileList 对象。
   */
  const handleFiles = (files: FileList) => {
    if (files.length === 0) return;

    const currentTargetPath = fileStore.path;

    // **修复**: 使用更可靠的 `file.type` 来过滤掉代表目录的条目
    const newUploads: Omit<
      UploadItem,
      "id" | "status" | "progress" | "uploadedChunks" | "abortController"
    >[] = Array.from(files)
      .filter(isUploadableFile) // <-- 使用增强后的过滤函数
      .map(file => ({
        // 为了在UI中清晰显示，直接使用相对路径作为显示名称
        name: file.webkitRelativePath || file.name,
        size: file.size,
        file: file,
        relativePath: file.webkitRelativePath || file.name,
        targetPath: currentTargetPath
      }));

    if (newUploads.length === 0) {
      message("您拖拽的目录中没有可上传的文件。", { type: "info" });
      return;
    }

    fileStore.addUploadsToQueue(newUploads);
  };

  return {
    handleFiles
  };
}
