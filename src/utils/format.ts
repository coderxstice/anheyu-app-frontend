/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-24 22:29:06
 * @LastEditTime: 2025-07-04 17:20:46
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

/**
 * 格式化为动态的相对时间
 * - 1 分钟内: "刚刚", "xx 秒前"
 * - 1 小时内: "xx 分钟前"
 * - 24 小时内: "xx 小时前"
 * - 昨天/前天
 * - 7 天内: "xx 天前"
 * - 超过 7 天: 显示绝对时间 "YYYY/MM/DD HH:mm"
 * @param dateStr - ISO 8601 格式的日期字符串
 * @returns 格式化后的时间字符串
 */
export const formatRelativeTime = (dateStr: string): string => {
  if (!dateStr) return "";

  const now = new Date();
  const past = new Date(dateStr);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  // --- 时间单位常量 (秒) ---
  const oneMinute = 60;
  const oneHour = oneMinute * 60;
  const oneDay = oneHour * 24;
  const sevenDays = oneDay * 7;

  // --- 1. 分钟内的逻辑 ---
  if (diffInSeconds < 10) {
    return "刚刚";
  }
  if (diffInSeconds < oneMinute) {
    return `${diffInSeconds} 秒前`;
  }
  if (diffInSeconds < oneHour) {
    return `${Math.floor(diffInSeconds / oneMinute)} 分钟前`;
  }

  // --- 2. 小时内的逻辑 ---
  if (diffInSeconds < oneDay) {
    return `${Math.floor(diffInSeconds / oneHour)} 小时前`;
  }

  // --- 3. 昨天/前天的逻辑 (核心修改点) ---
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - oneDay * 1000);
  const beforeYesterdayStart = new Date(
    yesterdayStart.getTime() - oneDay * 1000
  );

  if (
    past.getTime() >= yesterdayStart.getTime() &&
    past.getTime() < todayStart.getTime()
  ) {
    return "昨天";
  }
  if (
    past.getTime() >= beforeYesterdayStart.getTime() &&
    past.getTime() < yesterdayStart.getTime()
  ) {
    return "前天";
  }

  // --- 4. 7天内的逻辑 ---
  if (diffInSeconds < sevenDays) {
    // 减去昨天和前天，所以这里是 2 天前 到 6 天前
    return `${Math.floor(diffInSeconds / oneDay)} 天前`;
  }

  // --- 5. 超过7天的逻辑 ---
  return formatDateTime(dateStr);
};
