<!--
 * @Description: 主题切换器，已更新为依赖单一、可靠的数据源。
 * @Author: 安知鱼
 * @Date: 2025-07-22 10:33:03
 * @LastEditTime: 2025-07-26 (AI Refactored)
 * @LastEditors: 安知鱼 & AI
-->
<template>
  <el-dropdown trigger="click" popper-class="anzhiyu-dropdown-menu">
    <span
      v-ripple
      class="navbar-bg-hover w-[40px] h-[48px] flex-c cursor-pointer"
    >
      <component
        :is="themeIcon"
        class="text-xl"
        :style="{ color: iconColor }"
      />
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="item in themeOptions"
          :key="item.theme"
          :class="{ 'is-active': overallStyle === item.theme }"
          @click="handleThemeChange(item.theme)"
        >
          <component :is="item.icon" class="theme-icon" />
          <span>{{ item.label }}</span>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";

import DayIcon from "@/assets/svg/day.svg?component";
import DarkIcon from "@/assets/svg/dark.svg?component";
import SystemIcon from "@/assets/svg/system.svg?component";

defineOptions({ name: "ThemeSwitcher" });

const { overallStyle, dataTheme, dataThemeChange } = useDataThemeChange();

const themeIcon = computed(() => {
  return dataTheme.value ? DarkIcon : DayIcon;
});

const iconColor = computed(() => {
  return dataTheme.value ? "white" : "black";
});

const themeOptions = [
  { label: "浅色", theme: "light", icon: DayIcon },
  { label: "黑暗", theme: "dark", icon: DarkIcon },
  { label: "系统", theme: "system", icon: SystemIcon }
] as const;

const handleThemeChange = (theme: "light" | "dark" | "system") => {
  dataThemeChange(theme);
};
</script>

<style lang="scss" scoped>
.theme-icon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
}

:deep(.el-dropdown-menu__item.is-active) {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: bold;
}

:deep(.el-dropdown-menu__item:not(.is-active):hover) {
  background-color: var(--el-dropdown-menuItem-hover-fill);
  color: var(--el-dropdown-menuItem-hover-color);
}
</style>
