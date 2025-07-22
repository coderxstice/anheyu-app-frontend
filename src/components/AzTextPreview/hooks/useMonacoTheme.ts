import { watch, computed, type Ref } from "vue";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import type AzTextPreview from "@/components/AzTextPreview/index.vue";

/**
 * 一个专门处理 Monaco Editor 主题切换的组合式函数。
 * 它从 useDataThemeChange 获取全局共享的主题状态，
 * 并自动监听变化，将更新同步到传入的 AzTextPreview 组件实例。
 *
 * @param textPreviewRef - 对 AzTextPreview 组件实例的 Ref 引用。
 */
export function useMonacoTheme(
  textPreviewRef: Ref<InstanceType<typeof AzTextPreview> | null>
) {
  // 1. 从全局共享的 useDataThemeChange Hook 中获取状态。
  //    这里的 dataTheme 和 overallStyle 是全局唯一的单例 ref。
  const { dataTheme, overallStyle } = useDataThemeChange();

  // 2. 创建一个计算属性，得出最终应该应用到 Monaco 的主题。
  //    这个计算属性会同时响应 overallStyle 和 dataTheme 的变化。
  const finalMonacoTheme = computed<"light" | "dark">(() => {
    // 明确的手动模式优先级最高
    if (overallStyle.value === "light") {
      return "light";
    }
    if (overallStyle.value === "dark") {
      return "dark";
    }
    // 当 overallStyle.value === 'system' 时，
    // dataTheme 的值已经是 useDataThemeChange 根据系统主题同步后的最终结果。
    // 所以我们直接使用它即可。
    return dataTheme.value ? "dark" : "light";
  });

  // 3. 监听这个最终计算出的主题的变化。
  watch(finalMonacoTheme, newTheme => {
    // 如果预览器实例存在（即窗口是打开的），就更新它的主题。
    if (textPreviewRef.value) {
      textPreviewRef.value.setTheme(newTheme);
    }
  });

  // 4. 返回这个计算属性，以便在打开编辑器时设置【初始主题】。
  return {
    finalMonacoTheme
  };
}
