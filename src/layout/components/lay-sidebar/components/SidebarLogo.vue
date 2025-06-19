<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-15 11:31:00
 * @LastEditTime: 2025-06-19 12:51:21
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { getTopMenu } from "@/router/utils";
import { computed } from "vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

defineProps({
  collapse: Boolean
});

const siteConfigStore = useSiteConfigStore();

const appName = computed(
  () => siteConfigStore.getSiteConfig?.APP_NAME || "鱼鱼相册"
);

const appLogo = computed(
  () => siteConfigStore.getSiteConfig?.LOGO_URL || "/logo.svg"
);
</script>

<template>
  <div class="sidebar-logo-container" :class="{ collapses: collapse }">
    <transition name="sidebarLogoFade">
      <router-link
        v-if="collapse"
        key="collapse"
        :title="appName"
        class="sidebar-logo-link"
        :to="getTopMenu()?.path ?? '/'"
      >
        <img :src="appLogo" alt="logo" />
        <span class="sidebar-title">{{ appName }}</span>
      </router-link>
      <router-link
        v-else
        key="expand"
        :title="appName"
        class="sidebar-logo-link"
        :to="getTopMenu()?.path ?? '/'"
      >
        <img :src="appLogo" alt="logo" />
        <span class="sidebar-title">{{ appName }}</span>
      </router-link>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
.sidebar-logo-container {
  position: relative;
  width: 100%;
  height: 48px;
  overflow: hidden;
  border-right: var(--style-border);

  .sidebar-logo-link {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    height: 100%;
    padding-left: 10px;

    img {
      display: inline-block;
      height: 32px;
    }

    .sidebar-title {
      display: inline-block;
      height: 32px;
      margin: 2px 0 0 12px;
      overflow: hidden;
      font-size: 18px;
      font-weight: 600;
      line-height: 32px;
      color: var(--anzhiyu-theme-sub-menu-active-text);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
