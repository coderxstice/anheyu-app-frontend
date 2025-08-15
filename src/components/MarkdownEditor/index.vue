<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { MdEditor, type Themes } from "md-editor-v3";
import "md-editor-v3/lib/style.css";
import type { ExposeParam, ToolbarNames } from "md-editor-v3";
import { useSnackbar } from "@/composables/useSnackbar";

const props = defineProps<{
  modelValue: string;
  onUploadImg: (files: File[], callback: (urls: string[]) => void) => void;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "onSave", markdown: string, html: string): void;
}>();

const { showSnackbar } = useSnackbar();

const sanitize = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("details.md-editor-code").forEach(detailsElement => {
    const summaryElement = detailsElement.querySelector(
      "summary.md-editor-code-head"
    );
    if (!summaryElement) return;

    if (summaryElement.querySelector(".copy-button")) {
      return;
    }

    // 2. 如果是原始结构，才执行替换逻辑
    const langSpan = detailsElement.querySelector(".md-editor-code-lang");
    const language = langSpan ? langSpan.textContent?.trim() : "";
    const newHeaderHtml = `
      <i class="anzhiyufont anzhiyu-icon-angle-down expand"></i>
      <div class="code-lang">${language}</div>
      <i class="anzhiyufont anzhiyu-icon-paste copy-button"></i>`;
    summaryElement.innerHTML = newHeaderHtml;
  });
  return doc.body.innerHTML;
};

// handleSave 函数现在是正确的，无需改动
const handleSave = async (markdown: string, htmlPromise: Promise<string>) => {
  const rawHtml = await htmlPromise;
  const sanitizedHtml = sanitize(rawHtml);
  emit("onSave", markdown, sanitizedHtml);
};

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
const containerRef = ref<HTMLElement | null>(null);

const handlePreviewClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (target.matches(".tabs .nav-tabs .tab:not(.active)")) {
    const tabsContainer = target.closest(".tabs");
    if (!tabsContainer) return;
    const targetId = target.dataset.href;
    if (!targetId) return;
    const currentActiveTab = tabsContainer.querySelector(".tab.active");
    const currentActiveContent = tabsContainer.querySelector(
      ".tab-item-content.active"
    );
    if (currentActiveTab) currentActiveTab.classList.remove("active");
    if (currentActiveContent) currentActiveContent.classList.remove("active");
    const newActiveContent = tabsContainer.querySelector(`#${targetId}`);
    target.classList.add("active");
    if (newActiveContent) newActiveContent.classList.add("active");
    return;
  }
  const copyButton = target.closest(".copy-button");
  if (copyButton) {
    event.preventDefault();
    event.stopPropagation();
    const codeContainer = copyButton.closest("details.md-editor-code");
    const codeElement = codeContainer?.querySelector("pre code");
    if (codeElement) {
      navigator.clipboard
        .writeText(codeElement.textContent || "")
        .then(() => {
          showSnackbar("复制成功，复制和转载请标注本文地址");
        })
        .catch(() => {
          showSnackbar("复制失败，请手动复制");
        });
    }
    return;
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
  if (containerRef.value) {
    containerRef.value.addEventListener("click", handlePreviewClick);
  }
});

onUnmounted(() => {
  observer.disconnect();
  if (containerRef.value) {
    containerRef.value.removeEventListener("click", handlePreviewClick);
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
      :sanitize="sanitize"
      @update:model-value="val => emit('update:modelValue', val)"
      @onUploadImg="onUploadImg"
      @onSave="handleSave"
    />
  </div>
</template>

<style lang="scss">
.md-editor-fullscreen {
  z-index: 2100;
}
.md-editor-preview-wrapper {
  overflow: hidden;
}
.md-editor-container {
  .md-editor-code {
    border: var(--style-border-always);
    border-radius: 10px;
    overflow: hidden;
    &[open] {
      .md-editor-code-head {
        border-bottom: var(--style-border-always);
        .expand {
          transform: translate(0, -47%) rotate(0deg) !important;
        }
      }
      pre {
        max-height: 1000px; /* 动画：展开时的高度 */
        transition: max-height 0.35s ease-in-out;
      }
    }
    pre {
      max-height: 0; /* 动画：默认折叠 */
      transition: max-height 0.35s ease-in-out;
      overflow: hidden;
      margin: 0;
      border-radius: 0;
    }
  }

  .md-editor-preview {
    .md-editor-code pre code {
      background: var(--anzhiyu-card-bg);
      color: var(--hlnumber-color);
      padding: 0;
    }
    span[rn-wrapper] {
      background: var(--anzhiyu-secondbg);
      border-right: var(--style-border-always);
      top: 0px;
      height: 100%;
      span {
        transform: translateY(10px);
      }
      &::before {
        padding-right: 1rem;
        color: var(--hlnumber-color);
      }
    }
    .md-editor-code-block {
      padding: 10px 0px;
    }
    .md-editor-code-head {
      display: flex;
      align-items: center;
      overflow: hidden;
      min-height: 24px;
      height: 2.15em;
      background: var(--hltools-bg);
      color: var(--hltools-color);
      font-size: 1rem;

      .expand {
        position: absolute;
        padding: 0.57rem 0.7rem;
        top: 50%;
        transform: translate(0, -47%) rotate(-90deg); /* 动画：默认折叠状态箭头旋转-90度 */
        cursor: pointer;
        transition: transform 0.3s;
      }
      .code-lang {
        left: 2.5rem; // 为箭头留出空间
        position: absolute;
        text-transform: uppercase;
        font-weight: 700;
        font-size: 1.15em;
        user-select: none;
      }
      .copy-button {
        position: absolute;
        right: 14px;
        cursor: pointer;
        transition: color 0.2s;
      }
    }
  }
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
        cursor: pointer;
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
