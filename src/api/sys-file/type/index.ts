/*
 * @Description: 文件系统相关的 TypeScript 类型定义
 * @Author: 安知鱼
 * @Date: 2025-06-24 22:36:58
 * @LastEditTime: 2025-06-25 17:22:27
 * @LastEditors: 安知鱼
 */

// =================================================================
// I. 前端内部使用的核心类型 (Core Frontend Types)
// =================================================================

/**
 * 文件项的类型定义 (在整个应用中使用)
 */
export interface FileItem {
  id: string;
  path: string; // 文件所在的路径
  name: string;
  size?: number; // 单位：KB
  ext?: string;
  modified: string;
  uploaded: string;
  type: "file" | "dir";
}

/**
 * 上传队列项的类型定义 (仅在上传组件和 Store 中使用)
 */
export interface UploadItem {
  id: number; // 前端生成的唯一ID
  name: string;
  size: number;
  status: "pending" | "uploading" | "success" | "error"; // 增加 pending 状态
  progress: number;
  file: File; // 原始 File 对象

  // 用于分块上传的状态管理
  sessionId?: string;
  totalChunks?: number;
  uploadedChunks?: Set<number>;
  retries?: number;
}

// =================================================================
// II. API 响应类型 (API Response Types)
// =================================================================

// --- 1. 获取文件列表 (/files) ---

/**
 * API 返回的分页信息结构
 */
export interface PaginationInfo {
  page: number;
  page_size: number;
  total_pages: number;
  total_items: number;
}

/**
 * API 返回的父目录信息结构
 */
export interface ParentInfo {
  id: string;
  name: string;
  path: string;
}

/**
 * API 返回的目录属性信息
 */
export interface FileProps {
  writable: boolean;
  deletable: boolean;
}

/**
 * 获取文件列表接口中 `data` 字段的结构
 */
export interface FileListData {
  files: FileItem[]; // 假设后端返回的 file 结构与我们前端的 FileItem 一致
  parent: ParentInfo | null;
  pagination: PaginationInfo;
  props: FileProps;
}

/**
 * 获取文件列表接口的完整响应体结构
 */
export interface FileListResponse {
  code: number;
  message: string;
  data: FileListData;
}

// --- 2. 创建上传会话 (/file/upload) ---

/**
 * 创建上传会话接口中 `data` 字段的结构
 */
export interface UploadSessionData {
  session_id: string;
  chunk_size: number;
  expires: number;
  storage_policy: Record<string, any>; // 可根据实际情况定义更精确的类型
}

/**
 * 创建上传会话接口的完整响应体结构
 */
export interface CreateUploadSessionResponse {
  code: number;
  message: string;
  data: UploadSessionData;
}
