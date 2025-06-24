/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-24 22:29:06
 * @LastEditTime: 2025-06-24 22:29:12
 * @LastEditors: 安知鱼
 */
/**
 * 格式化文件大小，提高可读性
 * @param kb 文件大小 (KB)
 * @returns 格式化后的字符串
 */
export const formatSize = (kb?: number): string => {
  if (kb === undefined || isNaN(kb)) return "-";
  if (kb < 1024) return `${kb} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = (mb / 1024).toFixed(2);
  return `${gb} GB`;
};
