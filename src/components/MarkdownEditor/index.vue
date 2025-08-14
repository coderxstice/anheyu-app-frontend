<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { MdEditor, type Themes } from "md-editor-v3";
import "md-editor-v3/lib/style.css";
import type { ExposeParam, ToolbarNames } from "md-editor-v3";

const props = defineProps<{
  modelValue: string;
  onUploadImg: (files: File[], callback: (urls: string[]) => void) => void;
}>();

const emit = defineEmits(["update:modelValue", "onSave"]);

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

const editorRef = ref<ExposeParam>();
const theme = ref<Themes>("light");

// 【新增】为组件根元素创建一个模板引用，用于事件监听
const containerRef = ref<HTMLElement | null>(null);

// 【新增】处理 tabs 点击的函数
const handleTabsClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement;

  // 检查点击的是否是一个未激活的 tab 按钮
  if (target.matches(".tabs .nav-tabs .tab:not(.active)")) {
    const tabsContainer = target.closest(".tabs");
    if (!tabsContainer) return;

    // 获取目标内容区域的 ID
    const targetId = target.dataset.href;
    if (!targetId) return;

    // 找到当前激活的按钮和内容区域，并移除 active class
    const currentActiveTab = tabsContainer.querySelector(".tab.active");
    const currentActiveContent = tabsContainer.querySelector(
      ".tab-item-content.active"
    );
    if (currentActiveTab) currentActiveTab.classList.remove("active");
    if (currentActiveContent) currentActiveContent.classList.remove("active");

    // 为被点击的按钮和其对应的内容区域添加 active class
    const newActiveContent = tabsContainer.querySelector(`#${targetId}`);
    target.classList.add("active");
    if (newActiveContent) newActiveContent.classList.add("active");
  }
};

const observer = new MutationObserver(() => {
  const newTheme = document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
  if (theme.value !== newTheme) {
    theme.value = newTheme;
  }
});

onMounted(() => {
  theme.value = document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
  observer.observe(document.documentElement, { attributes: true });

  // 【新增】组件挂载后，在根元素上添加点击事件监听器（事件委托）
  if (containerRef.value) {
    containerRef.value.addEventListener("click", handleTabsClick);
  }
});

onUnmounted(() => {
  observer.disconnect();

  // 【新增】组件卸载前，移除事件监听器，防止内存泄漏
  if (containerRef.value) {
    containerRef.value.removeEventListener("click", handleTabsClick);
  }
});

defineExpose({
  triggerSave: () => editorRef.value?.triggerSave()
});
</script>

<template>
  <div ref="containerRef" class="md-editor-container">
    <MdEditor
      ref="editorRef"
      style="height: 100%; max-height: 100%"
      :model-value="modelValue"
      :theme="theme"
      :toolbars="toolbars"
      :showCodeRowNumber="true"
      @update:model-value="val => emit('update:modelValue', val)"
      @onUploadImg="onUploadImg"
      @onSave="(v, h) => emit('onSave', v, h)"
    />
  </div>
</template>

<style lang="scss">
.md-editor-fullscreen {
  z-index: 2100;
}
.md-editor-container {
  // 您提供的 tabs 样式，保持不变
  .tabs {
    position: relative;
    border: 3px solid var(--anzhiyu-secondbg);
    margin: 1rem 0 !important;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: var(--anzhiyu-shadow-border);
    background: var(--anzhiyu-card-bg);
    padding: 8px;
    & > .nav-tabs {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      margin: 0;
      padding: 16px;
      background: var(--anzhiyu-card-bg);
      & > .tab {
        padding: 8px 18px;
        background: var(--anzhiyu-secondbg);
        color: var(--anzhiyu-fontcolor);
        line-height: 1;
        transition: all 0.4s;
        margin: 4px;
        border: var(--style-border-always);
        border-radius: 8px;
        cursor: pointer; // 添加手型光标
        &.active {
          border: var(--style-border-hover-always);
          background: var(--anzhiyu-background);
          border-radius: 8px;
          cursor: default;
        }
        &:not(.active):hover {
          background: var(--anzhiyu-main);
          color: var(--anzhiyu-white);
          transition: 0.3s;
          border: var(--style-border-hover-always);
        }
      }
    }
    & > .tab-contents .tab-item-content {
      position: relative;
      display: none;
      background: var(--anzhiyu-background);
      border: var(--style-border-always);
      padding: 1.2rem 1.2rem;
      border-radius: 8px;
      &.active {
        display: block;
      }
    }
    & > .tab-to-top {
      padding: 0 16px 10px 0;
      width: 100%;
      text-align: right;
      button {
        background: transparent;
      }
    }
  }
}
</style>
