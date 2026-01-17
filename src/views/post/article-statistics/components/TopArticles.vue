<!--
 * @Description: 热门文章排行榜
 * @Author: 安知鱼
 * @Date: 2026-01-17
-->
<script setup lang="ts">
import { computed } from "vue";
import type { TopViewedPostItem } from "@/api/post/type";

interface Props {
  articles: TopViewedPostItem[];
}

const props = withDefaults(defineProps<Props>(), {
  articles: () => []
});

// 防御性检查：确保 articles 是数组
const safeArticles = computed(() =>
  Array.isArray(props.articles) ? props.articles : []
);

// 格式化浏览量
const formatViews = (views: number): string => {
  if (views >= 1000) {
    return (views / 1000).toFixed(1) + "K";
  }
  return views.toString();
};

// 获取排名样式
const getRankClass = (index: number): string => {
  if (index === 0) return "rank-gold";
  if (index === 1) return "rank-silver";
  if (index === 2) return "rank-bronze";
  return "";
};
</script>

<template>
  <div class="top-articles">
    <div v-if="safeArticles.length === 0" class="empty-state">
      暂无热门文章数据
    </div>
    <div v-else class="article-list">
      <router-link
        v-for="(article, index) in safeArticles"
        :key="article.id"
        :to="`/posts/${article.id}`"
        class="article-item"
      >
        <span class="rank" :class="getRankClass(index)">{{ index + 1 }}</span>
        <div class="article-info">
          <span class="article-title" :title="article.title">{{
            article.title
          }}</span>
          <span class="article-views">
            <i class="anzhiyufont anzhiyu-icon-eye" />
            {{ formatViews(article.views) }}
          </span>
        </div>
      </router-link>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.top-articles {
  min-height: 200px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--anzhiyu-secondtext);
}

.article-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.article-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--anzhiyu-secondbg);
  border-radius: 8px;
  transition: all 0.3s;
  text-decoration: none;

  &:hover {
    background: var(--anzhiyu-theme-op);
    transform: translateX(4px);
  }
}

.rank {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 12px;
  font-weight: 700;
  color: var(--anzhiyu-secondtext);
  background: var(--anzhiyu-card-bg);
  border-radius: 6px;
  flex-shrink: 0;

  &.rank-gold {
    color: #fff;
    background: linear-gradient(135deg, #ffd700, #ffb800);
  }

  &.rank-silver {
    color: #fff;
    background: linear-gradient(135deg, #c0c0c0, #a8a8a8);
  }

  &.rank-bronze {
    color: #fff;
    background: linear-gradient(135deg, #cd7f32, #b87333);
  }
}

.article-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.article-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--anzhiyu-fontcolor);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.article-views {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 12px;
  color: var(--anzhiyu-secondtext);

  i {
    font-size: 12px;
  }
}
</style>
