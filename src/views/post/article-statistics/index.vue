<!--
 * @Description: 文章统计页面
 * @Author: 安知鱼
 * @Date: 2026-01-17
-->
<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent } from "vue";
import { useRouter } from "vue-router";
import { getArticleStatistics } from "@/api/post";
import type { ArticleStatistics } from "@/api/post/type";
import { IconifyIconOnline } from "@/components/ReIcon";
import OverviewCards from "./components/OverviewCards.vue";
import TopArticles from "./components/TopArticles.vue";
import TagCloud from "./components/TagCloud.vue";

defineOptions({
  name: "ArticleStatistics"
});

const router = useRouter();

const goBack = () => {
  router.push("/about");
};

// 异步加载 ECharts 组件
const CategoryChart = defineAsyncComponent(
  () => import("./components/CategoryChart.vue")
);
const PublishTrend = defineAsyncComponent(
  () => import("./components/PublishTrend.vue")
);

const statistics = ref<ArticleStatistics | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const fetchStatistics = async () => {
  try {
    loading.value = true;
    error.value = null;
    const response = await getArticleStatistics();
    if (response.code === 200 && response.data) {
      statistics.value = response.data;
    } else {
      throw new Error(response.message || "获取统计数据失败");
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "获取统计数据失败";
    console.error("获取文章统计数据失败:", err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchStatistics();
});
</script>

<template>
  <div class="article-statistics-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <button class="back-btn" @click="goBack">
        <IconifyIconOnline icon="ep:arrow-left" />
        <span>返回</span>
      </button>
      <h1 class="page-title">文章统计</h1>
      <div class="header-spacer" />
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner" />
      <p>正在加载统计数据...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">😕</div>
      <p>{{ error }}</p>
      <button class="retry-btn" @click="fetchStatistics">重试</button>
    </div>

    <!-- 数据展示 -->
    <div v-else-if="statistics" class="statistics-content">
      <!-- 概览卡片 -->
      <OverviewCards :statistics="statistics" />

      <!-- 图表区域 -->
      <div class="charts-grid">
        <!-- 分类分布 -->
        <div class="chart-card" style="animation-delay: 0.1s">
          <h3 class="chart-title">
            <IconifyIconOnline icon="material-symbols:pie-chart-outline" />
            分类分布
          </h3>
          <CategoryChart :data="statistics.category_stats" />
        </div>

        <!-- 发布趋势 -->
        <div class="chart-card" style="animation-delay: 0.2s">
          <h3 class="chart-title">
            <IconifyIconOnline icon="material-symbols:trending-up" />
            发布趋势
          </h3>
          <PublishTrend :data="statistics.publish_trend" />
        </div>
      </div>

      <!-- 底部区域 -->
      <div class="bottom-grid">
        <!-- 热门文章 -->
        <div class="list-card" style="animation-delay: 0.3s">
          <h3 class="card-title">
            <IconifyIconOnline icon="material-symbols:local-fire-department" />
            热门文章
          </h3>
          <TopArticles :articles="statistics.top_viewed_posts" />
        </div>

        <!-- 标签云 -->
        <div class="list-card" style="animation-delay: 0.4s">
          <h3 class="card-title">
            <IconifyIconOnline icon="material-symbols:tag" />
            标签分布
          </h3>
          <TagCloud :tags="statistics.tag_stats" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.article-statistics-page {
  max-width: 1400px;
  min-height: 400px;
  margin: 0 auto;
  padding: 1rem;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 14px;
  color: var(--anzhiyu-fontcolor);
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: var(--anzhiyu-theme-op);
    color: var(--anzhiyu-theme);
  }

  :deep(svg) {
    width: 16px;
    height: 16px;
  }
}

.page-title {
  margin: 0;
  font-size: 1.75em;
  font-weight: 700;
  color: var(--anzhiyu-fontcolor);
  text-align: center;
}

.header-spacer {
  width: 80px; // 与返回按钮宽度相同，保持标题居中
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: var(--anzhiyu-secondtext);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  margin-bottom: 1rem;
  border: 3px solid var(--anzhiyu-theme-op);
  border-top-color: var(--anzhiyu-theme);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.5rem 1.5rem;
  font-size: 14px;
  color: #fff;
  background: var(--anzhiyu-theme);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }
}

.statistics-content {
  animation: fade-in 0.5s ease;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-top: 1.5rem;

  @media screen and (width <= 768px) {
    grid-template-columns: 1fr;
  }
}

.chart-card {
  padding: 1.5rem;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);
  animation: card-fade-in 0.5s ease backwards;
}

.chart-title,
.card-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--anzhiyu-fontcolor);

  :deep(svg) {
    width: 20px;
    height: 20px;
    color: var(--anzhiyu-theme);
  }
}

@keyframes card-fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bottom-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-top: 1.5rem;

  @media screen and (width <= 768px) {
    grid-template-columns: 1fr;
  }
}

.list-card {
  padding: 1.5rem;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);
  animation: card-fade-in 0.5s ease backwards;
}
</style>
