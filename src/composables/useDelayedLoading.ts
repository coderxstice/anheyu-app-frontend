/*
 * @Description: 延迟加载 composable
 * @Author: 安知鱼
 * @Date: 2025-10-30
 */
import { ref, type Ref } from "vue";

/**
 * 延迟加载 Hook
 * 用于避免快速加载时的闪烁效果
 * @param delay 延迟时间（毫秒），默认 200ms
 * @returns 返回显示状态和控制方法
 */
export function useDelayedLoading(delay = 200) {
  // 实际的加载状态
  const isActuallyLoading = ref(false);
  // 显示给用户的加载状态（延迟后的）
  const isLoading: Ref<boolean> = ref(false);
  // 定时器
  let loadingTimer: number | null = null;

  /**
   * 开始加载
   * 只有在延迟时间后仍在加载才显示加载动画
   */
  const startLoading = () => {
    isActuallyLoading.value = true;

    // 清除之前可能存在的定时器
    if (loadingTimer !== null) {
      clearTimeout(loadingTimer);
    }

    // 延迟显示加载动画
    loadingTimer = window.setTimeout(() => {
      if (isActuallyLoading.value) {
        isLoading.value = true;
      }
      loadingTimer = null;
    }, delay);
  };

  /**
   * 停止加载
   */
  const stopLoading = () => {
    isActuallyLoading.value = false;

    // 清除定时器，防止延迟显示
    if (loadingTimer !== null) {
      clearTimeout(loadingTimer);
      loadingTimer = null;
    }

    // 隐藏加载动画
    isLoading.value = false;
  };

  /**
   * 包装异步函数，自动管理加载状态
   * @param fn 异步函数
   * @returns 包装后的函数
   */
  const withLoading = async <T>(fn: () => Promise<T>): Promise<T> => {
    startLoading();
    try {
      return await fn();
    } finally {
      stopLoading();
    }
  };

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading
  };
}
