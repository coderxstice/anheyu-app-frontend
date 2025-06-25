/*
 * @Description: 文件系统相关的 TypeScript 类型定义
 * @Author: 安知鱼
 * @Date: 2025-06-24 22:36:58
 * @LastEditTime: 2025-06-25 23:20:41
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
  File = 0,
  Dir = 1
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
  primary_entity: string; // 主要实体 ID

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
  status: "pending" | "uploading" | "success" | "error"; // 增加 pending 状态
  progress: number;
  file: File; // 原始 File 对象

  // 用于分块上传的状态管理
  sessionId?: string; // 上传会话ID
  totalChunks?: number; // 文件总块数
  uploadedChunks?: Set<number>; // 已上传的块索引集合
  retries?: number; // 重试次数
}

// =================================================================
// II. API 响应类型 (API Response Types)
// =================================================================

// --- 1. 获取文件列表 (Endpoint: GET /file) ---

/**
 * API 返回的分页信息结构
 */
export interface PaginationInfo {
  page: number;
  page_size: number;
  total: number; // 后端返回的是 total，而不是 total_items
  total_page: number; // 后端返回的是 total_page，而不是 total_pages
}

/**
 * API 返回的父目录信息结构
 * 注意：其结构与 FileItem 类似，但通常省略了 files 数组
 */
export interface ParentInfo {
  id: string;
  name: string;
  type: number; // 0 或 1
  size: number;
  created_at: string;
  updated_at: string;
  path: string; // 父目录的完整 URI 路径
  owned: boolean;
  shared: boolean;
  permission: any;
  capability: string;
  primary_entity: string;
}

/**
 * API 返回的目录属性信息
 */
export interface FileProps {
  order_by_options: string[]; // 排序方式选项
  order_direction_options: string[]; // 排序方向选项
  // 根据你提供的后端数据，这里可能没有 writable, deletable
  // 如果有，请补充：
  // writable?: boolean;
  // deletable?: boolean;
}

/**
 * 获取文件列表接口中 `data` 字段的结构
 */
export interface FileListData {
  files: FileItem[]; // 文件项数组
  parent: ParentInfo | null; // 父目录信息，根目录时可能为 null 或特殊对象
  pagination: PaginationInfo; // 分页信息
  props: FileProps; // 目录属性信息

  // 根据你提供的后端数据，新增的额外字段
  context_hint?: string;
  storage_policy?: {
    id: string;
    name: string;
    type: string;
    max_size: number;
  };
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
  expires?: number; // 示例中未给出，可能可选
  storage_policy?: Record<string, any>; // 示例中未给出，可能可选
}

/**
 * 创建上传会话接口的完整响应体结构
 */
export interface CreateUploadSessionResponse {
  code: number;
  message: string;
  data: UploadSessionData;
}

// --- 3. 其他文件操作响应类型 (如果需要) ---
// 例如，创建文件/文件夹成功后的响应，可能返回 FileItem
// export interface CreateFileResponse {
//   code: number;
//   message: string;
//   data: FileItem;
// }

// 删除、重命名等操作的通用响应
// export interface GeneralActionResponse {
//   code: number;
//   message: string;
//   data?: any; // 可能返回空对象或简单消息
// }
