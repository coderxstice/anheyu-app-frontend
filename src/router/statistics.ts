import { recordVisit } from "@/api/statistics";
import type { RouteLocationNormalized } from "vue-router";

/**
 * 路由级别的访问统计记录
 * 用于记录页面路由变化时的访问行为
 */

// 记录路由变化
export function recordRouteChange(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized
) {
  try {
    // 记录来源页面
    const referer = from?.fullPath || document.referrer;

    recordVisit({
      url_path: to.fullPath,
      page_title: document.title,
      referer: referer,
      duration: 0 // 路由变化时记录，停留时间由页面生命周期管理
    });
  } catch (error) {
    console.error("记录路由变化失败:", error);
  }
}

// 记录页面停留时间（用于SPA应用）
export function recordPageDuration(path: string, duration: number) {
  try {
    recordVisit({
      url_path: path,
      page_title: document.title,
      referer: document.referrer,
      duration: duration
    });
  } catch (error) {
    console.error("记录页面停留时间失败:", error);
  }
}
