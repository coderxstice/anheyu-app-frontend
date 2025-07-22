<template>
  <el-dropdown trigger="click" popper-class="anzhiyu-dropdown-menu">
    <span
      v-ripple
      class="navbar-bg-hover w-[40px] h-[48px] flex-c cursor-pointer"
    >
      <!--
        1. 将 IconifyIconOffline 修改为 component
        2. SVG 组件通常没有 color prop，而是通过 CSS 的 color 属性来控制颜色
      -->
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
          <!-- 2. 这里也修改为 component -->
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
import { useSystemThemeChange } from "@/layout/hooks/useSystemThemeChange";
import { useDark } from "@pureadmin/utils";

import DayIcon from "@/assets/svg/day.svg?component";
import DarkIcon from "@/assets/svg/dark.svg?component";
import SystemIcon from "@/assets/svg/system.svg?component";

defineOptions({ name: "ThemeSwitcher" });

const { isDark } = useDark();
const { overallStyle, dataTheme, dataThemeChange } = useDataThemeChange();
const { watchSystemThemeChange } = useSystemThemeChange();

// themeIcon 的逻辑保持不变
const themeIcon = computed(() => {
  if (overallStyle.value === "light") return DayIcon;
  if (overallStyle.value === "dark") return DarkIcon;
  // 当为 'system' 时，根据实际的 dataTheme (true/false) 显示图标
  return dataTheme.value ? DarkIcon : DayIcon;
});

// iconColor 的逻辑保持不变
const iconColor = computed(() => {
  return isDark.value ? "white" : "black";
});

const themeOptions = [
  { label: "浅色", theme: "light", icon: DayIcon },
  { label: "黑暗", theme: "dark", icon: DarkIcon },
  { label: "系统", theme: "system", icon: SystemIcon }
] as const;

const handleThemeChange = (theme: "light" | "dark" | "system") => {
  dataThemeChange(theme);
  if (theme === "system") {
    watchSystemThemeChange();
  }
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
