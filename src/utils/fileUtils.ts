/*
 * @Description: 文件处理相关的工具函数
 * @Author: 安知鱼
 * @Date: 2025-06-26 18:32:39
 * @LastEditTime: 2025-07-02 15:00:00
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

/**
 * +++ 新增函数 +++
 * 从文件名中提取扩展名。
 * @param filename 文件名
 * @returns 小写的扩展名，不带点
 */
export const getFileExtension = (filename: string): string => {
  if (!filename || filename.lastIndexOf(".") === -1) {
    return "";
  }
  return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
};

/**
 * +++ 新增函数 +++
 * 构建完整的后端期望的 URI 格式：anzhiyu://my/{path}
 * @param logicalPath 逻辑路径，例如 "/" 或 "/Documents"
 * @returns 完整的 URI 字符串
 */
export const buildFullUri = (logicalPath: string): string => {
  const prefix = "anzhiyu://my"; // 你的 URI 前缀

  // 确保传入的 logicalPath 是以 / 开头的绝对路径
  if (!logicalPath.startsWith("/")) {
    logicalPath = "/" + logicalPath;
  }

  // 如果逻辑路径只是根目录 "/"，直接返回带斜杠的前缀
  if (logicalPath === "/") {
    return `${prefix}/`;
  }

  // 否则，拼接前缀和逻辑路径
  return `${prefix}${logicalPath}`;
};
