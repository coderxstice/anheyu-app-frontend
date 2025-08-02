<!--
 * @Description: 前台主布局
 * @Author: 安知鱼
 * @Date: 2025-07-25 18:52:39
 * @LastEditTime: 2025-08-02 11:24:07
 * @LastEditors: 安知鱼
-->
<template>
  <div class="frontend-layout">
    <!-- 顶部导航组件 -->
    <Header />

    <!-- 主内容区域 -->
    <main class="frontend-main">
      <!-- 路由视图，用于显示具体页面 -->
      <router-view />
    </main>

    <!-- 页脚组件 -->
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount } from "vue";
import { useGlobal } from "@pureadmin/utils";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";

import Header from "./components/hearder/index.vue";
import Footer from "./components/footer/index.vue";

const { $storage } = useGlobal<GlobalPropertiesApi>();
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
</style>
