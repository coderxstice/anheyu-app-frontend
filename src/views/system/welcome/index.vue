<template>
  <div class="welcome-dashboard">
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner" />
      <p>正在加载统计数据...</p>
    </div>

    <div v-if="error" class="error-overlay">
      <div class="error-card">
        <div class="error-icon">😕</div>
        <h3>数据加载失败</h3>
        <p>{{ error }}</p>
        <button class="retry-btn" @click="retryLoad">重试</button>
      </div>
    </div>

    <div v-if="!loading && !error" class="dashboard-content">
      <header class="dashboard-header">
        <div class="header-text">
          <h1>欢迎回来, {{ username }} 👋</h1>
        </div>
        <p class="header-time">{{ currentTime }}</p>
      </header>

      <main class="dashboard-main">
        <!-- 数据概览卡片 -->
        <AnalysisOverview :items="overviewItems" />

        <!-- 图表区域 -->
        <AnalysisChartsTabs :tabs="chartTabs" class="mt-5">
          <template #trends>
            <AnalyticsTrends :data="statisticsSummary.trend_data.daily" />
          </template>
          <template #visits>
            <AnalyticsVisits :data="statisticsSummary.trend_data.daily" />
          </template>
        </AnalysisChartsTabs>

        <!-- 底部四列图表 -->
        <div class="mt-5 charts-row">
          <AnalysisChartCard title="访问来源" class="chart-col">
            <AnalyticsSource :data="statisticsSummary.analytics.top_referers" />
          </AnalysisChartCard>
          <AnalysisChartCard title="浏览器分布" class="chart-col">
            <AnalyticsBrowsers
              :data="statisticsSummary.analytics.top_browsers"
            />
          </AnalysisChartCard>
          <AnalysisChartCard title="操作系统" class="chart-col">
            <AnalyticsOS :data="statisticsSummary.analytics.top_os" />
          </AnalysisChartCard>
          <AnalysisChartCard title="设备分析" class="chart-col">
            <AnalyticsDevices
              :browsers="statisticsSummary.analytics.top_browsers"
              :os="statisticsSummary.analytics.top_os"
              :devices="statisticsSummary.analytics.top_devices"
            />
          </AnalysisChartCard>
        </div>
      </main>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from "vue";
import {
  getStatistics,
  getStatisticsSummary,
  getVisitorAnalytics,
  getTopPages,
  getVisitorTrend
} from "@/api/statistics";
import { getArticleList } from "@/api/post";
import type { StatisticData } from "@/types/about";
import type { AnalysisOverviewItem, TabOption } from "@/components/Dashboard";
import { useNav } from "@/layout/hooks/useNav";
import {
  AnalysisOverview,
  AnalysisChartCard,
  AnalysisChartsTabs
} from "@/components/Dashboard";
import {
  SvgUserIcon,
  SvgEyeIcon,
  SvgArticleIcon,
  SvgTrendingIcon,
  SvgClockIcon,
  SvgBounceIcon
} from "@/components/Dashboard/icons";
import AnalyticsTrends from "./components/AnalyticsTrends.vue";
import AnalyticsVisits from "./components/AnalyticsVisits.vue";
import AnalyticsSource from "./components/AnalyticsSource.vue";
import AnalyticsBrowsers from "./components/AnalyticsBrowsers.vue";
import AnalyticsOS from "./components/AnalyticsOS.vue";
import AnalyticsDevices from "./components/AnalyticsDevices.vue";

defineOptions({
  name: "Welcome"
});

// 响应式数据
const loading = ref(true);
const error = ref<string | null>(null);

const statistics = ref<StatisticData>({
  today_visitors: 0,
  today_views: 0,
  yesterday_visitors: 0,
  yesterday_views: 0,
  month_views: 0,
  year_views: 0
});

const articleStats = ref({
  total: 0,
  published: 0
});

const statisticsSummary = ref({
  basic_stats: {
    today_visitors: 0,
    today_views: 0,
    yesterday_visitors: 0,
    yesterday_views: 0,
    month_views: 0,
    year_views: 0
  },
  top_pages: [] as any[],
  analytics: {
    top_countries: [] as any[],
    top_cities: [] as any[],
    top_browsers: [] as any[],
    top_os: [] as any[],
    top_devices: [] as any[],
    top_referers: [] as any[]
  },
  trend_data: {
    daily: [] as any[],
    weekly: [] as any[],
    monthly: [] as any[]
  }
});

