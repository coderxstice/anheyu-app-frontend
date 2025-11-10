<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-21 17:48:59
 * @LastEditTime: 2025-11-09 13:36:06
 * @LastEditors: 安知鱼
-->
<template>
  <div :class="{ frontendLayout: true, [mainContentClass]: true }">
    <Header />

    <main class="frontend-main">
      <keep-alive :include="cachedViews">
        <router-view />
      </keep-alive>
    </main>

    <Footer />

    <SearchModal />

    <RightMenu />

    <KeyboardTips :visible="showShortcutsPanel" :shortcuts="shortcuts" />

    <MusicPlayer v-if="isMusicPlayerEnabled" />

    <MobileMenu
      :is-open="isMobileMenuOpen"
      :nav-config="navConfig"
      :menu-config="menuConfig"
      @close="closeMobileMenu"
    />

    <div
      v-if="isMobileMenuOpen"
      class="mobile-menu-overlay"
      @click="closeMobileMenu"
    />
  </div>
</template>

<script setup lang="ts">
import "@/components/ReIcon/src/offlineIcon";
import {
  onBeforeMount,
  onMounted,
  onUnmounted,
  computed,
  ref,
  watch
} from "vue";
import { useRoute } from "vue-router";
import { useGlobal } from "@pureadmin/utils";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import { useKeyboardShortcuts } from "@/composables/useKeyboardShortcuts";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

import Header from "./components/hearder/index.vue";
import Footer from "./components/footer/index.vue";
import SearchModal from "./components/SearchModal/index.vue";
import RightMenu from "./components/RightMenu/index.vue";
import KeyboardTips from "./components/KeyboardTips/index.vue";
import MobileMenu from "./components/MobileMenu/index.vue";
import MusicPlayer from "./components/MusicPlayer/index.vue";

const { $storage } = useGlobal<GlobalPropertiesApi>();
const route = useRoute();
const siteConfigStore = useSiteConfigStore();

const { showShortcutsPanel, shortcuts } = useKeyboardShortcuts();

// 管理需要缓存的组件名称（使用组件的 name，不是路由的 name）
const cachedViews = ref<string[]>([]);

// 监听路由变化，根据 meta.keepAlive 动态管理缓存
watch(
  () => route,
  toRoute => {
    if (!toRoute.name) return;

    const matchedRoute = toRoute.matched.find(r => r.name === toRoute.name);
    if (!matchedRoute?.meta?.keepAlive) return;

    // 获取组件名称（从路由配置中获取组件的 name）
    // 注意：keep-alive 的 include 需要的是组件的 name（defineOptions 中定义的）
    // 这里我们使用路由的 name，因为组件名通常与路由名一致
    const componentName = toRoute.name as string;

    // 如果组件需要缓存且不在缓存列表中，添加到缓存列表
    if (componentName && !cachedViews.value.includes(componentName)) {
      cachedViews.value.push(componentName);
    }
  },
  { immediate: true }
);

const mainContentClass = computed(() => {
  return route.name === "PostDetail" ? "is-post-detail" : "";
});

// 音乐播放器是否启用
const isMusicPlayerEnabled = computed(() => {
  const musicConfig = siteConfigStore.getSiteConfig?.music?.player?.enable;
  return Boolean(musicConfig);
});

const navConfig = computed(() => siteConfigStore.getSiteConfig?.header?.nav);
const menuConfig = computed(() => {
  const menu = siteConfigStore.getSiteConfig?.header?.menu;
  return Array.isArray(menu) ? menu : [];
});

// 移动端菜单状态管理
const isMobileMenuOpen = ref(false);

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
  // 防止背景滚动
  if (isMobileMenuOpen.value) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
  document.body.style.overflow = "";
};

onBeforeMount(() => {
  useDataThemeChange().dataThemeChange($storage.layout?.overallStyle);
});

onMounted(() => {
  // 监听移动端菜单切换事件
  window.addEventListener("toggle-mobile-menu", toggleMobileMenu);
});

onUnmounted(() => {
  // 清理事件监听器
  window.removeEventListener("toggle-mobile-menu", toggleMobileMenu);
  // 确保移除body样式
  document.body.style.overflow = "";
});
</script>

<style scoped lang="scss">
.frontendLayout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.frontend-main {
  flex: 1;
  animation: slide-in 0.6s 0.1s backwards;
}

/* 移动端菜单遮罩层 */
.mobile-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1008;
  width: 100vw;
  height: 100vh;
  background: var(--anzhiyu-maskbg);
  backdrop-filter: saturate(180%) blur(20px);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
