<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-21 17:48:59
 * @LastEditTime: 2025-09-02 12:32:37
 * @LastEditors: 安知鱼
-->
<template>
  <div :class="{ frontendLayout: true, [mainContentClass]: true }">
    <Header />

    <main class="frontend-main">
      <router-view />
    </main>

    <Footer />

    <SearchModal />

    <RightMenu />
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount, computed } from "vue";
import { useRoute } from "vue-router";
import { useGlobal } from "@pureadmin/utils";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";

import Header from "./components/hearder/index.vue";
import Footer from "./components/footer/index.vue";
import SearchModal from "./components/SearchModal/index.vue";
import RightMenu from "./components/RightMenu/index.vue";

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
  justify-content: space-between;
  min-height: 100vh;
}
</style>