// 图表 tabs 配置
const chartTabs: TabOption[] = [
  {
    label: "流量趋势",
    value: "trends"
  },
  {
    label: "月访问量",
    value: "visits"
  }
];

// 计算平均停留时间和跳出率
const avgDuration = computed(() => {
  const pages = statisticsSummary.value.top_pages;
  if (!pages || pages.length === 0) return 0;
  const total = pages.reduce((sum, page) => sum + (page.avg_duration || 0), 0);
  return total / pages.length;
});

const avgBounceRate = computed(() => {
  const pages = statisticsSummary.value.top_pages;
  if (!pages || pages.length === 0) return 0;
  const total = pages.reduce(
    (sum, page) => sum + (page.bounce_rate || 0) * 100,
    0
  );
  return total / pages.length;
});

// 概览数据
const overviewItems = computed<AnalysisOverviewItem[]>(() => [
  {
    icon: SvgUserIcon,
    title: "今日访客",
    totalTitle: "昨日访客",
    totalValue: statistics.value.yesterday_visitors || 0,
    value: statistics.value.today_visitors || 0,
    change: {
      type: getChangeType(
        statistics.value.today_visitors,
        statistics.value.yesterday_visitors
      ),
      text: getChangeText(
        statistics.value.today_visitors,
        statistics.value.yesterday_visitors
      )
    }
  },
  {
    icon: SvgEyeIcon,
    title: "今日浏览",
    totalTitle: "昨日浏览",
    totalValue: statistics.value.yesterday_views || 0,
    value: statistics.value.today_views || 0,
    change: {
      type: getChangeType(
        statistics.value.today_views,
        statistics.value.yesterday_views
      ),
      text: getChangeText(
        statistics.value.today_views,
        statistics.value.yesterday_views
      )
    }
  },
  {
    icon: SvgArticleIcon,
    title: "文章总数",
    totalTitle: "已发布",
    totalValue: articleStats.value.published || 0,
    value: articleStats.value.total || 0
  },
  {
    icon: SvgTrendingIcon,
    title: "本月浏览",
    totalTitle: "年度浏览",
    totalValue: statistics.value.year_views || 0,
    value: statistics.value.month_views || 0
  },
  {
    icon: SvgClockIcon,
    title: "平均停留",
    totalTitle: "总页面数",
    totalValue: statisticsSummary.value.top_pages?.length || 0,
    value: avgDuration.value,
    format: "duration"
  },
  {
    icon: SvgBounceIcon,
    title: "跳出率",
    totalTitle: "统计页面",
    totalValue: statisticsSummary.value.top_pages?.length || 0,
    value: avgBounceRate.value,
    format: "percent"
  }
]);

// 仅保留前10条来源数据
function limitTopReferers<T extends { top_referers?: unknown[] }>(
  analytics: T
): T {
  if (analytics && Array.isArray((analytics as any).top_referers)) {
    (analytics as any).top_referers = (analytics as any).top_referers.slice(
      0,
      10
    );
  }
  return analytics;
}

// 计算属性
const currentTime = computed(() => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  };
  return now.toLocaleDateString("zh-CN", options);
});

const { username } = useNav();

const loadStatisticsSummary = async () => {
  try {
    const response = await getStatisticsSummary();

    if (response.data) {
      if (response.data.basic_stats) {
        statisticsSummary.value.basic_stats = response.data.basic_stats;
        statistics.value = response.data.basic_stats;
      }
      if (response.data.top_pages) {
        statisticsSummary.value.top_pages = response.data.top_pages;
      }
      if (response.data.analytics) {
        statisticsSummary.value.analytics = limitTopReferers(
          response.data.analytics
        );
      } else {
        await loadVisitorAnalyticsDirectly();
      }
      if (response.data.trend_data) {
        statisticsSummary.value.trend_data = {
          daily: response.data.trend_data.daily || [],
          weekly: response.data.trend_data.weekly || [],
          monthly: response.data.trend_data.monthly || []
        };
      }
    } else {
      await loadAllStatisticsSeparately();
    }
  } catch (error) {
    console.error("加载统计概览失败:", error);
    await loadAllStatisticsSeparately();
  }
};

const loadArticleStats = async () => {
  try {
    const response = await getArticleList({ page: 1, pageSize: 1 });
    if (response.data) {
      articleStats.value.total = response.data.total;
      const publishedResponse = await getArticleList({
        page: 1,
        pageSize: 1,
        status: "PUBLISHED"
      });
      if (publishedResponse.data) {
        articleStats.value.published = publishedResponse.data.total;
      }
    }
  } catch (error) {
    console.error("加载文章统计失败:", error);
  }
};

