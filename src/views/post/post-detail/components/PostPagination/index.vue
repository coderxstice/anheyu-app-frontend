<script setup lang="ts">
import { ref, onMounted, onUnmounted, type PropType } from "vue";

defineOptions({
  name: "PostPagination"
});

interface ArticleLink {
  id: string;
  title: string;
  abbrlink: string;
}

defineProps({
  prevArticle: {
    type: Object as PropType<ArticleLink | null>,
    default: null
  },
  nextArticle: {
    type: Object as PropType<ArticleLink | null>,
    default: null
  }
});

// 1. 添加一个响应式变量来控制 .show-pagination-post 类的添加
const isCommentVisible = ref(false);

// 声明一个变量来持有 IntersectionObserver 实例
let observer: IntersectionObserver | null = null;

// 2. 在组件挂载后开始监听
onMounted(() => {
  // 找到目标元素
  const targetElement = document.getElementById("post-comment");

  if (!targetElement) {
    // 如果页面上没有评论元素，直接不显示分页组件，或根据你的需要处理
    return;
  }

  // 创建 IntersectionObserver
  observer = new IntersectionObserver(
    entries => {
      // isIntersecting 是一个布尔值，表示目标元素是否可见
      if (entries[0].isIntersecting) {
        isCommentVisible.value = true;
      } else {
        isCommentVisible.value = false;
      }
    },
    {
      // root: null, // 基于浏览器视口
      // threshold: 0.1, // 目标元素可见度达到10%时触发
    }
  );

  // 开始监听目标元素
  observer.observe(targetElement);
});

// 3. 在组件卸载前停止监听，清理资源
onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});
</script>

<template>
  <nav
    v-if="prevArticle || nextArticle"
    id="pagination"
    :class="{
      'pagination-post': true,
      'show-pagination-post': isCommentVisible
    }"
  >
    <router-link
      v-if="nextArticle"
      class="pagination-item"
      :to="`/posts/${nextArticle.abbrlink || nextArticle.id}`"
    >
      <div class="pagination-info">
        <div class="label">下一篇</div>
        <div class="info-title">{{ nextArticle.title }}</div>
      </div>
    </router-link>

    <router-link
      v-else-if="prevArticle"
      class="pagination-item"
      :to="`/posts/${prevArticle.abbrlink || prevArticle.id}`"
    >
      <div class="pagination-info">
        <div class="label">上一篇</div>
        <div class="info-title">{{ prevArticle.title }}</div>
      </div>
    </router-link>
  </nav>
</template>

<style lang="scss" scoped>
.pagination-post {
  position: fixed;
  width: 300px;
  bottom: -100px;
  right: 20px;
  z-index: 1000;
  height: fit-content;
  transition: cubic-bezier(0.42, 0, 0.3, 1.11) 0.3s;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  opacity: 0;
  z-index: 1002;
  background: 0 0;
  border: var(--style-border);

  &.show-pagination-post {
    bottom: 20px;
    opacity: 1;
  }
}

.pagination-item {
  background: var(--anzhiyu-maskbgdeep);
  backdrop-filter: blur(5px);
  transform: translateZ(0);
  border: none;
  height: fit-content;
  padding: 0.5rem 0;
  display: flex;
  align-items: flex-start;
  text-decoration: none;

  &:hover {
    background: var(--anzhiyu-main);
    .pagination-info .label,
    .pagination-info .info-title {
      color: var(--anzhiyu-white);
    }
  }
}

.pagination-info {
  text-align: left;
  position: relative;
  padding: 0.625rem 1.25rem;
  transform: none;
  display: flex;
  top: 0;
  flex-direction: column;
  justify-content: center;
  margin: auto;
  height: 100%;
  width: 100%;
  .label {
    color: var(--anzhiyu-fontcolor);
    font-weight: 700;
    font-size: 12px;
    margin-bottom: 0.625rem;
    border-bottom: var(--style-border);
    line-height: 1;
    padding-bottom: 0.625rem;
  }
}

.info-title {
  color: var(--anzhiyu-fontcolor);
  line-clamp: 2;
  -webkit-line-clamp: 2;
  white-space: normal;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.875rem;
  font-weight: 400;
  margin-bottom: 0;
}
</style>
