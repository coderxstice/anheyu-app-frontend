<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-07-26 15:01:42
 * @LastEditTime: 2025-07-26 15:45:08
 * @LastEditors: 安知鱼
-->
<template>
  <el-tabs v-model="activeSubTab">
    <el-tab-pane label="首页配置" name="homePage">
      <el-form :model="model" label-position="top" class="setting-form">
        <!-- 直接将 model.home 传递给下级组件 -->
        <HomePageForm v-model="model.home" />
      </el-form>
    </el-tab-pane>
    <el-tab-pane label="文章页配置" name="articlePage">
      <p>文章页相关配置待开发...</p>
    </el-tab-pane>
  </el-tabs>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { FrontDeskSettings } from "../type";
import HomePageForm from "./frontDesk/HomePageForm.vue";

const activeSubTab = ref("homePage");

// 使用 defineModel 接收来自父组件(index.vue)的 v-model
const model = defineModel<FrontDeskSettings>({ required: true });
</script>

<style scoped>
.setting-form {
  max-width: 800px;
  padding-top: 16px;
}
</style>
