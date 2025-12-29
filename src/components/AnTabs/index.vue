<!--
 * @Description: 公共 Tabs 切换组件
 * @Author: 安知鱼
 * @Date: 2025-12-29 14:00:00
-->
<template>
  <div class="an-tabs" :class="{ 'full-width': fullWidth }">
    <div class="tabs-nav">
      <div
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-item"
        :class="{ active: modelValue === tab.value }"
        @click="handleTabClick(tab.value)"
      >
        <el-icon v-if="tab.icon">
          <component :is="tab.icon" />
        </el-icon>
        <span>{{ tab.label }}</span>
      </div>
      <div class="tab-indicator" :style="indicatorStyle" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Component } from "vue";

export interface TabItem {
  label: string;
  value: string;
  icon?: Component;
}

const props = withDefaults(
  defineProps<{
    modelValue: string;
    tabs: TabItem[];
    fullWidth?: boolean;
  }>(),
  {
    fullWidth: false
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "change", value: string): void;
}>();

// 计算当前激活的 tab 索引
const activeIndex = computed(() => {
  return props.tabs.findIndex(tab => tab.value === props.modelValue);
});

// 计算指示器样式
const indicatorStyle = computed(() => {
  const tabCount = props.tabs.length;
  const width = 100 / tabCount;
  return {
    width: `${width}%`,
    transform: `translateX(${activeIndex.value * 100}%)`
  };
});

// 处理 tab 点击
const handleTabClick = (value: string) => {
  if (value !== props.modelValue) {
    emit("update:modelValue", value);
    emit("change", value);
  }
};
</script>

<style lang="scss" scoped>
.an-tabs {
  display: inline-block;

  &.full-width {
    display: block;

    .tabs-nav {
      width: 100%;

      .tab-item {
        flex: 1;
        justify-content: center;
      }
    }
  }
}

.tabs-nav {
  position: relative;
  display: inline-flex;
  padding: 3px;
  background: var(--anzhiyu-secondbg);
  border-radius: 8px;

  .tab-item {
    position: relative;
    z-index: 1;
    display: flex;
    gap: 6px;
    align-items: center;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 500;
    color: var(--anzhiyu-secondtext);
    cursor: pointer;
    transition: color 0.3s ease;

    .el-icon {
      font-size: 14px;
    }

    &:hover {
      color: var(--anzhiyu-fontcolor);
    }

    &.active {
      color: var(--anzhiyu-fontcolor);
    }
  }

  .tab-indicator {
    position: absolute;
    top: 3px;
    bottom: 3px;
    left: 3px;
    background: var(--anzhiyu-card-bg);
    border-radius: 6px;
    box-shadow: var(--anzhiyu-shadow-border);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
}
</style>
