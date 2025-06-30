/*
 * @Description: 文件处理相关的工具函数
 * @Author: 安知鱼
 * @Date: 2025-06-26 18:32:39
 * @LastEditTime: 2025-06-30 12:18:09
 * @LastEditors: 安知鱼
 */

/**
 * 将基础路径和名称拼接成一个完整路径。
 * 能优雅地处理根目录的情况。
 * @param basePath 基础路径，例如 "/" 或 "/folder"
 * @param name 要追加的名称，例如 "file.txt"
 * @returns 组合后的路径，例如 "/file.txt" 或 "/folder/file.txt"
 */
export const joinPath = (basePath: string, name: string): string => {
  if (!name) return basePath;
  if (basePath === "/") {
    return `/${name}`;
  }
  // 确保在拼接前，基础路径没有末尾的斜杠
  return `${basePath.replace(/\/$/, "")}/${name}`;
};

/**
 * 从自定义协议的 URI 中提取逻辑路径。
 * @param uri URI 或路径，例如 "anzhiyu://my/folder" 或 "/folder"
 * @returns 逻辑路径，例如 "/folder"
 */
export const extractLogicalPathFromUri = (uri: string): string => {
  const prefix = "anzhiyu://my";
  if (uri.startsWith(prefix)) {
    let path = uri.substring(prefix.length);
    // 确保根目录返回的是 "/"
    if (path === "" || path === "/") return "/";
    // 确保返回的路径以 "/" 开头
    return path.startsWith("/") ? path : `/${path}`;
  }
  // 如果已经是逻辑路径，则直接返回
  return uri;
};

/**
 * 从文件名中提取扩展名。
 * @param filename 文件名
 * @returns 小写的扩展名，不带点
 */
export const getFileExtension = (filename: string): string => {
  if (!filename || filename.lastIndexOf(".") === -1) {
    return "";
  }
  return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
};

/**
 * 构建完整的后端期望的 URI 格式：anzhiyu://my/{path}
 * @param logicalPath 逻辑路径，例如 "/" 或 "/Documents"
 * @returns 完整的 URI 字符串
 */
export const buildFullUri = (logicalPath: string): string => {
  const prefix = "anzhiyu://my"; // 你的 URI 前缀

  if (!logicalPath.startsWith("/")) {
    logicalPath = "/" + logicalPath;
  }

  if (logicalPath === "/") {
    return `${prefix}/`;
  }

  return `${prefix}${logicalPath}`;
};

// =================================================================
// +++ 新增: 断点续传相关工具函数 +++
// =================================================================

/**
 * 为文件生成一个基于其属性的唯一标识（指纹）。
 * **核心修改**: 移除 lastModified，只使用 name 和 size，以提高匹配的可靠性。
 * @param file 文件对象
 * @returns 文件的唯一标识字符串，例如 "file-document.pdf-123456"
 */
export const getFileFingerprint = (file: File): string => {
  return `file-${file.name}-${file.size}`;
};

/**
 * 定义存储在 localStorage 中的上传记录的数据结构。
 */
export interface UploadRecord {
  sessionId: string;
  totalChunks: number;
  uploadedChunks: number[]; // localStorage 不支持 Set，所以使用数组
  uploadPath: string; // 上传的目标完整逻辑路径
  // 新增元数据，用于恢复任务时在 UI 上显示
  name: string;
  size: number;
  lastModified: number;
  chunkSize?: number; // 存下分片大小，用于精确恢复进度
}

// 创建一个 localStorage 的包装器，方便管理
const UPLOAD_PROGRESS_STORAGE_KEY = "upload-progress-storage";

export const uploadProgressStorage = {
  /**
   * 保存或更新一个上传记录。
   * @param fingerprint 文件指纹
   * @param record 上传记录
   */
  set(fingerprint: string, record: UploadRecord) {
    try {
      const allRecords = this.getAll();
      allRecords[fingerprint] = record;
      localStorage.setItem(
        UPLOAD_PROGRESS_STORAGE_KEY,
        JSON.stringify(allRecords)
      );
    } catch (e) {
      console.error("无法保存上传进度到 localStorage:", e);
    }
  },

  /**
   * 根据文件指纹获取一个上传记录。
   * @param fingerprint 文件指纹
   * @returns 上传记录，如果不存在则返回 null
   */
  get(fingerprint: string): UploadRecord | null {
    try {
      const allRecords = this.getAll();
      return allRecords[fingerprint] || null;
    } catch (e) {
      console.error("无法从 localStorage 读取上传进度:", e);
      return null;
    }
  },

  /**
   * 根据文件指纹移除一个上传记录。
   * @param fingerprint 文件指纹
   */
  remove(fingerprint: string) {
    try {
      const allRecords = this.getAll();
      const { [fingerprint]: removedRecord, ...remainingRecords } = allRecords;

      if (removedRecord) {
        localStorage.setItem(
          UPLOAD_PROGRESS_STORAGE_KEY,
          JSON.stringify(remainingRecords)
        );
      }
    } catch (e) {
      console.error("无法从 localStorage 移除上传进度:", e);
    }
  },

  /**
   * 获取所有的上传记录。
   * @returns 包含所有记录的对象
   */
  getAll(): Record<string, UploadRecord> {
    try {
      const records = localStorage.getItem(UPLOAD_PROGRESS_STORAGE_KEY);
      return records ? JSON.parse(records) : {};
    } catch (e) {
      console.log("无法解析上传进度记录，返回空对象:", e);
      return {};
    }
  },

  /**
   * 清除所有的上传记录。
   */
  clear() {
    localStorage.removeItem(UPLOAD_PROGRESS_STORAGE_KEY);
  }
};

/**
 * 格式化字节数为易读的字符串。
 * @param bytes 字节数
 * @param decimals 小数点后保留的位数，默认为 2
 * @returns 格式化后的字符串，例如 "1.23 MB"
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

/**
 * 从一个完整的文件或文件夹路径中获取其父目录的路径。
 * @param path 完整路径，例如 "/A/B/file.txt" 或 "/A/B"
 * @returns 父目录的路径，例如 "/A/B" 或 "/A"。如果路径就在根目录，则返回 "/"。
 */
export const getParentPath = (path: string): string => {
  if (!path || path === "/") {
    return "/";
  }
  const lastSlashIndex = path.lastIndexOf("/");
  // 如果找不到斜杠，或者路径是 "/file.txt" 这种，父目录就是根
  if (lastSlashIndex <= 0) {
    return "/";
  }
  return path.substring(0, lastSlashIndex);
};
