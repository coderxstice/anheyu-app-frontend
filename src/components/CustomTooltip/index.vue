<!--
 * @Description: 自定义hover提示组件
 * @Author: 安知鱼
 * @Date: 2025-08-31 15:50:00
 * @LastEditTime: 2025-08-31 15:53:54
 * @LastEditors: 安知鱼
-->
<template>
  <div
    class="custom-tooltip-wrapper"
    @mouseenter="showTooltip"
    @mouseleave="hideTooltip"
  >
    <slot />
    <div
      v-if="isVisible"
      class="custom-tooltip"
      :class="placement"
      :style="tooltipStyle"
    >
      <div class="tooltip-content">
        {{ content }}
      </div>
      <div class="tooltip-arrow" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";

interface Props {
  content: string;
  placement?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

const props = withDefaults(defineProps<Props>(), {
  placement: "top",
  delay: 300
});

const isVisible = ref(false);
let showTimer: NodeJS.Timeout | null = null;
let hideTimer: NodeJS.Timeout | null = null;

const tooltipStyle = computed(() => {
  const baseStyle = {
    "--tooltip-bg": "#1f2937",
    "--tooltip-text": "#ffffff"
  } as any;

  return baseStyle;
});

const showTooltip = () => {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }

  showTimer = setTimeout(() => {
    isVisible.value = true;
  }, props.delay);
};

const hideTooltip = () => {
  if (showTimer) {
    clearTimeout(showTimer);
    showTimer = null;
  }

  hideTimer = setTimeout(() => {
    isVisible.value = false;
  }, 100);
};
</script>

<style scoped lang="scss">
.custom-tooltip-wrapper {
  position: relative;
  display: inline-block;
}

.custom-tooltip {
  position: absolute;
  z-index: 9999;
  background: var(--tooltip-bg);
  color: var(--tooltip-text);
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.875rem;
  line-height: 1.4;
  white-space: nowrap;
  max-width: 300px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);

  &.top {
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-bottom: 8px;

    .tooltip-arrow {
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border-top: 6px solid var(--tooltip-bg);
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
    }
  }

  &.bottom {
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 8px;

    .tooltip-arrow {
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      border-bottom: 6px solid var(--tooltip-bg);
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
    }
  }

  &.left {
    right: 100%;
    top: 50%;
    transform: translateY(-50%);
    margin-right: 8px;

    .tooltip-arrow {
      left: 100%;
      top: 50%;
      transform: translateY(-50%);
      border-left: 6px solid var(--tooltip-bg);
      border-top: 6px solid transparent;
      border-bottom: 6px solid transparent;
    }
  }

  &.right {
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    margin-left: 8px;

    .tooltip-arrow {
      right: 100%;
      top: 50%;
      transform: translateY(-50%);
      border-right: 6px solid var(--tooltip-bg);
      border-top: 6px solid transparent;
      border-bottom: 6px solid transparent;
    }
  }
}

.tooltip-arrow {
  position: absolute;
  width: 0;
  height: 0;
}

.tooltip-content {
  word-break: break-all;
  white-space: normal;
  max-width: 280px;
}
</style>
