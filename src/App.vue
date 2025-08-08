<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-15 11:31:00
 * @LastEditTime: 2025-08-07 18:48:23
 * @LastEditors: 安知鱼
-->
<template>
  <el-config-provider :locale="currentLocale">
    <router-view />
    <ReDialog />
    <ReloadPWA />
    <GlobalLoading />
  </el-config-provider>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ElConfigProvider } from "element-plus";
import { ReDialog } from "@/components/ReDialog";
import ReloadPWA from "@/components/ReloadPWA/ReloadPWA.vue";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import GlobalLoading from "@/components/GlobalLoading/index.vue";

export default defineComponent({
  name: "app",
  components: {
    [ElConfigProvider.name]: ElConfigProvider,
    ReDialog,
    ReloadPWA,
    GlobalLoading
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
