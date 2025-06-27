/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-24 22:29:06
 * @LastEditTime: 2025-06-27 23:53:44
 * @LastEditors: 安知鱼
 */
// @/utils/format.ts

/**
 * 格式化文件大小
 * @param bytes - 文件大小 (字节)
 * @returns 格式化后的大小字符串，如 "1.23 MB"
 */
export const formatSize = (bytes: number | undefined | null): string => {
  if (bytes === null || typeof bytes === "undefined" || isNaN(bytes)) {
    return "-";
  }
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * 格式化 ISO 8601 日期时间字符串
 * @param isoString - 后端返回的日期字符串
 * @returns 'YYYY-MM-DD HH:mm:ss' 格式的字符串，或在无效时返回原始字符串
 */
export const formatDateTime = (
  isoString: string | undefined | null
): string => {
  if (!isoString) return "未知";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return isoString;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error("日期格式化错误:", error);
    return isoString;
  }
};
