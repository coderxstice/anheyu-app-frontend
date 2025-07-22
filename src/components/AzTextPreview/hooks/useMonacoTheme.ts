/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-07-21 19:00:43
 * @LastEditTime: 2025-07-21 19:00:48
 * @LastEditors: 安知鱼
 */
import { computed, watch, type Ref } from "vue";
import { useAppStore } from "@/store/modules/app";
import { storeToRefs } from "pinia";
import type AzTextPreview from "@/components/AzTextPreview/index.vue";

/**
 * 一个专门处理 Monaco Editor 主题切换的组合式函数。
 * @param textPreviewRef 对 AzTextPreview 组件实例的引用。
 */
export function useMonacoTheme(
  textPreviewRef: Ref<InstanceType<typeof AzTextPreview> | null>
) {
  // 1. 从全局 store 获取主题状态
  const appStore = useAppStore();
  const { theme } = storeToRefs(appStore); // 使用 storeToRefs 保持响应性

  // 2. 创建一个计算属性，将应用主题映射到 Monaco 主题
  const monacoTheme = computed<"vs" | "vs-dark">(() => {
    return theme.value === "light" ? "vs" : "vs-dark";
  });

  // 3. 监听全局主题变化，并动态更新已打开的编辑器
  watch(theme, newTheme => {
    // 如果预览器实例存在（即窗口是打开的）
    if (textPreviewRef.value) {
      // 调用 AzTextPreview 组件暴露的 setTheme 方法
      textPreviewRef.value.setTheme(newTheme);
    }
  });

  // 返回计算出的 Monaco 主题，供初始化时使用
  return {
    monacoTheme
  };
}
