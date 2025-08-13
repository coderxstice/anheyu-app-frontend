<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-07 10:15:13
 * @LastEditTime: 2025-08-13 16:48:18
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

defineProps({
  content: {
    type: String,
    default: "PostContent"
  }
});

// 创建一个模板引用 (template ref)，以获取组件根元素的 DOM 实例。
const postContentRef = ref<HTMLElement | null>(null);

// 这个函数将处理 article 容器内的所有点击事件。
const handleContentClick = (event: Event) => {
  const target = event.target as HTMLElement;
  // 使用 .closest() 来查找被点击的元素是否是一个 Tab 按钮，或者是按钮的子元素。
  const tabButton = target.closest(".tabs .nav-tabs .tab");

  // 如果点击的不是 Tab 按钮，则不执行任何操作。
  if (!tabButton || !(tabButton instanceof HTMLButtonElement)) {
    return;
  }

  // 阻止按钮的默认行为（如果有的话）
  event.preventDefault();

  // 如果点击的 Tab 已经是激活状态，则不执行任何操作。
  if (tabButton.classList.contains("active")) {
    return;
  }

  // 找到这个 Tab 按钮所属的父级 '.tabs' 容器。
  const tabsContainer = tabButton.closest(".tabs");
  if (!tabsContainer) return;

  // 从按钮的 data-href 属性中获取目标内容面板的 ID。
  const targetId = tabButton.dataset.href;
  if (!targetId) return;

  // 1. 在当前 Tab 分组内，禁用所有的 Tab 按钮和内容面板。
  tabsContainer.querySelectorAll(".nav-tabs .tab").forEach(btn => {
    btn.classList.remove("active");
  });
  tabsContainer.querySelectorAll(".tab-item-content").forEach(content => {
    content.classList.remove("active");
  });

  // 2. 激活被点击的 Tab 按钮。
  tabButton.classList.add("active");

  // 3. 激活对应的 Tab 内容面板。
  const targetContent = tabsContainer.querySelector(`#${targetId}`);
  if (targetContent) {
    targetContent.classList.add("active");
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
  <!-- 将 ref 添加到 article 元素上 -->
  <article
    id="article-container"
    ref="postContentRef"
    class="post-content"
    v-html="content"
  />
</template>

<style lang="scss">
$light-blue: #87cefa;
$theme-link-color: #007bff;

// 文章容器样式
.post-content {
  word-wrap: break-word;
  overflow-wrap: break-word;
  line-height: 1.8;
  .tabs {
    position: relative;
    border: 3px solid var(--anzhiyu-secondbg);
    margin: 1rem 0;
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
      .tab {
        padding: 8px 18px;
        background: var(--anzhiyu-secondbg);
        color: var(--anzhiyu-fontcolor);
        line-height: 1;
        transition: all 0.4s;
        margin: 4px;
        border: var(--style-border-always);
        border-radius: 8px;
        cursor: pointer; // 添加鼠标指针样式，提升用户体验
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
    // [新增] Tab 内容面板的样式
    & > .tab-contents {
      padding: 1rem;
      .tab-item-content {
        display: none; // 默认隐藏所有内容面板
        animation: fadeIn 0.5s; // 可选：添加一个淡入动画

        &.active {
          display: block; // 只显示激活状态的内容面板
        }
      }
    }
  }

  // [新增] 简单的淡入动画
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
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

  // 链接样式
  a {
    color: $theme-link-color;
    &:hover {
      text-decoration: underline;
    }
  }

  // 其他元素样式
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

  // 列表样式
  ol,
  ul {
    p {
      margin: 0 0 8px;
    }
    li {
      margin: 4px 0;
      &::marker {
        color: $light-blue;
        font-weight: 600;
        font-size: 1.05em;
      }
      &:hover::marker {
        color: var(--pseudo-hover);
      }
    }
    // 嵌套列表
    ol,
    ul {
      padding-left: 20px;
    }
  }
}
</style>
