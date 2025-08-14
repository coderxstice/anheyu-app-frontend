<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-14 10:06:55
 * @LastEditTime: 2025-08-14 12:58:39
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, readonly } from "vue";
import { MdEditor, type Themes } from "md-editor-v3";
import "md-editor-v3/lib/style.css";
import type { ExposeParam, ToolbarNames } from "md-editor-v3";

// 1. 定义 props，接收 v-model 的值和图片上传函数
const props = defineProps<{
  modelValue: string;
  onUploadImg: (files: File[], callback: (urls: string[]) => void) => void;
}>();

const emit = defineEmits(["update:modelValue"]);

// 添加所有工具栏按钮
const toolbars: ToolbarNames[] = [
  "bold",
  "underline",
  "italic",
  "strikeThrough",
  "-",
  "title",
  "sub",
  "sup",
  "quote",
  "unorderedList",
  "orderedList",
  "task",
  "-",
  "codeRow",
  "code",
  "link",
  "image",
  "table",
  "mermaid",
  "katex",
  "revoke",
  "next",
  "save",
  "=",
  "pageFullscreen",
  "fullscreen",
  "preview",
  "previewOnly",
  "htmlPreview",
  "catalog"
];

// 2. 创建一个响应式的 ref 来追踪并应用亮/暗主题
const theme = ref<Themes>("light");

const editorRef = ref<ExposeParam>();

// 3. 监听应用根元素的 class 变化，自动切换编辑器主题
const observer = new MutationObserver(() => {
  const newTheme = document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
  if (theme.value !== newTheme) {
    theme.value = newTheme;
  }
});

onMounted(() => {
  // 初始化主题
  theme.value = document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
  observer.observe(document.documentElement, { attributes: true });
});

onUnmounted(() => {
  observer.disconnect();
});

defineExpose({
  triggerSave: () => editorRef.value?.triggerSave()
});
</script>

<template>
  <MdEditor
    ref="editorRef"
    style="height: 100%; max-height: 100%"
    :model-value="modelValue"
    :theme="theme"
    :toolbars="toolbars"
    :showCodeRowNumber="true"
    @update:model-value="val => emit('update:modelValue', val)"
    @onUploadImg="onUploadImg"
  />
</template>

<style lang="scss">
/* md-editor-v3 的 z-index 可能需要调整，以确保在抽屉等组件之上 */
.md-editor-fullscreen {
  z-index: 2100;
}
</style>
