/*
 * @Description: 格式化文件大小，提高可读性
 * @Author: 安知鱼
 * @Date: 2025-06-24 22:29:06
 * @LastEditTime: 2025-06-26 16:25:42
 * @LastEditors: 安知鱼
 */
/**
 * 格式化文件大小，提高可读性
 * @param bytes 文件大小 (单位: B)
 * @returns 格式化后的字符串
 */
export const formatSize = (bytes?: number): string => {
  // 处理 undefined, null, NaN 或负数等无效输入
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes < 0) {
    return "-";
  }

  // 单独处理目录或空文件的情况
  if (bytes === 0) return "-";

  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  // 对B单位不保留小数，KB及以上保留1位小数
  const precision = i === 0 ? 0 : 1;

  const value = (bytes / Math.pow(1024, i)).toFixed(precision);

  return `${value} ${units[i]}`;
};
