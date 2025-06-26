import {
  type FileListResponse,
  type CreateUploadSessionResponse,
  FileType
} from "./type";
import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";

/**
 * 构建完整的后端期望的 URI 格式：anzhiyu://my/{path}
 * 例如：'/Documents' -> 'anzhiyu://my/Documents'
 * '/' -> 'anzhiyu://my/'
 *
 * @param logicalPath 逻辑路径，例如 "/" 或 "/Documents"
 * @returns 完整的 URI 字符串
 */
const buildFullUri = (logicalPath: string): string => {
  // 确保传入的 logicalPath 是以 / 开头的绝对路径
  const normalizedPath = logicalPath.startsWith("/")
    ? logicalPath
    : `/${logicalPath}`;
  // 根目录 '/' 特殊处理为 'anzhiyu://my/'，其他为 'anzhiyu://my/Documents'
  return normalizedPath === "/"
    ? `anzhiyu://my/`
    : `anzhiyu://my${normalizedPath}`;
};

/**
 * 1. 获取文件列表
 * 该方法只负责向后端请求文件列表。
 * `path` 参数现在是逻辑路径，例如 "/" 或 "/Documents"。
 * API 内部负责拼接 'anzhiyu://my/' 前缀。
 *
 * @param path 目标目录的逻辑路径，例如 "/" 或 "/Documents"
 * @param order 排序字段，例如 "name", "size", "created_at", "updated_at"
 * @param direction 排序方向，"asc" 或 "desc"
 * @param page 页码
 * @param pageSize 每页大小
 * @returns Promise<FileListResponse>
 */
export const fetchFilesByPathApi = async (
  path: string, // 现在接收逻辑路径
  order: string,
  direction: string,
  page: number,
  pageSize: number
): Promise<FileListResponse> => {
  const fullUri = buildFullUri(path); // 在 API 层拼接完整 URI

  console.log("fetchFilesByPathApi 请求参数 (内部拼接 URI):", {
    uri: fullUri,
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
          uri: fullUri, // 传递拼接好的完整 URI
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
 * `fullPath` 参数现在是逻辑路径，例如 "/Documents/new_file.zip"。
 * API 内部负责拼接 'anzhiyu://my/' 前缀。
 *
 * @param fullPath 包含文件名的完整逻辑路径，例如 "/Documents/new_file.zip"
 * @param size 文件总大小（字节）
 * @param policyId 存储策略的 ID
 * @returns Promise<CreateUploadSessionResponse>
 */
export const createUploadSessionApi = (
  fullPath: string,
  size: number,
  policyId: string
): Promise<CreateUploadSessionResponse> => {
  const fullUri = buildFullUri(fullPath);

  return http.request<CreateUploadSessionResponse>(
    "put",
    baseUrlApi("file/upload"),
    {
      data: { uri: fullUri, size, policy_id: policyId }
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
 * `fullPath` 参数现在是逻辑路径，例如 "/Documents/deleted_file.txt"。
 * API 内部负责拼接 'anzhiyu://my/' 前缀。
 *
 * @param sessionId 要删除的会话 ID
 * @param fullPath 创建会话时使用的目标文件逻辑路径
 * @returns Promise<any>
 */
export const deleteUploadSessionApi = (
  sessionId: string,
  fullPath: string // 现在接收逻辑路径
): Promise<any> => {
  const fullUri = buildFullUri(fullPath); // 在 API 层拼接完整 URI

  return http.request("delete", baseUrlApi("file/upload"), {
    data: { id: sessionId, uri: fullUri } // 传递拼接好的完整 URI
  });
};

/**
 * 5. 创建空文件或目录
 * `type` 必须是后端期望的数字 (0 代表文件，1 代表文件夹)。
 * `logicalPath` 必须是后端期望的完整逻辑路径，例如 "/New Folder" 或 "/newfile.txt"。
 * API 内部负责拼接 'anzhiyu://my/' 前缀。
 *
 * Endpoint: POST /file/create
 *
 * @param type 后端期望的数字类型，0 (文件) 或 1 (文件夹)
 * @param logicalPath 要创建的文件或目录的完整逻辑路径
 * @param errOnConflict 如果为 true，当目标已存在时返回错误。
 * @returns Promise<any> 返回新创建的文件/目录的 FileItem 信息。
 */
export const createItemApi = (
  type: number,
  logicalPath: string, // 现在接收逻辑路径
  errOnConflict: boolean = false
): Promise<any> => {
  const fullUri = buildFullUri(logicalPath); // 在 API 层拼接完整 URI

  console.log(`调用创建 API (内部拼接 URI): 类型 ${type}, URI '${fullUri}'`);

  if (type !== FileType.File && type !== FileType.Dir) {
    throw new Error("Invalid type: must be 0 (File) or 1 (Dir)");
  }

  return http.request("post", baseUrlApi("file/create"), {
    data: {
      type: type, // 直接使用传入的数字类型
      uri: fullUri, // 传递拼接好的完整 URI
      err_on_conflict: errOnConflict
    }
  });
};

// --- 以下为创建文件和文件夹的辅助函数，它们只负责调用 createItemApi 并传递处理好的参数 ---

/**
 * 创建空文件的辅助 API
 * @param logicalPath 要创建的文件完整逻辑路径
 * @param errOnConflict 如果为 true，当目标已存在时返回错误。
 * @returns Promise<any>
 */
export const createFileApi = (
  logicalPath: string,
  errOnConflict: boolean = false
): Promise<any> => {
  return createItemApi(FileType.File, logicalPath, errOnConflict); // 0 代表文件 (通过 FileType.File)
};

/**
 * 创建文件夹的辅助 API
 * @param logicalPath 要创建的文件夹完整逻辑路径
 * @param errOnConflict 如果为 true，当目标已存在时返回错误。
 * @returns Promise<any>
 */
export const createFolderApi = (
  logicalPath: string,
  errOnConflict: boolean = false
): Promise<any> => {
  return createItemApi(FileType.Dir, logicalPath, errOnConflict); // 1 代表文件夹 (通过 FileType.Dir)
};
