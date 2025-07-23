// src/api/sys-file/sys-file.ts

import {
  type FileListResponse,
  type CreateUploadSessionResponse,
  FileType,
  type FolderViewConfig,
  type UpdateFolderViewResponse,
  type ValidateUploadSessionResponse,
  type FolderSizeResponse,
  type BaseResponse,
  type ColumnConfig,
  type CreateDirectLinksRequest,
  type CreateDirectLinksResponse,
  type GetThumbnailCredentialResponse,
  type FilePreviewUrlsResponse,
  type UpdateFileContentData,
  type FileInfoResponse
} from "./type";
import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";
import { buildFullUri } from "@/utils/fileUtils";
import { ElMessage } from "element-plus";

// 文件夹内容树 API 的类型定义
export interface FolderTreeFile {
  url: string;
  relative_path: string;
  size: number;
}
export interface FolderTreeData {
  files: FolderTreeFile[];
  expires: string;
}
export interface FolderTreeResponse {
  code: number;
  message: string;
  data: FolderTreeData;
}

export interface FileDetailResponse {
  code: number;
  message: string;
  data: FileInfoResponse & { url?: string };
}

/**
 * 复制一个或多个文件/文件夹到指定目录
 * @param sourceIDs 要复制的项目的公共ID数组
 * @param destinationID 目标文件夹的公共ID
 * @returns Promise
 */
export const copyFilesApi = (sourceIDs: string[], destinationID: string) => {
  return http.post<BaseResponse<null>, any>(baseUrlApi("folder/copy"), {
    sourceIDs,
    destinationID
  });
};

/**
 * @description 获取指定文件缩略图的访问凭证 (URL token)
 * @param publicId 文件的公共 ID
 * @returns {Promise<GetThumbnailCredentialResponse>} 返回一个 Promise，包含可用于访问缩略图的相对 URL
 */
export const getThumbnailCredentialApi = (
  publicId: string
): Promise<GetThumbnailCredentialResponse> => {
  return http.request<GetThumbnailCredentialResponse>(
    "get",
    baseUrlApi(`thumbnail/${publicId}`)
  );
};

/**
 * 从任意 URL 获取文件内容的底层函数
 * 它不使用全局 http 实例，以避免为预签名 URL 添加不必要的 `Authorization` 头。
 * @param url 要获取内容的完整 URL
 * @returns Promise<Blob>
 */
export const fetchBlobFromUrl = async (url: string): Promise<Blob> => {
  // 对于后端返回的相对路径（如本地文件的签名URL），需要拼接上基础路径，如果是本地存储的话，会返回相对路径
  const finalUrl = url;
  // `http://localhost:8091/api/${url}`"/download/ARgsz?expires=1751059147\u0026sign=XrAcDPV0Oy8o4ln6w0aiHXzHWtUHw5H3K9ES2fL1RY4=";

  console.log(`请求 URL: ${finalUrl}`);

  try {
    const response = await fetch(finalUrl);
    if (!response.ok) {
      throw new Error(
        `文件下载失败，状态: ${response.status} ${response.statusText}`
      );
    }
    return await response.blob();
  } catch (error) {
    console.error(`请求 URL [${finalUrl}] 出错:`, error);
    throw error;
  }
};

/**
 * 触发浏览器下载的辅助函数
 * @param blob 文件内容的 Blob 对象
 * @param fileName 下载时要显示的文件名
 */
const triggerBrowserDownload = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// API 函数

/**
 * @description 获取文件列表。排序规则由后端根据文件夹设置决定。
 * @param {string} path - 目标路径的逻辑部分, 例如 "/Images"。
 * @param {string | null} [next_token] - 可选的分页游标。
 * @returns {Promise<FileListResponse>}
 */
export const fetchFilesByPathApi = async (
  path: string,
  next_token?: string | null
): Promise<FileListResponse> => {
  const fullUri = buildFullUri(path);

  const params: any = {
    uri: fullUri
  };

  if (next_token) {
    params.next_token = next_token;
  }

  try {
    return await http.request<FileListResponse>("get", baseUrlApi("file"), {
      params
    });
  } catch (error) {
    console.error("fetchFilesByPathApi 请求失败:", error);
    throw error;
  }
};

export const createUploadSessionApi = (
  fullPath: string,
  size: number,
  policyId: string,
  overwrite = false
): Promise<CreateUploadSessionResponse> => {
  const fullUri = buildFullUri(fullPath);
  return http.request<CreateUploadSessionResponse>(
    "put",
    baseUrlApi("file/upload"),
    {
      data: { uri: fullUri, size, policy_id: policyId, overwrite }
    }
  );
};

export const uploadChunkApi = (
  sessionId: string,
  index: number,
  chunk: Blob
): Promise<any> => {
  return http.request("post", baseUrlApi(`file/upload/${sessionId}/${index}`), {
    data: chunk,
    headers: { "Content-Type": "application/octet-stream" }
  });
};

export const deleteUploadSessionApi = (
  sessionId: string,
  fullPath: string
): Promise<any> => {
  const fullUri = buildFullUri(fullPath);
  return http.request("delete", baseUrlApi("file/upload"), {
    data: { id: sessionId, uri: fullUri }
  });
};

export const createItemApi = (
  type: number,
  logicalPath: string,
  errOnConflict = false
): Promise<any> => {
  const fullUri = buildFullUri(logicalPath);
  if (type !== FileType.File && type !== FileType.Dir) {
    throw new Error("类型错误: 必须是文件或文件夹");
  }
  return http.request("post", baseUrlApi("file/create"), {
    data: { type, uri: fullUri, err_on_conflict: errOnConflict }
  });
};

