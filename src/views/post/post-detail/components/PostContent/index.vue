<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-07 10:15:13
 * @LastEditTime: 2025-08-08 17:20:26
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
defineProps({
  content: {
    type: String,
    default: "PostContent"
  }
});
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
