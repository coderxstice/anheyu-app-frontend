/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-26 18:32:39
 * @LastEditTime: 2025-06-26 18:32:51
 * @LastEditors: 安知鱼
 */
/**
 * 将基础路径和名称拼接成一个完整路径。
 * 能优雅地处理根目录的情况。
 * @param basePath 基础路径，例如 "/" 或 "/folder"
 * @param name 要追加的名称，例如 "file.txt"
 * @returns 组合后的路径，例如 "/file.txt" 或 "/folder/file.txt"
 */
export const joinPath = (basePath: string, name: string): string => {
  if (!name) return basePath;
  if (basePath === "/") {
    return `/${name}`;
  }
  // 确保在拼接前，基础路径没有末尾的斜杠
  return `${basePath.replace(/\/$/, "")}/${name}`;
};

/**
 * 从自定义协议的 URI 中提取逻辑路径。
 * @param uri URI 或路径，例如 "anzhiyu://my/folder" 或 "/folder"
 * @returns 逻辑路径，例如 "/folder"
 */
export const extractLogicalPathFromUri = (uri: string): string => {
  const prefix = "anzhiyu://my";
  if (uri.startsWith(prefix)) {
    let path = uri.substring(prefix.length);
    // 确保根目录返回的是 "/"
    if (path === "" || path === "/") return "/";
    // 确保返回的路径以 "/" 开头
    return path.startsWith("/") ? path : `/${path}`;
  }
  // 如果已经是逻辑路径，则直接返回
  return uri;
};