/**
 * @description 更新文件夹的视图配置，现在包括列配置
 * @param folder_id 文件夹ID
 * @param viewConfig 视图配置对象，包含排序、分页、视图模式和列
 * @returns Promise<UpdateFolderViewResponse>
 */
export const updateFolderViewApi = (
  folder_id: string,
  viewConfig: FolderViewConfig & { columns?: ColumnConfig[] }
): Promise<UpdateFolderViewResponse> => {
  return http.request<UpdateFolderViewResponse>(
    "put",
    baseUrlApi("folder/view"),
    {
      data: { folder_id, view: viewConfig }
    }
  );
};

export const validateUploadSessionApi = (
  sessionId: string
): Promise<ValidateUploadSessionResponse> => {
  return http.request<ValidateUploadSessionResponse>(
    "get",
    baseUrlApi(`file/upload/session/${sessionId}`)
  );
};

// 获取文件列表
export const deleteFilesApi = (ids: string[]): Promise<any> => {
  return http.request("delete", baseUrlApi("file"), { data: { ids } });
};

// 重命名文件
export const renameFileApi = (id: string, newName: string): Promise<any> => {
  return http.request("put", baseUrlApi("file/rename"), {
    data: { id, new_name: newName }
  });
};

// 获取文件详情
export const getFileDetailsApi = (id: string): Promise<FileDetailResponse> => {
  return http.request<FileDetailResponse>("get", baseUrlApi(`file/${id}`));
};

/**
 * 下载单个文件（标准认证接口）
 */
export const downloadFileApi = async (id: string, fileName: string) => {
  try {
    const blob = await http.request<Blob>(
      "get",
      baseUrlApi(`file/download/${id}`),
      { responseType: "blob" }
    );
    triggerBrowserDownload(blob, fileName);
  } catch (error: any) {
    console.error("下载失败:", error);
    ElMessage.error(error.message || `下载文件 "${fileName}" 失败`);
    throw error;
  }
};

/**
 * 获取文件夹内容树（用于打包下载）
 */
export const getFolderTreeApi = (id: string): Promise<FolderTreeResponse> => {
  return http.request<FolderTreeResponse>(
    "get",
    baseUrlApi(`folder/tree/${id}`)
  );
};

/**
 * 计算指定文件夹的大小信息
 * @param folderId 要计算的文件夹的公共ID
 * @returns Promise<FolderSizeResponse>
 */
export const calculateFolderSize = (folderId: string) => {
  return http.request<FolderSizeResponse>(
    "get",
    baseUrlApi(`folder/size/${folderId}`)
  );
};

/**
 * 移动一个或多个文件/文件夹到指定目录
 * @param sourceIDs 要移动的项目的公共ID数组
 * @param destinationID 目标文件夹的公共ID
 * @returns Promise 返回一个基础响应，成功时 data 为 null
 */
export const moveFilesApi = (sourceIDs: string[], destinationID: string) => {
  return http.post<BaseResponse<null>, any>(baseUrlApi(`folder/move`), {
    sourceIDs,
    destinationID
  });
};

/**
 * 为一个或多个文件创建直链。
 * @param fileIds 要创建直链的文件的公共ID数组
 * @returns Promise<CreateDirectLinksResponse> - 返回一个Promise，它解析为完整的API响应对象。
 */
export const createDirectLinksApi = (
  fileIds: string[]
): Promise<CreateDirectLinksResponse> => {
  const requestData: CreateDirectLinksRequest = {
    file_ids: fileIds
  };

  return http.post<CreateDirectLinksResponse, CreateDirectLinksRequest>(
    baseUrlApi("direct-links"),
    requestData
  );
};

/**
 * @description 获取指定文件所在目录下的所有文件的预览URL列表
 * @param {string} publicId 文件的 publicID
 * @returns {Promise<FilePreviewUrlsResponse>}
 */
export const getFilePreviewUrlsApi = (
  publicId: string
): Promise<FilePreviewUrlsResponse> => {
  return http.request<FilePreviewUrlsResponse>(
    "get",
    baseUrlApi("file/preview-urls"),
    {
      params: { id: publicId }
    }
  );
};

/**
 * @description 手动触发指定文件缩略图的重新生成
 * @param {string} publicId 要重新生成缩略图的文件的 publicID
 * @returns {Promise<BaseResponse<{ status: string }>>}
 */
export const regenerateThumbnailApi = (
  publicId: string
): Promise<BaseResponse<{ status: string }>> => {
  return http.request<BaseResponse<{ status: string }>>(
    "post",
    baseUrlApi("thumbnail/regenerate"),
    {
      data: { id: publicId }
    }
  );
};

/**
 * 通过文件的唯一公开ID替换其内容
 * @param {string} publicId 要更新的文件的唯一公开ID
 * @param {string} uri 文件当前的规范URI，用于路径验证
 * @param {string | Blob} content 新的文件内容
 * @returns {Promise<BaseResponse<...>>}
 */
export const updateFileContentByPublicIdApi = (
  publicId: string,
  uri: string,
  content: string | Blob
): Promise<BaseResponse<UpdateFileContentData>> => {
  return http.request<BaseResponse<UpdateFileContentData>>(
    "put",
    // 使用模板字符串动态构建路径
    baseUrlApi(`file/content/${publicId}`),
    {
      params: { uri }, // uri 作为查询参数
      data: content,
      // 根据文档，发送原始字节流
      headers: { "Content-Type": "application/octet-stream" }
    }
  );
};
