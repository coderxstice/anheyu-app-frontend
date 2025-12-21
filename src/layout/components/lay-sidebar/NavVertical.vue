<script setup lang="ts">
import { useRoute } from "vue-router";
import { emitter } from "@/utils/mitt";
import { useNav } from "@/layout/hooks/useNav";
import { responsiveStorageNameSpace } from "@/config/base";
import { storageLocal, isAllEmpty } from "@pureadmin/utils";
import { findRouteByPath, getParentPaths } from "@/router/utils";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import LaySidebarLogo from "../lay-sidebar/components/SidebarLogo.vue";
import LaySidebarItem from "../lay-sidebar/components/SidebarItem.vue";
import LaySidebarLeftCollapse from "../lay-sidebar/components/SidebarLeftCollapse.vue";
import LaySidebarCenterCollapse from "../lay-sidebar/components/SidebarCenterCollapse.vue";
import { Close } from "@element-plus/icons-vue";

const route = useRoute();
const isShow = ref(false);
const showLogo = ref(
  storageLocal().getItem<StorageConfigs>(
    `${responsiveStorageNameSpace()}configure`
  )?.showLogo ?? true
);

const {
  device,
  pureApp,
  isCollapse,
  tooltipEffect,
  menuSelect,
  toggleSideBar
} = useNav();

const subMenuData = ref([]);

// 触摸手势相关状态
const touchStartX = ref(0);
const touchStartY = ref(0);
const isTouching = ref(false);

const menuData = computed(() => {
  return pureApp.layout === "mix" && device.value !== "mobile"
    ? subMenuData.value
    : usePermissionStoreHook().wholeMenus;
});

const loading = computed(() =>
  pureApp.layout === "mix" ? false : menuData.value.length === 0 ? true : false
);

const defaultActive = computed(() =>
  !isAllEmpty(route.meta?.activePath) ? route.meta.activePath : route.path
);

// 默认展开的菜单（当前路由的所有父级路径）
const defaultOpeneds = computed(() => {
  const path = defaultActive.value;
  return getParentPaths(path, usePermissionStoreHook().wholeMenus);
});

function getSubMenuData() {
  let path = "";
  path = defaultActive.value;
  subMenuData.value = [];
  // path的上级路由组成的数组
  const parentPathArr = getParentPaths(
    path,
    usePermissionStoreHook().wholeMenus
  );
  // 当前路由的父级路由信息
  const parenetRoute = findRouteByPath(
    parentPathArr[0] || path,
    usePermissionStoreHook().wholeMenus
  );
  if (!parenetRoute?.children) return;
  subMenuData.value = parenetRoute?.children;
}

// 触摸事件处理
const handleTouchStart = (event: TouchEvent) => {
  if (device.value !== "mobile") return;

  const touch = event.touches[0];
  touchStartX.value = touch.clientX;
  touchStartY.value = touch.clientY;
  isTouching.value = true;
};

const handleTouchMove = (event: TouchEvent) => {
  if (device.value !== "mobile" || !isTouching.value) return;

  const touch = event.touches[0];
  const deltaX = touch.clientX - touchStartX.value;
  const deltaY = Math.abs(touch.clientY - touchStartY.value);

  // 如果垂直滑动距离大于水平滑动距离，不处理
  if (deltaY > Math.abs(deltaX)) return;

  // 向左滑动超过50px时关闭侧边栏
  if (deltaX < -50 && pureApp.getSidebarStatus) {
    toggleSideBar();
    isTouching.value = false;
  }
};

const handleTouchEnd = () => {
  isTouching.value = false;
};

watch(
  () => [route.path, usePermissionStoreHook().wholeMenus],
  () => {
    if (route.path.includes("/redirect")) return;
    getSubMenuData();
    menuSelect(route.path);
  }
);

onMounted(() => {
  getSubMenuData();

  emitter.on("logoChange", key => {
    showLogo.value = key;
  });
});

onBeforeUnmount(() => {
  // 解绑`logoChange`公共事件，防止多次触发
  emitter.off("logoChange");
});
</script>

<template>
  <div
    v-loading="loading"
    :class="[
      'sidebar-container',
      showLogo ? 'has-logo' : 'no-logo',
      device === 'mobile' ? 'mobile-sidebar' : ''
    ]"
    @mouseenter.prevent="device !== 'mobile' ? (isShow = true) : null"
    @mouseleave.prevent="device !== 'mobile' ? (isShow = false) : null"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <LaySidebarLogo v-if="showLogo" :collapse="isCollapse" />
    <el-scrollbar
      wrap-class="scrollbar-wrapper"
      :class="[device === 'mobile' ? 'mobile' : 'pc']"
    >
      <el-menu
        unique-opened
        mode="vertical"
        popper-class="pure-scrollbar"
        class="outer-most select-none"
        :collapse="isCollapse"
        :collapse-transition="false"
        :popper-effect="tooltipEffect"
        :default-active="defaultActive"
        :default-openeds="defaultOpeneds"
      >
        <LaySidebarItem
          v-for="routes in menuData"
          :key="routes.path"
          :item="routes"
          :base-path="routes.path"
          class="outer-most select-none"
        />
      </el-menu>
    </el-scrollbar>
    <LaySidebarCenterCollapse
      v-if="device !== 'mobile' && (isShow || isCollapse)"
      :is-active="pureApp.sidebar.opened"
      @toggleClick="toggleSideBar"
    />
    <LaySidebarLeftCollapse
      v-if="device !== 'mobile'"
      :is-active="pureApp.sidebar.opened"
      @toggleClick="toggleSideBar"
    />
    <!-- 移动端侧边栏关闭按钮 -->
    <div
      v-if="device === 'mobile'"
      class="mobile-close-btn"
      @click="toggleSideBar"
    >
      <el-icon><Close /></el-icon>
    </div>
  </div>
</template>

<style scoped>
:deep(.el-loading-mask) {
  opacity: 0.45;
}
</style>
