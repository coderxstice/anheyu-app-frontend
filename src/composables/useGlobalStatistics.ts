import { onMounted, onBeforeUnmount } from "vue";

/**
 * 全局访问统计 - 处理页面生命周期事件
 * 路由变化统计由 router/statistics.ts 处理
 * 这里只处理事件监听，不记录访问数据
 */
export function useGlobalStatistics() {
  let beforeUnloadHandler: (() => void) | null = null;

  // 页面卸载时处理（不记录访问，只处理事件）
  const handleBeforeUnload = () => {
    // 页面卸载事件，不记录访问数据
    console.log("页面卸载");
  };

  // 初始化统计
  const initGlobalStatistics = () => {
    // 添加页面卸载事件监听
    beforeUnloadHandler = handleBeforeUnload;
    window.addEventListener("beforeunload", beforeUnloadHandler);

    // 添加页面可见性变化监听（处理移动端应用切换）
    document.addEventListener("visibilitychange", handleVisibilityChange);
  };

  // 处理页面可见性变化
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // 页面隐藏时处理（不记录访问）
      console.log("页面隐藏");
    } else {
      // 页面重新显示时处理（不记录访问）
      console.log("页面重新显示");
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
    initGlobalStatistics,
    cleanupGlobalStatistics
  };
}
