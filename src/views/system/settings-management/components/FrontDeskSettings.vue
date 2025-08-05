<template>
  <el-tabs v-model="activeSubTab">
    <el-tab-pane label="首页配置" name="homePage">
      <el-form :model="model" label-position="top" class="setting-form">
        <HomePageForm v-model="model.home" />
      </el-form>
    </el-tab-pane>
    <el-tab-pane label="侧边栏配置" name="sidebarPage">
      <el-form :model="model" label-position="top" class="setting-form">
        <SidebarPageForm v-model="model.sidebar" />
      </el-form>
    </el-tab-pane>
  </el-tabs>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { FrontDeskSettings } from "../type";
import HomePageForm from "./frontDesk/HomePageForm/index.vue";
import SidebarPageForm from "./frontDesk/SidebarPageForm/index.vue";

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
