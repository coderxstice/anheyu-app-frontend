<script setup lang="ts">
import type { AnalysisOverviewItem } from "./types";
import { ref, watch, onMounted } from "vue";
import { TransitionPresets, useTransition } from "@vueuse/core";

interface Props {
  items?: AnalysisOverviewItem[];
}

defineOptions({
  name: "AnalysisOverview"
});

const props = withDefaults(defineProps<Props>(), {
  items: () => []
});

// 动画数值存储
const animatedValues = ref<Map<number, number>>(new Map());
const animatedTotals = ref<Map<number, number>>(new Map());

// 数字格式化
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toLocaleString();
};

// 格式化百分比
const formatPercent = (num: number): string => {
  return num.toFixed(1) + "%";
};

// 格式化时间
const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return seconds.toFixed(0) + "秒";
  }
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${minutes}分${secs}秒`;
};

// 获取显示值
const getDisplayValue = (index: number, item: AnalysisOverviewItem): string => {
  const animatedValue = animatedValues.value.get(index) ?? 0;
  if (item.format === "percent") {
    return formatPercent(animatedValue);
  }
  if (item.format === "duration") {
    return formatDuration(animatedValue);
  }
  return formatNumber(Math.round(animatedValue));
};

// 获取底部显示值
const getTotalDisplayValue = (
  index: number,
  item: AnalysisOverviewItem
): string => {
  const animatedValue = animatedTotals.value.get(index) ?? 0;
  if (item.totalFormat === "percent") {
    return formatPercent(animatedValue);
  }
  if (item.totalFormat === "duration") {
    return formatDuration(animatedValue);
  }
  return formatNumber(Math.round(animatedValue));
};

// 动画函数
const animateNumber = (
  index: number,
  target: number,
  isTotal: boolean = false
) => {
  const source = ref(0);
  const output = useTransition(source, {
    duration: 1500,
    transition: TransitionPresets.easeOutCubic
  });

  // 监听动画值变化
  watch(
    output,
    newVal => {
      if (isTotal) {
        animatedTotals.value.set(index, newVal);
      } else {
        animatedValues.value.set(index, newVal);
      }
    },
    { immediate: true }
  );

  // 开始动画
  source.value = target;
};

// 启动所有动画
const startAnimations = () => {
  props.items.forEach((item, index) => {
    setTimeout(() => {
      animateNumber(index, item.value, false);
      animateNumber(index, item.totalValue, true);
    }, index * 100);
  });
};

// 监听数据变化
watch(
  () => props.items,
  newItems => {
    if (newItems.length > 0) {
      startAnimations();
    }
  },
  { deep: true }
);

onMounted(() => {
  if (props.items.length > 0) {
    startAnimations();
  }
});
</script>

<template>
  <div class="analysis-overview-grid">
    <template v-for="(item, index) in items" :key="item.title">
      <div class="overview-card">
        <div class="overview-card-header">
          <span class="overview-title">{{ item.title }}</span>
        </div>
        <div class="overview-card-content">
          <div class="overview-value-wrapper">
            <span class="overview-value">{{
              getDisplayValue(index, item)
            }}</span>
            <span
              v-if="item.change"
              class="overview-change"
              :class="item.change.type"
            >
              {{ item.change.text }}
            </span>
          </div>
          <div class="overview-icon">
            <component :is="item.icon" />
          </div>
        </div>
        <div class="overview-card-footer">
          <span class="overview-total-title">{{ item.totalTitle }}</span>
          <span class="overview-total-value">{{
            getTotalDisplayValue(index, item)
          }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.analysis-overview-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1rem;
}

@media (width >= 640px) {
  .analysis-overview-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (width >= 1024px) {
  .analysis-overview-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (width >= 1400px) {
  .analysis-overview-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.overview-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 1.25rem;
  overflow: hidden;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);
}

.overview-card-header {
  margin-bottom: 0.75rem;
}

.overview-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--anzhiyu-secondtext);
}

.overview-card-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.overview-value-wrapper {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.overview-value {
  overflow: hidden;
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
  color: var(--anzhiyu-fontcolor);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.overview-change {
  font-size: 0.75rem;
  font-weight: 500;

  &.positive {
    color: var(--anzhiyu-green, #10b981);
  }

  &.negative {
    color: var(--anzhiyu-red, #ef4444);
  }

  &.neutral {
    color: var(--anzhiyu-secondtext);
  }
}

.overview-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  color: var(--anzhiyu-theme);
  background: var(--anzhiyu-theme-op);
  border-radius: 12px;

  :deep(svg) {
    width: 24px;
    height: 24px;
  }
}

.overview-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.75rem;
  border-top: 1px solid var(--anzhiyu-card-border);
}

.overview-total-title {
  font-size: 0.75rem;
  color: var(--anzhiyu-secondtext);
}

.overview-total-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--anzhiyu-fontcolor);
}
</style>
