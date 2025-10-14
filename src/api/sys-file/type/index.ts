/*
 * @Description: 文件系统相关的 TypeScript 类型定义
 * @Author: 安知鱼
 * @Date: 2025-06-24 22:36:58
 * @LastEditTime: 2025-09-14 22:03:09
 * @LastEditors: 安知鱼
 */

// =================================================================
// I. 前端内部使用的类型 (Core Frontend Types)
// =================================================================

export interface ColumnConfig {
  type: number;
  width?: number;
}

export interface FolderViewConfig {
  view: "list" | "grid";
  order: string;
  order_direction: "asc" | "desc";
  page_size: number;
  columns?: ColumnConfig[]; // 设为可选
}

export interface BaseResponse<T> {
  code: number; // 响应状态码
  message: string; // 响应消息
  data: T;
}

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
  etag?: string; // 可选的 ETag 字段，用于文件版本控制
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
  id: string;
  name: string;
  size: number;
  status:
    | "pending"
    | "uploading"
    | "success"
    | "error"
    | "conflict"
    | "canceled"
    | "resumable"
    | "processing";
  overwrite?: boolean;
  progress: number;
  file: File;
  relativePath: string;
  targetPath: string;
  abortController?: AbortController;
  needsRefresh?: boolean;

  // 用于分块上传的状态管理
  sessionId?: string;
  totalChunks?: number;
  chunkSize?: number;
  uploadedChunks?: Set<number>;
  errorMessage?: string;
  retries?: number;

  // 用于丰富 UI 显示和速度计算的字段
  instantSpeed: number;
  averageSpeed: number;
  uploadedSize: number;
  isResuming?: boolean;

  // 用于计算速度的内部状态字段
  startTime?: number;
  lastSize?: number;
  lastTime?: number;

  /**
   * @description 上传模式，由后端在创建会话时指定。
   * "server": 服务端中转模式（默认）。
   * "client": 客户端直传模式（如 OneDrive）。
   * @optional
   */
  uploadMethod?: "client" | "server";

  /**
   * @description 在客户端直传模式下，由后端提供的上传目标 URL。
   * @optional
   */
  uploadUrl?: string;
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

// 1. 获取文件列表 (Endpoint: GET /file)

/**
 * API 返回的分页信息结构
 */
/**
 * @description [适配游标分页] API返回的分页信息对象。
 */
export interface Pagination {
  /**
   * @description 提供上下文的页码。首次请求为 1，后续请求为 0。不用于分页逻辑。
   */
  page: number;
  /**
   * @description 本次实际返回的项目数量。
   */
  page_size: number;
  /**
   * @description 固定为 true，表示正在使用游标分页。
   */
  is_cursor: boolean;
  /**
   * @description 获取下一页数据的令牌（游标）。如果这是最后一页，此字段将被省略。
   * @optional
   */
  next_token?: string;
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
  pagination: Pagination;
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

// 2. 创建上传会话 (Endpoint: PUT /file/upload)

/**
 * 创建上传会话接口中 `data` 字段的结构
 */
export interface UploadSessionData {
  session_id: string;
  chunk_size: number;
  expires?: number;
  storage_policy?: Record<string, any>;
  /**
   * @description 后端指定的上传模式。
   * @optional
   */
  upload_method?: "client" | "server";

  /**
   * @description 客户端直传模式下的目标 URL。
   * @optional
   */
  upload_url?: string;
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

/**
 * 创建直链接口请求体的结构
 */
export interface CreateDirectLinksRequest {
  file_ids: string[];
}

/**
 * 创建直链时，返回数组中的单个链接对象结构
 */
export interface DirectLinkItem {
  link: string; // 生成的公开直链 URL
  file_url: string; // 文件的内部 URI，例如 "anzhiyu://my/年度报告.docx"
}

/**
 * 创建直链接口成功时，响应体中 `data` 字段的结构。
 * 现在是一个包含多个链接对象的数组。
 */
export type CreateDirectLinksData = DirectLinkItem[];

/**
 * 创建直链接口的完整 API 响应体结构。
 * 这是 BaseResponse 的一个具体化别名。
 */
export type CreateDirectLinksResponse =
  BaseResponse<CreateDirectLinksData | null>;

/**
 * 获取缩略图凭证接口 (GET /thumbnail/{id}) 的响应 data 结构
 */
export interface ThumbnailCredential {
  sign: string; // 凭证sign
  expires: string; // 过期时间
  status?: "processing"; // 如果正在处理中，则包含此字段
}

/**
 * 获取缩略图凭证接口的完整响应体结构
 */
export type GetThumbnailCredentialResponse = BaseResponse<ThumbnailCredential>;

export interface PreviewURLItem {
  url: string;
  file_id: string;
  file_name: string;
  file_size: number;
}

export interface FilePreviewUrlsData {
  urls: PreviewURLItem[];
  initialIndex: number;
}

export type FilePreviewUrlsResponse = BaseResponse<FilePreviewUrlsData>;

/**
 * 定义更新文件成功后的响应数据类型
 */
export interface UpdateFileContentData {
  id: string;
  size: number;
  updated: string;
}

export interface FileInfoResponse {
  file: FileItem;
  storagePolicy: StoragePolicy | null;
}
