/*
 * @Description: 文件系统相关的 TypeScript 类型定义
 * @Author: 安知鱼
 * @Date: 2025-06-24 22:36:58
 * @LastEditTime: 2025-06-28 15:16:49
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
  metadata?: {
    "sys:upload_session_id"?: string; // 可选的上传会话ID
    [key: string]: any; // 兼容其他可能的 metadata 字段
  };
  url?: string; // 可选的文件访问 URL，如果后端不返回，则需要前端根据逻辑生成
  relative_path?: string; // 可选的相对路径，如果后端不返回，则
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
    | "canceled"
    | "resumable";
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

  // --- 用于丰富 UI 显示和速度计算的字段 ---
  instantSpeed: number; // 瞬时速度 (Bytes/s)
  averageSpeed: number; // +++ 新增: 平均速度 (Bytes/s) +++
  uploadedSize: number; // 已上传大小 (Bytes)
  isResuming?: boolean; // 是否为断点续传任务

  // --- 用于计算速度的内部状态字段 ---
  startTime?: number; // 上传开始时间戳
  lastSize?: number; // 上一次计算速度时的大小
  lastTime?: number; // 上一次计算速度时的时间戳
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

export interface UpdateFolderViewResponse {
  code: number;
  data: {
    view: FolderViewConfig;
  } | null;
  message: string;
}

/**
 * `GET file/upload/session/{sessionId}` 接口成功时 `data` 字段的结构
 */
export interface UploadSessionStatus {
  session_id: string;
  is_valid: true; // 成功时 is_valid 总是 true
  chunk_size: number;
  total_chunks: number;
  uploaded_chunks: number[];
  expires_at: string;
}

/**
 * `GET file/upload/session/{sessionId}` 接口失败时 `data` 字段的结构
 */
export interface InvalidUploadSessionStatus {
  is_valid: false;
}

/**
 * `GET file/upload/session/{sessionId}` 接口的完整响应体结构
 */
export interface ValidateUploadSessionResponse {
  code: number;
  // data 字段是两种可能类型的联合类型
  data: UploadSessionStatus | InvalidUploadSessionStatus;
  message: string;
}

// --- 文件详情与文件夹树 (新增) ---

/**
 * 文件详情接口的响应体
 */
export interface FileDetailResponse {
  code: number;
  message: string;
  data: FileItem; // FileItem 现在包含可选的 url 字段
}

/**
 * 文件夹内容树中的单个文件节点
 */
export interface FolderTreeFile {
  url: string;
  relative_path: string;
  size: number;
}

/**
 * 文件夹内容树接口 `data` 字段的结构
 */
export interface FolderTreeData {
  files: FolderTreeFile[];
  expires: string;
}

/**
 * 文件夹内容树接口的完整响应体
 */
export interface FolderTreeResponse {
  code: number;
  message: string;
  data: FolderTreeData;
}

/**
 * API 返回的文件夹大小计算结果结构
 * (对应 API 文档中的 FolderSize 对象)
 */
export interface FolderSizeData {
  logicalSize: number; // 逻辑大小 (Bytes)
  storageConsumption: number; // 实际占用空间 (Bytes)
  fileCount: number; // 文件总数
}

/**
 * 计算文件夹大小接口 (GET /api/file/size/:id) 的完整响应体结构
 */
export interface FolderSizeResponse {
  code: number;
  message: string;
  data: FolderSizeData;
}
