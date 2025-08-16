<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useSnackbar } from "@/composables/useSnackbar";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import "katex/dist/katex.min.css";

defineProps({
  content: {
    type: String,
    default: "PostContent"
  }
});

const { showSnackbar } = useSnackbar();

const siteConfigStore = useSiteConfigStore();

const codeMaxLines = computed(
  () => siteConfigStore.getSiteConfig?.code_block?.code_max_lines || 10
);

const postContentRef = ref<HTMLElement | null>(null);

const collapsedHeight = computed(() => {
  const lines = codeMaxLines.value > 0 ? codeMaxLines.value : 10;
  const height = lines * 25 + 50;
  return `${height}px`;
});

const handleContentClick = (event: Event) => {
  const target = event.target as HTMLElement;

  const tabButton = target.closest(".tabs .nav-tabs .tab");
  if (tabButton && tabButton instanceof HTMLButtonElement) {
    event.preventDefault();
    if (tabButton.classList.contains("active")) {
      return;
    }
    const tabsContainer = tabButton.closest(".tabs");
    if (!tabsContainer) return;
    const targetId = tabButton.dataset.href;
    if (!targetId) return;

    tabsContainer.querySelectorAll(".nav-tabs .tab").forEach(btn => {
      btn.classList.remove("active");
    });
    tabsContainer.querySelectorAll(".tab-item-content").forEach(content => {
      content.classList.remove("active");
    });

    tabButton.classList.add("active");
    const targetContent = tabsContainer.querySelector(`#${targetId}`);
    if (targetContent) {
      targetContent.classList.add("active");
    }
    return;
  }

  const scrollToTopButton = target.closest(".tab-to-top button");
  if (scrollToTopButton) {
    event.preventDefault();
    // 找到按钮所属的父级 '.tabs' 容器
    const tabsContainer = scrollToTopButton.closest(".tabs");
    if (tabsContainer) {
      // 将该容器的顶部平滑滚动到视口的顶部
      tabsContainer.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
    return;
  }

  const copyButton = target.closest(".copy-button");
  if (copyButton) {
    event.preventDefault();
    event.stopPropagation();
    const codeContainer = copyButton.closest(".md-editor-code");
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

  // 代码块顶部的整个的折叠与展开
  const expandButton = target.closest(".expand");
  if (expandButton) {
    const detailsElement = expandButton.closest(".md-editor-code");
    event.preventDefault();
    if (detailsElement) {
      // 手动切换 open 属性
      detailsElement.hasAttribute("open")
        ? detailsElement.removeAttribute("open")
        : detailsElement.setAttribute("open", "");
    }
    return;
  }

  // 代码块底部的部分展开与部分折叠
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
};

// 在组件挂载到 DOM 后，添加事件监听器。
onMounted(() => {
  if (postContentRef.value) {
    postContentRef.value.addEventListener("click", handleContentClick);
  }
});

// 在组件卸载时清理事件监听器，防止内存泄漏。
onUnmounted(() => {
  if (postContentRef.value) {
    postContentRef.value.removeEventListener("click", handleContentClick);
  }
});
</script>

<template>
  <article
    id="article-container"
    ref="postContentRef"
    class="post-content"
    v-html="content"
  />
</template>

<style lang="scss">
@use "./editor-code.scss";

.post-content {
  word-wrap: break-word;
  overflow-wrap: break-word;
  line-height: 1.8;

  .md-editor-code {
    color: var(--md-theme-code-block-color);
    font-size: 12px;
    line-height: 1;
    margin: 20px 0;
    position: relative;
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
          transform: translate(0, -47%) rotate(0deg);
        }
      }
      pre {
        max-height: 1000px;
      }
    }
    pre {
      max-height: 0;
      transition: max-height 0.35s ease-in-out;
      overflow: hidden;
      position: relative;
      margin: 0;
      line-height: 1.6;
      code {
        border-radius: 0px;
        background: var(--anzhiyu-card-bg);
        color: var(--hlnumber-color);
        position: relative;
        display: block;
        line-height: 1.6;
        overflow: auto;
        font-family: source-code-pro, Menlo, Monaco, Consolas, "Courier New",
          monospace;
        font-size: 16px;
        padding-left: 3.6rem;
        margin: 0;
      }
    }

    .md-editor-code-block {
      display: inline-block;
      width: 100%;
      overflow: auto;
      vertical-align: bottom;
      color: #a9b7c6;
      padding: 10px 0px;
    }
    span[rn-wrapper] {
      background: var(--anzhiyu-secondbg);
      border-right: var(--style-border-always);
      top: 0px;
      height: 100%;
      user-select: none;
      counter-reset: linenumber;
      font-size: 100%;
      left: 0;
      width: 3em;
      letter-spacing: -1px;
      position: absolute;
      pointer-events: none;
      & > span {
        display: block;
        pointer-events: none;
        counter-increment: linenumber;
        &::before {
          color: #999;
          display: block;
          padding-right: 0.5em;
          text-align: right;
          content: counter(linenumber);
        }
      }
      span {
        transform: translateY(10px);
      }
      &::before {
        padding-right: 1rem;
        color: var(--hlnumber-color);
      }
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
      margin-bottom: 0;
      -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
      list-style: none;
      position: sticky;
      top: 0;
      width: 100%;
      cursor: pointer; // 让整个头部都可以点击

      .expand {
        position: absolute;
        padding: 0.57rem 0.7rem;
        top: 50%;
        transform: translate(0, -47%) rotate(-90deg); /* 动画：默认折叠状态箭头旋转 */
        /* 移除 cursor，因为父元素已经设置 */
        transition: transform 0.3s;
      }
      .code-lang {
        left: 2.5rem; /* 为箭头留出空间 */
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
    margin: 1rem 0;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: var(--anzhiyu-shadow-border);
    background: var(--anzhiyu-card-bg);
    padding: 8px;
    & > .tab-to-top {
      padding: 0 16px 10px 0;
      width: 100%;
      text-align: right;
      button {
        background: transparent;
      }
    }
    & > .nav-tabs {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      margin: 0;
      padding: 16px;
      background: var(--anzhiyu-card-bg);
      .tab {
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
    & > .tab-contents {
      padding: 1rem;
      .tab-item-content {
        display: none;
        position: relative;
        animation: fadeIn 0.5s;
        background: var(--anzhiyu-background);
        border: var(--style-border-always);
        padding: 1.2rem 1.2rem;
        border-radius: 8px;

        &.active {
          display: block;
        }
      }
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .md-editor-mermaid {
    overflow: hidden;
    line-height: normal;
    p {
      font-size: 16px;
    }
    &[data-processed] {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    &[data-processed] .md-editor-mermaid-action {
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 1;
      opacity: 0;
      transition: opacity 0.3s;
      cursor: pointer;
    }
    &[data-processed] {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      svg {
        transform-origin: top left;
      }
      &:hover .md-editor-mermaid-action {
        opacity: 1;
      }
      .md-editor-mermaid-action svg {
        width: 20px;
        height: 20px;
      }
    }
    &[data-grab] {
      cursor: grab;
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

  .table-container {
    border-radius: 8px;
    overflow: hidden;
    border: var(--style-border-always);
    overflow-x: scroll;
    margin: 1rem 0;
    table {
      display: table;
      width: 100%;
      border-spacing: 0;
      border-collapse: collapse;
      empty-cells: show;
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

  code {
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    margin: 0 4px;
    line-height: 2;
    box-shadow: var(--anzhiyu-shadow-border);
    padding: 2px 4px;
    background: var(--anzhiyu-code-stress);
    color: #fff;
  }

  blockquote {
    border: var(--style-border-always);
    background-color: var(--anzhiyu-secondbg);
    color: var(--anzhiyu-secondtext);
    border-radius: 8px;
    margin: 1rem 0;
    padding: 0.5rem 0.8rem;
  }

  p {
    font-size: 17px;
    line-height: 1.7;
    font-weight: 400;
    margin: 24px 0;
    text-align: left;
    letter-spacing: 0.6px;
    color: var(--anzhiyu-fontcolor);
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    position: relative;
    margin: 20px 0 14px;
    color: var(--text-highlight-color);
    font-weight: 700;
  }

  > :last-child {
    margin-bottom: 0 !important;
  }

  img {
    display: block;
    margin: 0 auto 20px;
    max-width: 100%;
    transition: 0.3s;
    border-radius: 8px;
  }

  iframe {
    margin: 0 0 20px;
    border-radius: 12px;
  }

  kbd {
    margin: 0 3px;
    padding: 3px 5px;
    border: 1px solid #b4b4b4;
    border-radius: 3px;
    background-color: #f8f8f8;
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.25),
      0 2px 1px 0 rgba(255, 255, 255, 0.6) inset;
    color: #34495e;
    white-space: nowrap;
    font-weight: 600;
    font-size: 0.9em;
    font-family: Monaco, "Ubuntu Mono", monospace;
    line-height: 1em;
  }

  ol,
  ul {
    p {
      margin: 0 0 8px;
    }
    li {
      margin: 4px 0;
      &::marker {
        font-weight: 600;
        font-size: 1.05em;
      }
      &:hover::marker {
        color: var(--pseudo-hover);
      }
    }
    ol,
    ul {
      padding-left: 20px;
    }
  }
}
</style>
