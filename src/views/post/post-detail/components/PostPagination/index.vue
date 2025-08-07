<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-07 10:15:33
 * @LastEditTime: 2025-08-07 10:16:23
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
// 这个组件的逻辑会稍微复杂一些
// 你需要根据当前文章ID，去请求上一篇和下一篇文章的信息
// 暂时我们只构建静态骨架
</script>

<template>
  <nav class="pagination-post">
    <div class="prev-post" />
    <div class="next-post" />
  </nav>
</template>

<style lang="scss" scoped>
/* 在这里添加翻页组件的样式 */
.pagination-post {
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
}
</style>
