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
export const fetchFilesByPathApi = (
  path: string,
  sortKey: SortKey,
  page: number,
  pageSize: number
): Promise<FileListResponse> => {
  const [order, direction] = sortKey.split("_");

  // 构造 URI 字符串，不再包含其他查询参数
  // 注意：根目录的路径是 /，其他路径是 /folder，所以要处理一下
  const finalPath = path === "/" ? "" : path;
  const uri = `anzhiyu://my${finalPath}`; // URI 中只包含路径信息

  // 发起真实的 API 请求
  // 将 uri 和其他查询参数作为独立的 params 对象传递
  return http.request<FileListResponse>("get", baseUrlApi("file"), {
    params: {
      uri: uri, // 文件路径 URI
      order: order,
      direction: direction,
      page: String(page),
      page_size: String(pageSize) // 注意这里也应该是 page_size，与后端约定一致
    }
  });
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

// --- 以下为占位符 API，待后端提供接口后可替换 ---

/**
 * 模拟创建文件的 API
 * @param path 所在路径
 * @param name 文件名
 */
export const createFileApi = (path: string, name: string): Promise<any> => {
  console.log(`调用创建文件 API: 在路径 '${path}' 创建 '${name}'`);
  const uri = `anzhiyu://my${path === "/" ? "" : path}/${name}`;
  // 假设的创建文件接口
  return http.request("post", baseUrlApi("file/touch"), { data: { uri } });
};

/**
 * 模拟创建文件夹的 API
 * @param path 所在路径
 * @param name 文件夹名
 */
export const createFolderApi = (path: string, name: string): Promise<any> => {
  console.log(`调用创建文件夹 API: 在路径 '${path}' 创建 '${name}'`);
  const uri = `anzhiyu://my${path === "/" ? "" : path}/${name}`;
  // 假设的创建文件夹接口
  return http.request("post", baseUrlApi("file/folder"), { data: { uri } });
};
