/*
 * @Description: 文件系统相关的 TypeScript 类型定义
 * @Author: 安知鱼
 * @Date: 2025-06-24 22:36:58
 * @LastEditTime: 2025-06-27 01:51:23
 * @LastEditors: 安知鱼
 */

// =================================================================
// I. 前端内部使用的核心类型 (Core Frontend Types)
// =================================================================

/**
 * 对应后端 type 字段的枚举，提高代码可读性
 * 0 代表文件，1 代表文件夹
 */
export enum FileType {
  File = 1,
  Dir = 2
}

/**
 * 文件项的类型定义 (与后端实际返回的数据结构精确匹配)
 */
export interface FileItem {
  id: string;
  name: string;
  type: number; // 后端返回的是数字 (0 代表文件，1 代表文件夹)，使用 FileType 枚举进行判断
  size: number; // 单位：字节
  created_at: string; // 创建时间 (ISO 8601 格式字符串)
  updated_at: string; // 更新时间 (ISO 8601 格式字符串)
  path: string; // 完整的 URI 路径，如 "anzhiyu://my/新建文件夹"
  owned: boolean; // 是否拥有
  shared: boolean; // 是否共享
  permission: any; // 权限信息，可以是 null 或其他类型（如果具体结构确定，可以更精确）
  capability: string; // 能力字段（例如 "39/9AQ=="）
  primary_entity_public_id: string; // 主要实体 ID

  // 以下字段根据后端实际返回情况，可能需要调整为可选或移除
  ext?: string; // 文件扩展名，如果后端不返回，则需要前端根据名称推断
}

/**
 * 上传队列项的类型定义 (仅在上传组件和 Store 中使用)
 */
export interface UploadItem {
  id: number; // 前端生成的唯一ID
  name: string;
  size: number;
  status:
    | "pending"
    | "uploading"
    | "success"
    | "error"
    | "conflict"
    | "canceled";
  overwrite?: boolean; // 用于单个文件覆盖
  progress: number;
  file: File; // 原始 File 对象
  relativePath: string; // 文件在所选目录中的相对路径
  targetPath: string; // 上传任务启动时所在的目标目录路径
  abortController?: AbortController; // 用于取消上传的控制器

  // 用于告知调用方是否需要在完成后刷新列表;
  needsRefresh?: boolean;

  // 用于分块上传的状态管理
  sessionId?: string; // 上传会话ID
  totalChunks?: number; // 文件总块数
  uploadedChunks?: Set<number>; // 已上传的块索引集合
  errorMessage?: string; // 上传失败时的错误信息
  retries?: number; // 重试次数
}

// =================================================================
// II. API 响应类型 (API Response Types)
// =================================================================

/**
 * 文件夹视图配置对象类型
 * 用于 GET /file 响应 和 PUT /folder/view 请求/响应
 */
export interface FolderViewConfig {
  view: "list" | "grid";
  order: string;
  page_size: number;
  order_direction: "asc" | "desc";
}

/**
 * 更新文件夹视图配置接口的响应体结构
 */
export interface UpdateFolderViewResponse {
  code: number;
  data: {
    view: FolderViewConfig;
  } | null;
  message: string;
}

// --- 1. 获取文件列表 (Endpoint: GET /file) ---

/**
 * API 返回的分页信息结构
 */
export interface PaginationInfo {
  page: number;
  page_size: number;
  total: number;
  total_page: number;
}

/**
 * API 返回的父目录信息结构
 */
export interface ParentInfo {
  id: string;
  name: string;
  type: number;
  size: number;
  created_at: string;
  updated_at: string;
  path: string;
  owned: boolean;
  shared: boolean;
  permission: any;
  capability: string;
  primary_entity_public_id: string;
}

/**
 * API 返回的目录属性信息
 */
export interface FileProps {
  order_by_options: string[];
  order_direction_options: string[];
}

/**
 * API 返回的存储策略信息结构
 */
export interface StoragePolicy {
  id: string;
  name: string;
  type: string;
  max_size: number;
}

/**
 * 获取文件列表接口中 `data` 字段的结构
 */
export interface FileListData {
  files: FileItem[];
  parent: ParentInfo | null;
  pagination: PaginationInfo;
  props: FileProps;
  context_hint?: string;
  storage_policy?: StoragePolicy;
  view?: FolderViewConfig;
}

/**
 * 获取文件列表接口的完整响应体结构
 */
export interface FileListResponse {
  code: number;
  message: string;
  data: FileListData;
}

// --- 2. 创建上传会话 (Endpoint: PUT /file/upload) ---

/**
 * 创建上传会话接口中 `data` 字段的结构
 */
export interface UploadSessionData {
  session_id: string;
  chunk_size: number;
  expires?: number;
  storage_policy?: Record<string, any>;
}

/**
 * 创建上传会话接口的完整响应体结构
 */
export interface CreateUploadSessionResponse {
  code: number;
  message: string;
  data: UploadSessionData;
}
