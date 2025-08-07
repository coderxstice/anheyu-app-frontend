<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-07-25 18:52:39
 * @LastEditTime: 2025-08-07 13:32:29
 * @LastEditors: 安知鱼
-->
<template>
  <div class="frontend-layout">
    <Header />

    <main class="frontend-main" :class="mainContentClass">
      <router-view />
    </main>

    <Footer />
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount, computed } from "vue";
import { useRoute } from "vue-router";
import { useGlobal } from "@pureadmin/utils";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";

import Header from "./components/hearder/index.vue";
import Footer from "./components/footer/index.vue";

const { $storage } = useGlobal<GlobalPropertiesApi>();
const route = useRoute();

const mainContentClass = computed(() => {
  return route.name === "PostDetail" ? "is-post-detail" : "";
});

onBeforeMount(() => {
  useDataThemeChange().dataThemeChange($storage.layout?.overallStyle);
});
</script>

<style scoped lang="scss">
.frontend-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  justify-content: space-between;
}

.frontend-main.is-post-detail {
  transform: translateY(-60px);
}
</style>
