<template>
  <el-card shadow="never">
    <el-tabs v-model="activeName" class="demo-tabs" @tab-click="handleClick">
      <el-tab-pane label="站点信息" name="siteConfig">站点信息</el-tab-pane>
      <el-tab-pane label="用户会话" name="userSession">用户会话</el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import type { TabsPaneContext } from "element-plus";

const activeName = ref("siteConfig");

const handleClick = (tab: TabsPaneContext, event: Event) => {
  console.log(tab, event);
};
</script>

<style></style>
