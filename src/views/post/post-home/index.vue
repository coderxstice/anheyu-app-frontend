<!--
 * @Description: 前台文章首页
 * @Author: 安知鱼
 * @Date: 2025-07-25 18:13:11
 * @LastEditTime: 2025-08-02 13:33:34
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import HomeTop from "./components/HomeTop/index.vue";

defineOptions({
  name: "PostHome"
});
</script>

<template>
  <div class="post-home-container">
    <div class="post-home-top-container">
      <HomeTop />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.post-home-top-container {
  margin: 0 auto 0;
  padding: 0 1.5rem 0;
  max-width: 1400px;
  width: 100%;
  animation: slide-in 0.6s 0.1s backwards;
  overflow: hidden;
  user-select: none;
}
</style>
