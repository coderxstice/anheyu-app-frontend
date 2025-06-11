<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-04-09 12:23:48
 * @LastEditTime: 2025-06-11 13:07:53
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import Album from "./album/index.vue";
import Header from "./header/index.vue";
defineOptions({
  name: "AlbumHome"
});
</script>

<template>
  <div>
    <Header />
    <Album />
  </div>
</template>