const getChangeType = (
  current: number,
  previous: number
): "positive" | "negative" | "neutral" => {
  if (previous === 0) {
    return current > 0 ? "positive" : "neutral";
  }
  if (current > previous) return "positive";
  if (current < previous) return "negative";
  return "neutral";
};

const getChangeText = (current: number, previous: number) => {
  if (previous === 0) {
    return current > 0 ? "新增" : "持平";
  }
  if (current === previous) return "持平";
  const change = current - previous;
  const percentage = Math.abs(Math.round((change / previous) * 100));
  if (isNaN(percentage)) return "持平";
  return change > 0 ? `↑ ${percentage}%` : `↓ ${percentage}%`;
};

const loadVisitorAnalyticsDirectly = async () => {
  try {
    const response = await getVisitorAnalytics();
    if (response.data) {
      statisticsSummary.value.analytics = limitTopReferers(response.data);
    }
  } catch (error) {
    console.error("访客分析接口调用失败:", error);
  }
};

const loadAllStatisticsSeparately = async () => {
  try {
    const [basicStats, analytics, topPages, trendData] =
      await Promise.allSettled([
        getStatistics(),
        getVisitorAnalytics(),
        getTopPages(10),
        getVisitorTrend("daily", 30)
      ]);

    if (basicStats.status === "fulfilled" && basicStats.value.data) {
      statistics.value = basicStats.value.data;
      statisticsSummary.value.basic_stats = basicStats.value.data;
    }
    if (analytics.status === "fulfilled" && analytics.value.data) {
      statisticsSummary.value.analytics = limitTopReferers(
        analytics.value.data
      );
    }
    if (topPages.status === "fulfilled" && topPages.value.data) {
      statisticsSummary.value.top_pages = topPages.value.data;
    }
    if (trendData.status === "fulfilled" && trendData.value.data) {
      statisticsSummary.value.trend_data = trendData.value.data;
    }
  } catch (error) {
    console.error("单独调用统计接口失败:", error);
  }
};

const retryLoad = async () => {
  error.value = null;
  loading.value = true;
  try {
    await Promise.all([loadStatisticsSummary(), loadArticleStats()]);
  } catch (err) {
    error.value = "重试加载失败，请检查网络连接";
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  try {
    await Promise.all([loadStatisticsSummary(), loadArticleStats()]);
  } catch (err) {
    error.value = "数据加载失败，请检查网络连接或联系管理员";
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped lang="scss">
.welcome-dashboard {
  padding-bottom: 3rem;
  color: var(--anzhiyu-fontcolor);
}

.loading-overlay,
.error-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--anzhiyu-secondtext);
  background: var(--anzhiyu-maskbgdeep);
  backdrop-filter: blur(8px);
}

.loading-spinner {
  width: 48px;
  height: 48px;
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

.error-card {
  padding: 2.5rem;
  margin: 1rem;
  text-align: center;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);
  transition: var(--anzhiyu-transition-duration);
}

.error-icon {
  margin-bottom: 1rem;
  font-size: 3rem;
}

.error-card h3 {
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--anzhiyu-fontcolor);
}

.error-card p {
  margin-bottom: 1.5rem;
  color: var(--anzhiyu-secondtext);
}

.retry-btn {
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  color: var(--anzhiyu-white);
  cursor: pointer;
  background: var(--anzhiyu-theme);
  border: none;
  border-radius: 8px;
  box-shadow: var(--anzhiyu-shadow-theme);
  transition: all var(--anzhiyu-transition-duration);
}

.retry-btn:hover {
  background: var(--anzhiyu-theme-op-deep);
  transform: translateY(-1px);
}

.retry-btn:disabled {
  cursor: not-allowed;
  background: var(--anzhiyu-gray);
  box-shadow: none;
  transform: none;
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.dashboard-header h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--anzhiyu-fontcolor);
}

.header-time {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--anzhiyu-secondtext);
}

.dashboard-main {
  display: flex;
  flex-direction: column;
}

.mt-5 {
  margin-top: 1.25rem;
}

.charts-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.chart-col {
  min-width: 0;
}

@media (width <= 1400px) {
  .charts-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (width <= 768px) {
  .charts-row {
    grid-template-columns: 1fr;
  }
}

@media (width <= 768px) {
  .welcome-dashboard {
    padding: 1rem;
  }

  .dashboard-header h1 {
    font-size: 1.5rem;
  }
}
</style>
