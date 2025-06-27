// src/api/sys-file/sys-file.ts

import {
  type FileListResponse,
  type CreateUploadSessionResponse,
  FileType,
  type FolderViewConfig,
  type UpdateFolderViewResponse,
  type ValidateUploadSessionResponse
} from "./type";
import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";
import { buildFullUri } from "@/utils/fileUtils";

/**
 * 1. 获取文件列表
 */
export const fetchFilesByPathApi = async (
  path: string,
  order: string,
  direction: string,
  page: number,
  pageSize: number
): Promise<FileListResponse> => {
  const fullUri = buildFullUri(path);

  try {
    const response = await http.request<FileListResponse>(
      "get",
      baseUrlApi("file"),
      {
        params: {
          uri: fullUri,
          order: order,
          direction: direction,
          page: String(page),
          page_size: String(pageSize)
        }
      }
    );

    console.log("fetchFilesByPathApi 后端返回数据:", response);
    return response;
  } catch (error) {
    console.error("fetchFilesByPathApi 请求失败:", error);
    throw error;
  }
};

/**
 * 2. 创建上传会话
 * (此函数保持不变)
 */
export const createUploadSessionApi = (
  fullPath: string,
  size: number,
  policyId: string,
  overwrite: boolean = false
): Promise<CreateUploadSessionResponse> => {
  const fullUri = buildFullUri(fullPath); // 现在使用的是从 utils 导入的函数

  return http.request<CreateUploadSessionResponse>(
    "put",
    baseUrlApi("file/upload"),
    {
      data: { uri: fullUri, size, policy_id: policyId, overwrite }
    }
  );
};

/**
 * 3. 上传文件块
 * (此函数保持不变)
 */
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

/**
 * 4. 删除/中止上传会话
 * (此函数保持不变)
 */
export const deleteUploadSessionApi = (
  sessionId: string,
  fullPath: string
): Promise<any> => {
  const fullUri = buildFullUri(fullPath);

  return http.request("delete", baseUrlApi("file/upload"), {
    data: { id: sessionId, uri: fullUri }
  });
};

/**
 * 5. 创建空文件或目录
 */
export const createItemApi = (
  type: number,
  logicalPath: string,
  errOnConflict: boolean = false
): Promise<any> => {
  const fullUri = buildFullUri(logicalPath);

  console.log(`调用创建 API (内部拼接 URI): 类型 ${type}, URI '${fullUri}'`);

  if (type !== FileType.File && type !== FileType.Dir) {
    throw new Error("Invalid type: must be 0 (File) or 1 (Dir)");
  }

  return http.request("post", baseUrlApi("file/create"), {
    data: {
      type: type,
      uri: fullUri,
      err_on_conflict: errOnConflict
    }
  });
};

// --- 创建文件和文件夹的辅助函数 (保持不变) ---
export const createFileApi = (
  logicalPath: string,
  errOnConflict: boolean = false
): Promise<any> => {
  return createItemApi(FileType.File, logicalPath, errOnConflict);
};

export const createFolderApi = (
  logicalPath: string,
  errOnConflict: boolean = false
): Promise<any> => {
  return createItemApi(FileType.Dir, logicalPath, errOnConflict);
};

/**
 * 更新文件夹的视图配置
 * @param folder_id 文件夹的公共 ID
 * @param viewConfig 新的视图配置对象
 * @returns Promise<UpdateFolderViewResponse>
 */
export const updateFolderViewApi = (
  folder_id: string, // 参数从 uri 变为 folder_id
  viewConfig: FolderViewConfig
): Promise<UpdateFolderViewResponse> => {
  return http.request<UpdateFolderViewResponse>(
    "put",
    baseUrlApi("folder/view"),
    {
      data: {
        folder_id: folder_id, // 传递 folder_id
        view: viewConfig
      }
    }
  );
};

/**
 * 检查上传会话状态 (断点续传)
 * @param sessionId 会话 ID
 * @returns Promise<ValidateUploadSessionResponse>
 */
export const validateUploadSessionApi = (
  sessionId: string
): Promise<ValidateUploadSessionResponse> => {
  return http.request<ValidateUploadSessionResponse>(
    "get",
    baseUrlApi(`file/upload/session/${sessionId}`)
  );
};
