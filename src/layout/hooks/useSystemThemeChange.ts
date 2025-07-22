import { onBeforeMount, onUnmounted } from "vue";
import { useDataThemeChange } from "./useDataThemeChange";

/**
 * 一个专门用于监听操作系统主题变化，并应用到应用中的 Hook。
 */
export function useSystemThemeChange() {
  const { dataTheme, overallStyle, dataThemeChange } = useDataThemeChange();

  // 1. 获取媒体查询列表对象
  const mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");

  // 2. 定义更新函数
  const updateTheme = () => {
    // 只有当全局风格设置为 'system' 时，才响应系统变化
    if (overallStyle.value !== "system") return;

    if (mediaQueryList.matches) {
      dataTheme.value = true;
    } else {
      dataTheme.value = false;
    }
    // 调用核心的 dataThemeChange 来应用所有样式
    dataThemeChange("system");
  };

  // 3. 定义移除监听器的函数
  const removeMatchMedia = () => {
    mediaQueryList.removeEventListener("change", updateTheme);
  };

  // 4. 定义开始监听的函数（我们将导出它）
  const watchSystemThemeChange = () => {
    updateTheme(); // 立即执行一次以同步当前状态
    removeMatchMedia(); // 先移除，防止重复监听
    mediaQueryList.addEventListener("change", updateTheme);
  };

  // 5. 使用生命周期钩子，确保在组件挂载时，如果当前是 'system' 模式，则自动开始监听
  onBeforeMount(() => {
    if (overallStyle.value === "system") {
      watchSystemThemeChange();
    }
  });

  // 6. 在组件卸载时，自动清理监听器，防止内存泄漏
  onUnmounted(() => {
    removeMatchMedia();
  });

  // 7. 导出 watchSystemThemeChange 函数，以便手动调用
  return {
    watchSystemThemeChange
  };
}
