import { recordVisit } from "@/api/statistics";
import type { RouteLocationNormalized } from "vue-router";

/**
 * 路由级别的访问统计记录
 * 用于记录页面路由变化时的访问行为
 */

let currentPath: string = "";
let pageStartTime: number = 0;
let isFirstLoad: boolean = true; // 标记是否是首次加载

// 记录路由变化
export function recordRouteChange(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized
) {
  try {
    console.log(
      `路由变化触发: from=${from?.fullPath || "/"}, to=${to.fullPath}, isFirstLoad=${isFirstLoad}`
    );

    // 如果是首次加载（页面刷新或直接访问），只记录当前页面，不记录停留时间
    if (isFirstLoad) {
      currentPath = to.path;
      pageStartTime = Date.now();

      // 记录新页面的访问（初始访问）
      recordVisit({
        url_path: to.fullPath,
        page_title: document.title,
        referer: from?.fullPath || document.referrer,
        duration: 0
      });

      isFirstLoad = false;
      console.log(`✅ 首次访问记录完成: ${to.fullPath}`);
      return;
    }

    // 如果路径发生变化，记录上一个页面的停留时间
    if (currentPath && currentPath !== to.path && pageStartTime > 0) {
      const duration = Math.floor((Date.now() - pageStartTime) / 1000);
      recordVisit({
        url_path: currentPath,
        page_title: document.title,
        referer: from?.fullPath || document.referrer,
        duration: duration
      });
      console.log(`📊 记录页面停留时间: ${currentPath}, 停留${duration}秒`);
    }

    // 更新当前路径和开始时间
    currentPath = to.path;
    pageStartTime = Date.now();

    // 记录新页面的访问（初始访问）
    recordVisit({
      url_path: to.fullPath,
      page_title: document.title,
      referer: from?.fullPath || document.referrer,
      duration: 0
    });

    console.log(
      `🔄 路由变化记录完成: ${from?.fullPath || "/"} -> ${to.fullPath}`
    );
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

// 获取当前页面开始时间
export function getCurrentPageStartTime() {
  return pageStartTime;
}

// 获取当前路径
export function getCurrentPath() {
  return currentPath;
}

// 重置首次加载标记（用于特殊场景）
export function resetFirstLoadFlag() {
  isFirstLoad = true;
  console.log("重置首次加载标记");
}
