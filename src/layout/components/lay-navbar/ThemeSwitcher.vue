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
// useSystemThemeChange 不再需要，可以删除
// import { useSystemThemeChange } from "@/layout/hooks/useSystemThemeChange";
import { useDark } from "@pureadmin/utils";

import DayIcon from "@/assets/svg/day.svg?component";
import DarkIcon from "@/assets/svg/dark.svg?component";
import SystemIcon from "@/assets/svg/system.svg?component";

defineOptions({ name: "ThemeSwitcher" });

const { isDark } = useDark();

// 1. 从统一的 Hook 中获取所有需要的状态和方法
const { overallStyle, dataTheme, dataThemeChange, watchSystemThemeChange } =
  useDataThemeChange();

// 2. themeIcon 的计算逻辑保持不变，它依赖于从 Hook 获取的响应式状态
const themeIcon = computed(() => {
  if (overallStyle.value === "light") return DayIcon;
  if (overallStyle.value === "dark") return DarkIcon;
  // 当为 'system' 时，dataTheme.value 会被 Hook 自动更新
  return dataTheme.value ? DarkIcon : DayIcon;
});

// 3. iconColor 的逻辑保持不变
const iconColor = computed(() => {
  return isDark.value ? "white" : "black";
});

// 4. themeOptions 定义保持不变
const themeOptions = [
  { label: "浅色", theme: "light", icon: DayIcon },
  { label: "黑暗", theme: "dark", icon: DarkIcon },
  { label: "系统", theme: "system", icon: SystemIcon }
] as const;

// 5. handleThemeChange 逻辑保持不变，它调用从 Hook 中获取的方法
const handleThemeChange = (theme: "light" | "dark" | "system") => {
  dataThemeChange(theme);
  // 如果用户选择了 'system'，手动触发一次监听（Hook 内部会处理重复监听的问题）
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
