/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-24 22:36:58
 * @LastEditTime: 2025-06-24 22:39:13
 * @LastEditors: 安知鱼
 */
// 文件项类型定义
/**
 * 文件项的类型定义
 */
export interface FileItem {
  id: string;
  path: string; // 文件所在的路径
  name: string;
  size?: number; // 单位：KB
  ext?: string;
  modified: string;
  type: "file" | "dir";
}

/**
 * 上传队列项的类型定义
 * 增加了 id 和 progress 等 store 内部管理所需的字段
 */
export interface UploadItem {
  id: number;
  name: string;
  size: number;
  status: "uploading" | "success" | "error";
  progress: number;
  file: File;
}

// API 返回结果的类型
export interface FileListResult {
  code: number;
  message: string;
  data: FileItem[];
}
