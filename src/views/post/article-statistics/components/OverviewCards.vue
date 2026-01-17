<!--
 * @Description: 文章统计概览卡片
 * @Author: 安知鱼
 * @Date: 2026-01-17
-->
<script setup lang="ts">
import { computed } from "vue";
import type { ArticleStatistics } from "@/api/post/type";
import { IconifyIconOnline } from "@/components/ReIcon";

interface Props {
  statistics: ArticleStatistics;
}

const props = defineProps<Props>();

// 格式化数字
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toLocaleString();
};

const overviewItems = computed(() => [
  {
    title: "文章总数",
    value: formatNumber(props.statistics.total_posts),
    icon: "material-symbols:article-outline",
    color: "#3b82f6"
  },
  {
    title: "总字数",
    value: formatNumber(props.statistics.total_words),
    icon: "material-symbols:text-fields",
    color: "#10b981"
  },
  {
    title: "总浏览量",
    value: formatNumber(props.statistics.total_views),
    icon: "material-symbols:visibility-outline",
    color: "#f59e0b"
  },
  {
    title: "平均字数",
    value: formatNumber(props.statistics.avg_words),
    icon: "material-symbols:calculate-outline",
    color: "#8b5cf6"
  }
]);
</script>

<template>
  <div class="overview-cards">
    <div
      v-for="(item, index) in overviewItems"
      :key="index"
      class="overview-card"
      :style="{ animationDelay: `${index * 0.1}s` }"
    >
      <div class="card-icon" :style="{ background: item.color + '20' }">
        <IconifyIconOnline :icon="item.icon" :style="{ color: item.color }" />
      </div>
      <div class="card-info">
        <span class="card-value">{{ item.value }}</span>
        <span class="card-title">{{ item.title }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;

  @media screen and (width <= 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media screen and (width <= 480px) {
    grid-template-columns: 1fr;
  }
}

.overview-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);
  transition: all 0.3s;
  animation: card-pop-in 0.5s ease backwards;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--anzhiyu-shadow-lightblue);
  }
}

@keyframes card-pop-in {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(10px);
  }

  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  flex-shrink: 0;

  :deep(svg) {
    width: 24px;
    height: 24px;
  }
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.card-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--anzhiyu-fontcolor);
  line-height: 1;
}

.card-title {
  font-size: 0.875rem;
  color: var(--anzhiyu-secondtext);
}
</style>
