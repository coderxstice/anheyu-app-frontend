/*
 * @Description: dayjs 配置文件，统一配置时区为 Asia/Shanghai (+8)
 * @Author: 安知鱼
 * @Date: 2025-01-06
 */
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";

// 扩展 dayjs 插件
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

// 设置默认时区为中国时区 (UTC+8)
dayjs.tz.setDefault("Asia/Shanghai");

// 设置中文 locale
dayjs.locale("zh-cn");

/**
 * 将时间转换为中国时区并格式化
 * @param date - 日期字符串或 Date 对象
 * @param format - 格式化字符串，默认 "YYYY-MM-DD HH:mm:ss"
 * @returns 格式化后的时间字符串
 */
export const formatToChina = (
  date: string | Date | dayjs.Dayjs,
  format: string = "YYYY-MM-DD HH:mm:ss"
): string => {
  if (!date) return "";
  return dayjs(date).tz("Asia/Shanghai").format(format);
};

/**
 * 将 UTC 时间转换为中国时区的 dayjs 对象
 * @param date - 日期字符串或 Date 对象
 * @returns dayjs 对象
 */
export const toChinaTime = (date: string | Date | dayjs.Dayjs): dayjs.Dayjs => {
  return dayjs(date).tz("Asia/Shanghai");
};

// 导出配置好的 dayjs 实例
export default dayjs;
