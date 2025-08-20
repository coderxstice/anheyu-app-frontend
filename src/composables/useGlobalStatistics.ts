import { onMounted, onBeforeUnmount } from "vue";
import { recordVisit } from "@/api/statistics";

/**
 * 全局访问统计 - 用于所有页面的访问记录
 * 这个composable应该在每个页面的根组件中使用
 */
export function useGlobalStatistics() {
  let pageStartTime: number = 0;
  let beforeUnloadHandler: (() => void) | null = null;

  // 记录页面访问
  const recordPageVisit = async (duration = 0) => {
    try {
      await recordVisit({
        url_path: window.location.pathname,
        page_title: document.title,
        referer: document.referrer,
        duration: duration
      });
    } catch (error) {
      console.error("记录页面访问失败:", error);
    }
  };

  // 页面卸载时记录停留时间
  const handleBeforeUnload = () => {
    if (pageStartTime > 0) {
      const duration = Math.floor((Date.now() - pageStartTime) / 1000);
      // 使用 sendBeacon 确保数据不丢失
      recordPageVisit(duration);
    }
  };

  // 初始化统计
  const initGlobalStatistics = () => {
    // 记录页面开始时间
    pageStartTime = Date.now();

    // 记录页面访问（初始访问）
    recordPageVisit();

    // 添加页面卸载事件监听
    beforeUnloadHandler = handleBeforeUnload;
    window.addEventListener("beforeunload", beforeUnloadHandler);

    // 添加页面可见性变化监听（处理移动端应用切换）
    document.addEventListener("visibilitychange", handleVisibilityChange);
  };

  // 处理页面可见性变化
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // 页面隐藏时记录当前停留时间
      if (pageStartTime > 0) {
        const duration = Math.floor((Date.now() - pageStartTime) / 1000);
        recordPageVisit(duration);
      }
    } else {
      // 页面重新显示时重置开始时间
      pageStartTime = Date.now();
      recordPageVisit();
    }
  };

  // 清理统计
  const cleanupGlobalStatistics = () => {
    // 移除事件监听
    if (beforeUnloadHandler) {
      window.removeEventListener("beforeunload", beforeUnloadHandler);
      beforeUnloadHandler = null;
    }

    document.removeEventListener("visibilitychange", handleVisibilityChange);

    // 记录最终停留时间
    if (pageStartTime > 0) {
      const duration = Math.floor((Date.now() - pageStartTime) / 1000);
      recordPageVisit(duration);
    }
  };

  // 手动记录访问（用于特殊场景）
  const manualRecordVisit = async (customData?: {
    url_path?: string;
    page_title?: string;
    referer?: string;
    duration?: number;
  }) => {
    try {
      await recordVisit({
        url_path: customData?.url_path || window.location.pathname,
        page_title: customData?.page_title || document.title,
        referer: customData?.referer || document.referrer,
        duration: customData?.duration || 0
      });
    } catch (error) {
      console.error("手动记录访问失败:", error);
    }
  };

  // 自动初始化
  onMounted(() => {
    initGlobalStatistics();
  });

  // 自动清理
  onBeforeUnmount(() => {
    cleanupGlobalStatistics();
  });

  return {
    manualRecordVisit,
    initGlobalStatistics,
    cleanupGlobalStatistics
  };
}
