/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-07-21 19:00:43
 * @LastEditTime: 2025-07-22 16:30:57
 * @LastEditors: 安知鱼
 */
import { computed } from "vue";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";

export function useMonacoTheme() {
  const { dataTheme, overallStyle } = useDataThemeChange();

  const monacoTheme = computed<"light" | "dark">(() => {
    if (overallStyle.value === "light") return "light";
    if (overallStyle.value === "dark") return "dark";
    return dataTheme.value ? "dark" : "light";
  });

  return { monacoTheme };
}
