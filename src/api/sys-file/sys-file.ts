import type { FileListResponse, CreateUploadSessionResponse } from "./type";
import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";
/**
 * 1. 获取文件列表
 * 该方法只负责向后端请求文件列表。
 * `targetUri` 必须是后端期望的完整 URI 格式，例如 "anzhiyu://my/" 或 "anzhiyu://my/Documents"。
 * `order` 和 `direction` 也应是后端期望的字符串。
 *
 * @param targetUri 目标目录的完整 URI，例如 "anzhiyu://my/" 或 "anzhiyu://my/Documents"
 * @param order 排序字段，例如 "name", "size", "created_at", "updated_at"
 * @param direction 排序方向，"asc" 或 "desc"
 * @param page 页码
 * @param pageSize 每页大小
 * @returns Promise<FileListResponse>
 */
export const fetchFilesByPathApi = async (
  targetUri: string, // 现在直接接收完整的 URI
  order: string, // 直接接收排序字段
  direction: string, // 直接接收排序方向
  page: number,
  pageSize: number
): Promise<FileListResponse> => {
  console.log("fetchFilesByPathApi 请求参数 (纯净版):", {
    uri: targetUri,
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
          uri: targetUri, // 直接使用传入的完整 URI
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
 * `fullFileUri` 必须是后端期望的完整文件 URI 格式。
 *
 * @param fullFileUri 包含文件名的完整目标 URI，例如 "anzhiyu://my/Documents/new_file.zip"
 * @param size 文件总大小（字节）
 * @param policyId 存储策略的 ID
 * @returns Promise<CreateUploadSessionResponse>
 */
export const createUploadSessionApi = (
  fullFileUri: string, // 现在直接接收完整的 URI
  size: number,
  policyId: string
): Promise<CreateUploadSessionResponse> => {
  return http.request<CreateUploadSessionResponse>(
    "put",
    baseUrlApi("file/upload"),
    {
      data: { uri: fullFileUri, size, policy_id: policyId } // 直接使用传入的完整 URI
    }
  );
};

/**
 * 3. 上传文件块 (保持不变，因为路径在 Endpoint 中)
 *
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
 * `fullFileUri` 必须是后端期望的完整文件 URI 格式。
 *
 * @param sessionId 要删除的会话 ID
 * @param fullFileUri 创建会话时使用的目标文件 URI
 * @returns Promise<any>
 */
export const deleteUploadSessionApi = (
  sessionId: string,
  fullFileUri: string // 现在直接接收完整的 URI
): Promise<any> => {
  return http.request("delete", baseUrlApi("file/upload"), {
    data: { id: sessionId, uri: fullFileUri } // 直接使用传入的完整 URI
  });
};

/**
 * 5. 创建空文件或目录
 * `type` 必须是后端期望的数字 (0 代表文件，1 代表文件夹)。
 * `fullTargetUri` 必须是后端期望的完整 URI 格式，例如 "anzhiyu://my/New Folder" 或 "anzhiyu://my/newfile.txt"。
 *
 * Endpoint: POST /file/create
 *
 * @param type 后端期望的数字类型，0 (文件) 或 1 (文件夹)
 * @param fullTargetUri 要创建的文件或目录的完整 URI
 * @param errOnConflict 如果为 true，当目标已存在时返回错误。
 * @returns Promise<any> 返回新创建的文件/目录的 FileItem 信息。
 */
export const createItemApi = (
  type: number, // 现在直接接收数字类型
  fullTargetUri: string, // 现在直接接收完整的 URI
  errOnConflict: boolean = false
): Promise<any> => {
  console.log(`调用创建 API (纯净版): 类型 ${type}, URI '${fullTargetUri}'`);

  return http.request("post", baseUrlApi("file/create"), {
    data: {
      type: type, // 直接使用传入的数字类型
      path: fullTargetUri, // 直接使用传入的完整 URI
      err_on_conflict: errOnConflict
    }
  });
};

// --- 以下为创建文件和文件夹的辅助函数，现在它们也只负责调用 createItemApi 并传递处理好的参数 ---

/**
 * 创建空文件的辅助 API
 * @param fullFileUri 要创建的文件完整 URI
 * @param errOnConflict 如果为 true，当目标已存在时返回错误。
 * @returns Promise<any>
 */
export const createFileApi = (
  fullFileUri: string,
  errOnConflict: boolean = false
): Promise<any> => {
  return createItemApi(0, fullFileUri, errOnConflict); // 0 代表文件
};

/**
 * 创建文件夹的辅助 API
 * @param fullFolderUri 要创建的文件夹完整 URI
 * @param errOnConflict 如果为 true，当目标已存在时返回错误。
 * @returns Promise<any>
 */
export const createFolderApi = (
  fullFolderUri: string,
  errOnConflict: boolean = false
): Promise<any> => {
  return createItemApi(1, fullFolderUri, errOnConflict); // 1 代表文件夹
};
