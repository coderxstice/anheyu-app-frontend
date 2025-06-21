<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-15 11:31:00
 * @LastEditTime: 2025-06-21 13:37:29
 * @LastEditors: 安知鱼
-->
<template>
  <el-config-provider :locale="currentLocale">
    <router-view />
    <ReDialog />
    <ReloadPWA />
  </el-config-provider>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ElConfigProvider } from "element-plus";
import { ReDialog } from "@/components/ReDialog";
import ReloadPWA from "@/components/ReloadPWA/ReloadPWA.vue";
import zhCn from "element-plus/es/locale/lang/zh-cn";

export default defineComponent({
  name: "app",
  components: {
    [ElConfigProvider.name]: ElConfigProvider,
    ReDialog,
    ReloadPWA
  },
  setup() {
    return {};
  },
  computed: {
    currentLocale() {
      return zhCn;
    }
  }
});
</script>
