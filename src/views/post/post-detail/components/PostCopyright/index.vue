<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-07 10:15:19
 * @LastEditTime: 2025-08-08 17:01:33
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import type { Article } from "@/api/post/type";
import { type PropType } from "vue";

defineProps({
  article: {
    type: Object as PropType<Article>,
    required: true
  }
});
</script>

<template>
  <div class="post-copyright">
    <div class="author-info" />
    <div class="copyright-notice" />
    <div class="tag-list" />
  </div>
</template>

<style lang="scss" scoped>
.post-copyright {
  margin-top: 2rem;
  padding: 1rem;
  border: 1px solid var(--anzhiyu-gray-100);
  border-radius: 8px;
}
</style>
