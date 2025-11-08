<!--
 * @Description: 主题切换器，点击切换主题，使用 gsap 动画
 * @Author: 安知鱼
 * @Date: 2025-07-22 10:33:03
 * @LastEditTime: 2025-11-08 12:17:46
 * @LastEditors: 安知鱼
-->
<template>
  <span
    ref="themeButtonRef"
    v-ripple
    class="navbar-bg-hover rounded-lg w-[40px] h-[40px] flex-c cursor-pointer theme-switcher"
    @click="handleThemeToggle"
  >
    <span ref="iconRef" class="theme-icon-wrapper">
      <component
        :is="themeIcon"
        class="text-xl theme-icon"
        :style="{ color: iconColor }"
      />
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from "vue";
import { gsap } from "gsap";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";

import DayIcon from "@/assets/svg/day.svg?component";
import DarkIcon from "@/assets/svg/dark.svg?component";

defineOptions({ name: "ThemeSwitcher" });

const { dataTheme, dataThemeChange } = useDataThemeChange();

const themeButtonRef = ref<HTMLElement | null>(null);
const iconRef = ref<any>(null);

const themeIcon = computed(() => {
  return dataTheme.value ? DarkIcon : DayIcon;
});

const iconColor = computed(() => {
  return dataTheme.value ? "white" : "black";
});

const handleThemeToggle = async (event: MouseEvent) => {
  if (!iconRef.value || !themeButtonRef.value) return;

  const iconElement = iconRef.value as HTMLElement;
  const buttonElement = themeButtonRef.value;

  // 切换主题：暗色 <-> 亮色
  const nextTheme = dataTheme.value ? "light" : "dark";

  // 创建动画时间线
  const tl = gsap.timeline();

  // 第一阶段：图标旋转并缩小
  tl.to(iconElement, {
    rotation: 180,
    scale: 0,
    duration: 0.2,
    ease: "power2.in"
  })
    // 第二阶段：切换主题
    .call(() => {
      dataThemeChange(nextTheme);
    })
    // 等待 DOM 更新
    .call(async () => {
      await nextTick();
    })
    // 第三阶段：图标从反向旋转回来并放大
    .to(iconElement, {
      rotation: 360,
      scale: 1,
      duration: 0.3,
      ease: "back.out(1.7)"
    })
    // 重置旋转角度，避免累积
    .set(iconElement, {
      rotation: 0
    });

  // 按钮点击反馈动画
  gsap.to(buttonElement, {
    scale: 0.9,
    duration: 0.1,
    yoyo: true,
    repeat: 1,
    ease: "power2.inOut"
  });
};
</script>

<style lang="scss" scoped>
.theme-switcher {
  position: relative;
  // 移除 transition，让 gsap 完全控制动画
}

.theme-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transform-origin: center center;
}

.theme-icon {
  display: inline-block;
}
</style>
