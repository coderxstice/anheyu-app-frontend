/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-24 22:29:06
 * @LastEditTime: 2025-01-06 00:00:00
 * @LastEditors: 安知鱼
 */
// @/utils/format.ts

import dayjs from "./dayjs";

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
 * 格式化 ISO 8601 日期时间字符串（使用中国时区 +8）
 * @param isoString - 后端返回的日期字符串
 * @returns 'YYYY-MM-DD HH:mm:ss' 格式的字符串，或在无效时返回原始字符串
 */
export const formatDateTime = (
  isoString: string | undefined | null
): string => {
  if (!isoString) return "未知";
  try {
    const d = dayjs(isoString).tz("Asia/Shanghai");
    if (!d.isValid()) {
      return isoString;
    }
    return d.format("YYYY-MM-DD HH:mm:ss");
  } catch (error) {
    console.error("日期格式化错误:", error);
    return isoString;
  }
};

/**
 * 格式化为日期字符串（仅日期，不含时间，使用中国时区 +8）
 * @param isoString - 后端返回的日期字符串
 * @returns 'YYYY-MM-DD' 格式的字符串
 */
export const formatDate = (isoString: string | undefined | null): string => {
  if (!isoString) return "未知";
  try {
    const d = dayjs(isoString).tz("Asia/Shanghai");
    if (!d.isValid()) {
      return isoString;
    }
    return d.format("YYYY-MM-DD");
  } catch (error) {
    console.error("日期格式化错误:", error);
    return isoString;
  }
};

/**
 * 格式化为动态的相对时间（使用中国时区 +8）
 * - 1 分钟内: "刚刚", "xx 秒前"
 * - 1 小时内: "xx 分钟前"
 * - 24 小时内: "xx 小时前"
 * - 昨天/前天
 * - 7 天内: "xx 天前"
 * - 超过 7 天: 显示绝对日期 "YYYY-MM-DD"
 * @param dateStr - ISO 8601 格式的日期字符串
 * @returns 格式化后的时间字符串
 */
export const formatRelativeTime = (dateStr: string): string => {
  if (!dateStr) return "";

  // 使用中国时区
  const now = dayjs().tz("Asia/Shanghai");
  const past = dayjs(dateStr).tz("Asia/Shanghai");

  if (!past.isValid()) return "";

  const diffInSeconds = now.diff(past, "second");

  const oneMinute = 60;
  const oneHour = oneMinute * 60;
  const oneDay = oneHour * 24;
  const sevenDays = oneDay * 7;

  if (diffInSeconds < 10) {
    return "刚刚";
  }
  if (diffInSeconds < oneMinute) {
    return `${diffInSeconds} 秒前`;
  }
  if (diffInSeconds < oneHour) {
    return `${Math.floor(diffInSeconds / oneMinute)} 分钟前`;
  }

  if (diffInSeconds < oneDay) {
    return `${Math.floor(diffInSeconds / oneHour)} 小时前`;
  }

  const todayStart = now.startOf("day");
  const yesterdayStart = todayStart.subtract(1, "day");
  const beforeYesterdayStart = todayStart.subtract(2, "day");

  if (past.isAfter(yesterdayStart) && past.isBefore(todayStart)) {
    return "昨天";
  }
  if (past.isAfter(beforeYesterdayStart) && past.isBefore(yesterdayStart)) {
    return "前天";
  }

  if (diffInSeconds < sevenDays) {
    // 减去昨天和前天，所以这里是 2 天前 到 6 天前
    return `${Math.floor(diffInSeconds / oneDay)} 天前`;
  }

  // 超过 7 天，显示日期（不含时间）
  return formatDate(dateStr);
};
