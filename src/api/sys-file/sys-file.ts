import type { FileListResponse, CreateUploadSessionResponse } from "./type";
import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";
import type { SortKey } from "@/store/modules/fileStore";

/**
 * 1. 获取文件列表
 * @param path The directory path, e.g., "/" or "/Documents"
 * @param sortKey The sort key from the store, e.g., "name_asc"
 * @param page The page number, starting from 1
 * @param pageSize The number of items per page
 * @returns Promise<FileListResponse>
 */
export const fetchFilesByPathApi = async (
  // 将函数改为 async
  path: string,
  sortKey: SortKey,
  page: number,
  pageSize: number
): Promise<FileListResponse> => {
  const [order, direction] = sortKey.split("_");

  const finalPath = path === "/" ? "" : path;
  const uri = `anzhiyu://my${finalPath}`; // URI 中只包含路径信息

  console.log("fetchFilesByPathApi 请求参数:", {
    // 新增日志：请求参数
    uri: uri,
    order: order,
    direction: direction,
    page: String(page),
    page_size: String(pageSize)
  });

  try {
    const response = await http.request<FileListResponse>(
      "get",
      baseUrlApi("file"),
      {
        params: {
          uri: uri,
          order: order,
          direction: direction,
          page: String(page),
          page_size: String(pageSize)
        }
      }
    );

    console.log("fetchFilesByPathApi 后端返回数据:", response); // *** 关键新增日志：打印后端返回的完整数据 ***

    return response;
  } catch (error) {
    console.error("fetchFilesByPathApi 请求失败:", error); // 新增日志：请求失败
    throw error; // 重新抛出错误，让调用者可以捕获
  }
};

/**
 * 2. 创建上传会话
 * @param fullPath 包含文件名的完整目标路径, e.g., "/Documents/new_file.zip"
 * @param size 文件总大小（字节）
 * @param policyId 存储策略的 ID
 * @returns Promise<CreateUploadSessionResponse>
 */
export const createUploadSessionApi = (
  fullPath: string,
  size: number,
  policyId: string
): Promise<CreateUploadSessionResponse> => {
  const uri = `anzhiyu://my${fullPath}`;
  return http.request<CreateUploadSessionResponse>(
    "put",
    baseUrlApi("file/upload"),
    {
      data: { uri, size, policy_id: policyId }
    }
  );
};

/**
 * 3. 上传文件块
 * @param sessionId 从上一步获取的会话 ID
 * @param index 当前块的索引，从 0 开始
 * @param chunk 文件块的原始二进制数据 (Blob)
 * @returns Promise<any>
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
 * @param sessionId 要删除的会话 ID
 * @param fullPath 创建会话时使用的目标文件 URI
 * @returns Promise<any>
 */
export const deleteUploadSessionApi = (
  sessionId: string,
  fullPath: string
): Promise<any> => {
  const uri = `anzhiyu://my${fullPath}`;
  return http.request("delete", baseUrlApi("file/upload"), {
    data: { id: sessionId, uri }
  });
};

/**
 * 创建文件或文件夹的通用 API
 * @param type 'file' 或 'folder'
 * @param path 所在路径，例如 "/" 或 "/Documents"
 * @param name 文件名或文件夹名
 * @param errOnConflict 如果为 true，当目标已存在时返回错误。默认为 false。
 */
export const createItemApi = (
  type: "file" | "folder",
  path: string,
  name: string,
  errOnConflict: boolean = false
): Promise<any> => {
  console.log(`调用创建 ${type} API: 在路径 '${path}' 创建 '${name}'`);
  const finalPath = path === "/" ? "" : path;
  const uri = `anzhiyu://my${finalPath}/${name}`;

  return http.request("post", baseUrlApi("file/create"), {
    data: {
      type: type,
      uri: uri,
      err_on_conflict: errOnConflict
    }
  });
};

/**
 * 创建空文件的 API
 * @param path 所在路径
 * @param name 文件名
 * @param errOnConflict 如果为 true，当目标已存在时返回错误。默认为 false。
 */
export const createFileApi = (
  path: string,
  name: string,
  errOnConflict: boolean = false
): Promise<any> => {
  return createItemApi("file", path, name, errOnConflict);
};

/**
 * 创建文件夹的 API
 * @param path 所在路径
 * @param name 文件夹名
 * @param errOnConflict 如果为 true，当目标已存在时返回错误。默认为 false。
 */
export const createFolderApi = (
  path: string,
  name: string,
  errOnConflict: boolean = false
): Promise<any> => {
  return createItemApi("folder", path, name, errOnConflict);
};
