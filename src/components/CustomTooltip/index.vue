<template>
  <div
    ref="triggerRef"
    class="custom-tooltip-wrapper"
    @mouseenter="showTooltip"
    @mouseleave="hideTooltip"
  >
    <slot />
    <Teleport to="body">
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
    </Teleport>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick, onUnmounted } from "vue";

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
const triggerRef = ref<HTMLDivElement | null>(null);
const tooltipStyle = ref({});
let showTimer: NodeJS.Timeout | null = null;
let hideTimer: NodeJS.Timeout | null = null;

const updatePosition = () => {
  if (!triggerRef.value) return;

  const rect = triggerRef.value.getBoundingClientRect();
  const style: {
    position: "fixed";
    top?: string;
    left?: string;
    transform?: string;
    "--tooltip-bg": string;
    "--tooltip-text": string;
  } = {
    position: "fixed",
    "--tooltip-bg": "#1f2937",
    "--tooltip-text": "#ffffff"
  };

  const margin = 8;

  switch (props.placement) {
    case "top":
      style.left = `${rect.left + rect.width / 2}px`;
      style.top = `${rect.top - margin}px`;
      style.transform = "translate(-50%, -100%)";
      break;
    case "bottom":
      style.left = `${rect.left + rect.width / 2}px`;
      style.top = `${rect.bottom + margin}px`;
      style.transform = "translateX(-50%)";
      break;
    case "left":
      style.left = `${rect.left - margin}px`;
      style.top = `${rect.top + rect.height / 2}px`;
      style.transform = "translate(-100%, -50%)";
      break;
    case "right":
      style.left = `${rect.right + margin}px`;
      style.top = `${rect.top + rect.height / 2}px`;
      style.transform = "translateY(-50%)";
      break;
  }

  tooltipStyle.value = style;
};

watch(isVisible, val => {
  if (val) {
    nextTick(() => {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
    });
  } else {
    window.removeEventListener("scroll", updatePosition, true);
    window.removeEventListener("resize", updatePosition);
  }
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

onUnmounted(() => {
  window.removeEventListener("scroll", updatePosition, true);
  window.removeEventListener("resize", updatePosition);
});
</script>

<style scoped lang="scss">
.custom-tooltip-wrapper {
  position: relative;
  display: inline-block;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

/* Tooltip is now a top-level element, its position is fixed */
.custom-tooltip {
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
