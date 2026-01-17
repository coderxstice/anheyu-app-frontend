<!--
 * @Description: 标签云
 * @Author: 安知鱼
 * @Date: 2026-01-17
-->
<script setup lang="ts">
import { computed } from "vue";
import type { TagStatItem } from "@/api/post/type";

interface Props {
  tags: TagStatItem[];
}

const props = withDefaults(defineProps<Props>(), {
  tags: () => []
});

// 预定义的颜色列表
const colors = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#f97316",
  "#6366f1"
];

// 防御性检查：确保 tags 是数组
const safeTags = computed(() => (Array.isArray(props.tags) ? props.tags : []));

// 计算标签大小（根据文章数量）
const getTagSize = (count: number): string => {
  const maxCount = Math.max(...safeTags.value.map(t => t.count), 1);
  const minSize = 12;
  const maxSize = 20;
  const ratio = count / maxCount;
  const size = minSize + ratio * (maxSize - minSize);
  return `${size}px`;
};

// 获取标签颜色
const getTagColor = (index: number): string => {
  return colors[index % colors.length];
};

// 限制显示的标签数量
const displayTags = computed(() => safeTags.value.slice(0, 20));
</script>

<template>
  <div class="tag-cloud">
    <div v-if="displayTags.length === 0" class="empty-state">暂无标签数据</div>
    <div v-else class="tags-container">
      <router-link
        v-for="(tag, index) in displayTags"
        :key="tag.name"
        :to="`/tags/${tag.name}/`"
        class="tag-item"
        :style="{
          fontSize: getTagSize(tag.count),
          backgroundColor: getTagColor(index) + '20',
          color: getTagColor(index),
          borderColor: getTagColor(index) + '40'
        }"
      >
        <span class="tag-name"># {{ tag.name }}</span>
        <span class="tag-count">{{ tag.count }}</span>
      </router-link>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.tag-cloud {
  min-height: 200px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--anzhiyu-secondtext);
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.4rem 0.75rem;
  border: 1px solid;
  border-radius: 20px;
  text-decoration: none;
  transition: all 0.3s;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.tag-name {
  font-weight: 500;
}

.tag-count {
  font-size: 0.75em;
  opacity: 0.8;
}
</style>
