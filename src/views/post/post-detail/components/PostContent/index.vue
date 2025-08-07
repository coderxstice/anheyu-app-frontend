<script setup lang="ts">
// 这里可以引入 markdown-it 或其他解析库来处理 markdown
// 或者，如果 API 直接返回 HTML，就直接使用 v-html

defineProps({
  content: {
    type: String,
    default: ""
  }
});

// 示例：这里假设 content prop 是已经解析好的 HTML
</script>

<template>
  <article id="article-container" class="post-content" v-html="content" />
</template>

<style lang="scss">
/* 注意：这里不使用 scoped，以便能影响 v-html 内部的元素。
  或者使用 :deep() 选择器。
  在这里定义文章内容的样式，如 h1-h6, p, a, code, blockquote 等标签的样式。
*/
.post-content {
  line-height: 1.8;

  p {
    margin-bottom: 1.25rem;
  }

  h2 {
    font-size: 1.5rem;
    margin: 2rem 0 1rem;
    border-left: 4px solid var(--anzhiyu-main);
    padding-left: 0.5rem;
  }
}
</style>
