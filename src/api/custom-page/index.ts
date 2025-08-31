/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-31 21:21:55
 * @LastEditTime: 2025-08-31 21:43:06
 * @LastEditors: 安知鱼
 */
import { http } from "@/utils/http";

// 获取自定义页面
export function getCustomPage(path: string) {
  // 去掉路径中的前导斜杠，因为路由期望的是相对路径
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return http.request("get", `/api/public/pages/${cleanPath}`);
}
