import { watch, computed, type Ref } from "vue";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import { useSystemThemeChange } from "@/layout/hooks/useSystemThemeChange";
import type AzTextPreview from "@/components/AzTextPreview/index.vue";

/**
 * 一个专门处理 Monaco Editor 主题切换的组合式函数。
 * 它智能地结合了 useDataThemeChange 和 useSystemThemeChange，
 * 来为 Monaco Editor 提供正确的主题。
 */
export function useMonacoTheme(
  textPreviewRef: Ref<InstanceType<typeof AzTextPreview> | null>
) {
  // 1. 获取核心的主题状态和切换函数
  const { overallStyle, dataTheme } = useDataThemeChange();

  // 2. 调用 useSystemThemeChange Hook，它会在后台自动处理系统主题的监听
  //    我们不需要从它那里获取返回值，因为它主要是起副作用
  useSystemThemeChange();

  // 3. 创建一个计算属性，得出最终应该应用到 Monaco 的主题
  const finalMonacoTheme = computed<"light" | "dark">(() => {
    if (overallStyle.value === "light") {
      return "light";
    }
    if (overallStyle.value === "dark") {
      return "dark";
    }
    // 当 overallStyle.value === 'system' 时，依赖 dataTheme.value
    // dataTheme.value 会被 useSystemThemeChange 自动更新
    return dataTheme.value ? "dark" : "light";
  });

  // 4. 监听这个最终计算出的主题
  watch(finalMonacoTheme, newTheme => {
    // 当最终主题变化时，更新已打开的编辑器
    if (textPreviewRef.value) {
      textPreviewRef.value.setTheme(newTheme);
    }
  });

  // 5. 返回这个计算属性，以便在打开编辑器时设置初始主题
  return {
    finalMonacoTheme
  };
}
