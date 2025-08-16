<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { MdEditor, type Themes } from "md-editor-v3";
import "md-editor-v3/lib/style.css";
import type { ExposeParam, ToolbarNames } from "md-editor-v3";
import { useSnackbar } from "@/composables/useSnackbar";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

const props = defineProps<{
  modelValue: string;
  onUploadImg: (files: File[], callback: (urls: string[]) => void) => void;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "onSave", markdown: string, html: string): void;
}>();

const { showSnackbar } = useSnackbar();

const siteConfigStore = useSiteConfigStore();

const codeMaxLines = computed(
  () => siteConfigStore.getSiteConfig?.code_block?.code_max_lines || 10
);

const collapsedHeight = computed(() => {
  const lines = codeMaxLines.value > 0 ? codeMaxLines.value : 10;
  const height = lines * 25 + 15;
  return `${height}px`;
});

const sanitize = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, "text/html");

  // 处理代码块
  doc.querySelectorAll("details.md-editor-code").forEach(detailsElement => {
    const summaryElement = detailsElement.querySelector(
      "summary.md-editor-code-head"
    );
    if (!summaryElement) return;
    if (!summaryElement.querySelector(".copy-button")) {
      const langSpan = detailsElement.querySelector(".md-editor-code-lang");
      const language = langSpan ? langSpan.textContent?.trim() : "";
      const newHeaderHtml = `
        <i class="anzhiyufont anzhiyu-icon-angle-down expand"></i>
        <div class="code-lang">${language}</div>
        <i class="anzhiyufont anzhiyu-icon-paste copy-button"></i>`;
      summaryElement.innerHTML = newHeaderHtml;
    }

    if (codeMaxLines.value !== -1) {
      const preElement = detailsElement.querySelector("pre");
      if (preElement) {
        let lineCount = 0;
        const rnWrapper = preElement.querySelector("span[rn-wrapper]");

        if (rnWrapper) {
          lineCount = rnWrapper.children.length;
        } else {
          lineCount = (preElement.textContent?.match(/\n/g) || []).length + 1;
        }

        if (lineCount > codeMaxLines.value) {
          detailsElement.classList.add("is-collapsible", "is-collapsed");
          if (!detailsElement.querySelector(".code-expand-btn")) {
            const expandBtn = document.createElement("div");
            expandBtn.className = "code-expand-btn";
            expandBtn.innerHTML =
              '<i class="anzhiyufont anzhiyu-icon-angle-double-down"></i>';
            detailsElement.appendChild(expandBtn);
          }
        }
      }
    }
  });

  doc.querySelectorAll("table").forEach(table => {
    if (table.parentElement?.classList.contains("table-container")) {
      return;
    }
    const container = document.createElement("div");
    container.className = "table-container";
    if (table.parentNode) {
      table.parentNode.insertBefore(container, table);
      container.appendChild(table);
    }
  });

  return doc.body.innerHTML;
};

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

  const expandCodeButton = target.closest(".code-expand-btn");
  if (expandCodeButton) {
    const container = expandCodeButton.closest<HTMLDetailsElement>(
      "details.md-editor-code"
    );
    if (container) {
      if (container.classList.contains("is-collapsed")) {
        container.open = true;
      }
      container.classList.toggle("is-collapsed");
      expandCodeButton.classList.toggle(
        "is-expanded",
        !container.classList.contains("is-collapsed")
      );
    }
    return;
  }

  const header = target.closest("summary.md-editor-code-head");
  if (header) {
    const details = header.closest<HTMLDetailsElement>(
      "details.md-editor-code"
    );
    if (details) {
      event.preventDefault();
      details.open = !details.open;
    }
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
      :auto-fold-threshold="99999999"
      :showToolbarName="true"
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
.md-editor-container {
  height: 100%;
  .md-editor-code {
    border: var(--style-border-always);
    border-radius: 10px;
    overflow: hidden;
    @keyframes code-expand-key {
      0% {
        opacity: 0.6;
        -ms-filter: "progid:DXImageTransform.Microsoft.Alpha(Opacity=60)";
        filter: alpha(opacity=60);
      }
      50% {
        opacity: 0.1;
        -ms-filter: "progid:DXImageTransform.Microsoft.Alpha(Opacity=10)";
        filter: alpha(opacity=10);
      }
      100% {
        opacity: 0.6;
        -ms-filter: "progid:DXImageTransform.Microsoft.Alpha(Opacity=60)";
        filter: alpha(opacity=60);
      }
    }
    &.is-collapsed {
      & > pre {
        overflow: hidden;
        height: v-bind(collapsedHeight);
      }
      .code-expand-btn i {
        animation: 1.2s ease 0s infinite normal none running code-expand-key;
      }
    }
    .code-expand-btn {
      bottom: 0;
      z-index: 10;
      width: 100%;
      transition: all 0.3s;
      font-size: 20px;
      background: var(--anzhiyu-secondbg);
      text-align: center;
      font-size: var(--global-font-size);
      cursor: pointer;
      transform: translateZ(0);
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 32px;
      font-size: 16px;
      i {
        color: var(--anzhiyu-fontcolor);
        transition: transform 0.3s ease;
      }
      &:hover {
        background: var(--anzhiyu-main);
        i {
          color: var(--anzhiyu-white);
        }
        transition: all 0.3s;
      }
      &.is-expanded i {
        transform: rotate(180deg);
      }
    }
    &[open] {
      .md-editor-code-head {
        border-bottom: var(--style-border-always);
        .expand {
          transform: translate(0, -47%) rotate(0deg) !important;
        }
      }
      pre {
        max-height: 1000px;
        transition: max-height 0.35s ease-in-out;
      }
    }
    pre {
      max-height: 0;
      transition: max-height 0.35s ease-in-out;
      overflow: hidden;
      margin: 0;
      border-radius: 0;
    }
  }

  .md-editor-preview {
    .table-container {
      border-radius: 8px;
      overflow: hidden;
      border: var(--style-border-always);
      overflow-x: auto;
      margin: 1rem 0;
      table {
        display: table;
        width: 100%;
        border-spacing: 0;
        border-collapse: collapse;
        empty-cells: show;
        margin: 0;
      }
      thead {
        background: var(--anzhiyu-secondbg);
      }
      td,
      th {
        padding: 0.3rem 0.6rem;
        vertical-align: middle;
        border: var(--style-border-always);
      }
      tr > *:first-child {
        border-left: none;
      }
      tr > *:last-child {
        border-right: none;
      }
      tbody tr:last-child > * {
        border-bottom: none;
      }
      thead tr:first-child > * {
        border-top: none;
      }
    }
    input[type="checkbox"] {
      -webkit-appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      -o-appearance: none;
      -ms-appearance: none;
      appearance: none;
      position: relative;
      height: 16px;
      width: 16px;
      transition: all 0.15s ease-out 0s;
      cursor: pointer;
      display: inline-block;
      outline: 0;
      border-radius: 2px;
      flex-shrink: 0;
      margin-right: 8px;
      border: 2px solid var(--anzhiyu-theme);
      pointer-events: none;
      box-sizing: border-box;
      padding: 0;

      &:checked {
        background: var(--anzhiyu-theme);
      }

      &:before,
      &:after {
        position: absolute;
        content: "";
        background: #fff;
      }

      &:checked:before {
        left: 0;
        top: 7px;
        width: 6px;
        height: 2px;
      }
      &:checked:after {
        right: 3px;
        bottom: 1px;
        width: 2px;
        height: 10px;
      }

      &:before {
        left: 1px;
        top: 5px;
        width: 0;
        height: 2px;
        transform: rotate(45deg);
        transition: all 0.2s ease-in;
      }
      &:after {
        right: 7px;
        bottom: 3px;
        width: 2px;
        height: 0;
        transition-delay: 0.25s;
        transform: rotate(40deg);
      }
    }
    a {
      font-weight: 500;
      border-bottom: solid 2px var(--anzhiyu-lighttext) !important;
      color: var(--anzhiyu-fontcolor);
      padding: 0 0.2rem !important;
      text-decoration: none;
      font-family: inherit;
      transition: all 0.2s ease 0s !important;
      line-height: 1.25rem;
      &:hover {
        color: var(--anzhiyu-white);
        background: var(--anzhiyu-main);
        box-shadow: var(--anzhiyu-shadow-lightblack);
        border-radius: 0.25rem !important;
        text-decoration: none;
      }
    }
    blockquote {
      border: var(--style-border-always);
      background-color: var(--anzhiyu-secondbg);
      color: var(--anzhiyu-secondtext);
      border-radius: 8px;
      margin: 1rem 0;
      padding: 0.5rem 0.8rem;
    }
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
        transform: translate(0, -47%) rotate(-90deg);
        cursor: pointer;
        transition: transform 0.3s;
      }
      .code-lang {
        left: 2.5rem;
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
