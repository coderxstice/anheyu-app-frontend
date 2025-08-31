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
          <h1>欢迎回来, 安知鱼 👋</h1>
          <p>{{ currentTime }}</p>
        </div>
      </header>

      <main class="dashboard-grid">
        <div class="main-column">
          <section class="stats-grid">
            <div class="stat-card">
              <div class="stat-header">
                <div class="stat-icon-wrapper primary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <span>今日访问</span>
              </div>
              <p class="stat-number">{{ statistics.today_visitors || 0 }}</p>
              <div
                class="stat-comparison"
                :class="
                  getChangeClass(
                    statistics.today_visitors,
                    statistics.yesterday_visitors
                  )
                "
              >
                {{
                  getChangeText(
                    statistics.today_visitors,
                    statistics.yesterday_visitors
                  )
                }}
                vs 昨日
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-header">
                <div class="stat-icon-wrapper success">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <span>今日浏览量</span>
              </div>
              <p class="stat-number">{{ statistics.today_views || 0 }}</p>
              <div
                class="stat-comparison"
                :class="
                  getChangeClass(
                    statistics.today_views,
                    statistics.yesterday_views
                  )
                "
              >
                {{
                  getChangeText(
                    statistics.today_views,
                    statistics.yesterday_views
                  )
                }}
                vs 昨日
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-header">
                <div class="stat-icon-wrapper info">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path
                      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                    />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <span>文章总数</span>
              </div>
              <p class="stat-number">{{ articleStats.total || 0 }}</p>
              <div class="stat-comparison neutral">
                已发布 {{ articleStats.published || 0 }} 篇
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-header">
                <div class="stat-icon-wrapper warning">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                </div>
                <span>本月浏览量</span>
              </div>
              <p class="stat-number">{{ statistics.month_views || 0 }}</p>
              <div class="stat-comparison neutral">
                年度 {{ statistics.year_views || 0 }}
              </div>
            </div>
          </section>

          <section class="card trend-section">
            <h3 class="card-header">访客趋势 (最近30天)</h3>
            <div class="trend-summary">
              <div>
                <span>总访客数</span><strong>{{ getTotalVisitors() }}</strong>
              </div>
              <div>
                <span>总浏览量</span><strong>{{ getTotalViews() }}</strong>
              </div>
            </div>
            <div class="trend-chart">
              <div class="chart-bars">
                <div
                  v-for="(trend, index) in statisticsSummary.trend_data.daily"
                  :key="index"
                  class="bar-wrapper"
                >
                  <div
                    class="bar"
                    :style="{ height: getTrendBarHeight(trend.visitors) }"
                  />
                  <div class="bar-tooltip">
                    <strong>{{ trend.visitors }} 访客</strong>
                    <span>{{ trend.date }}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="side-column">
          <section class="card top-pages-section">
            <h3 class="card-header">热门页面 TOP 10</h3>
            <div class="pages-list">
              <div class="list-header">
                <span>页面</span>
                <span>浏览量</span>
                <span>独立访客</span>
                <span>停留时间</span>
                <span>跳出率</span>
              </div>
              <ul>
                <li
                  v-for="page in statisticsSummary.top_pages"
                  :key="page.url_path"
                >
                  <CustomTooltip :content="page.url_path" placement="top">
                    <span class="page-path" :title="page.url_path">{{
                      page.url_path
                    }}</span>
                  </CustomTooltip>
                  <span class="page-views">{{ page.total_views }}</span>
                  <span class="page-unique">{{ page.unique_views }}</span>
                  <span class="page-duration">{{
                    formatDuration(page.avg_duration)
                  }}</span>
                  <span class="page-bounce">{{
                    formatPercentage(page.bounce_rate)
                  }}</span>
                </li>
              </ul>
            </div>
          </section>

          <section class="card analytics-section">
            <h3 class="card-header">访客分析 (最近7天)</h3>
            <div class="analytics-grid">
              <div class="analytics-item">
                <h4>城市</h4>
                <ul>
                  <li
                    v-for="c in statisticsSummary.analytics.top_cities"
                    :key="c.city"
                  >
                    <span>{{ c.city || "未知" }}</span>
                    <span>{{ c.count }}</span>
                  </li>
                </ul>
              </div>
              <div class="analytics-item">
                <h4>浏览器</h4>
                <ul>
                  <li
                    v-for="b in statisticsSummary.analytics.top_browsers"
                    :key="b.browser"
                  >
                    <span>{{ b.browser || "未知" }}</span>
                    <span>{{ b.count }}</span>
                  </li>
                </ul>
              </div>
              <div class="analytics-item">
                <h4>操作系统</h4>
                <ul>
                  <li
                    v-for="os in statisticsSummary.analytics.top_os"
                    :key="os.os"
                  >
                    <span>{{ os.os || "未知" }}</span>
                    <span>{{ os.count }}</span>
                  </li>
                </ul>
              </div>
              <div class="analytics-item">
                <h4>设备</h4>
                <ul>
                  <li
                    v-for="d in statisticsSummary.analytics.top_devices"
                    :key="d.device"
                  >
                    <span>{{ d.device || "未知" }}</span>
                    <span>{{ d.count }}</span>
                  </li>
                </ul>
              </div>
              <div class="analytics-item">
                <h4>来源</h4>
                <ul>
                  <li
                    v-for="r in statisticsSummary.analytics.top_referers"
                    :key="r.referer"
                  >
                    <span>{{ r.referer || "直接访问" }}</span>
                    <span>{{ r.count }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
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
import CustomTooltip from "@/components/CustomTooltip/index.vue";

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
  top_pages: [],
  analytics: {
    top_countries: [],
    top_cities: [],
    top_browsers: [],
    top_os: [],
    top_devices: [],
    top_referers: []
  },
  trend_data: {
    daily: [],
    weekly: [],
    monthly: []
  }
});

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

// 方法
const loadStatistics = async () => {
  try {
    const response = await getStatistics();
    if (response.data) {
      statistics.value = response.data;
    }
  } catch (error) {
    console.error("加载统计数据失败:", error);
  }
};

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
        statisticsSummary.value.analytics = response.data.analytics;
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

const getChangeClass = (current: number, previous: number) => {
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

const formatDuration = (seconds: number) => {
  if (!seconds) return "0秒";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes > 0) {
    return `${minutes}分${remainingSeconds.toFixed(2)}秒`;
  }
  return `${remainingSeconds.toFixed(2)}秒`;
};

const formatPercentage = (value: number) => {
  if (!value) return "0%";
  return `${(value * 100).toFixed(1)}%`;
};

const getTotalVisitors = () => {
  if (!statisticsSummary.value.trend_data.daily.length) return 0;
  return statisticsSummary.value.trend_data.daily.reduce(
    (sum, trend) => sum + trend.visitors,
    0
  );
};

const getTotalViews = () => {
  if (!statisticsSummary.value.trend_data.daily.length) return 0;
  return statisticsSummary.value.trend_data.daily.reduce(
    (sum, trend) => sum + trend.views,
    0
  );
};

const getTrendBarHeight = (visitors: number) => {
  if (!visitors) return "2px";
  const dailyData = statisticsSummary.value.trend_data.daily;
  if (!dailyData || dailyData.length === 0) return "2px";
  const maxVisitors = Math.max(...dailyData.map(t => t.visitors));
  if (maxVisitors === 0) return "2px";
  const height = (visitors / maxVisitors) * 100;
  return `${Math.max(height, 2)}%`;
};

const loadVisitorAnalyticsDirectly = async () => {
  try {
    const response = await getVisitorAnalytics();
    if (response.data) {
      statisticsSummary.value.analytics = response.data;
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
      statisticsSummary.value.analytics = analytics.value.data;
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
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  --bg-color: #f4f7fa;
  --bg-color-alt: #ffffff;
  --text-primary: #1a202c;
  --text-secondary: #718096;
  --border-color: #e2e8f0;
  --accent-primary: #4a5568;
  --accent-primary-light: #e2e8f0;
  --accent-success: #38a169;
  --accent-success-light: #c6f6d5;
  --accent-info: #3182ce;
  --accent-info-light: #bee3f8;
  --accent-warning: #dd6b20;
  --accent-warning-light: #feebc8;
  --color-positive: #38a169;
  --color-negative: #e53e3e;
  --color-neutral: #718096;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.loading-overlay,
.error-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  z-index: 100;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 5px solid var(--accent-primary-light);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-card {
  text-align: center;
  background-color: var(--bg-color-alt);
  padding: 2.5rem;
  border-radius: 1rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
  margin: 1rem;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-card h3 {
  color: var(--text-primary);
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.error-card p {
  margin-bottom: 1.5rem;
}

.retry-btn {
  background-color: var(--accent-primary);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background-color: #2d3748;
}

.dashboard-header {
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.dashboard-header p {
  font-size: 1rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(320px, 400px) 1fr;
  grid-template-rows: auto;
  gap: 1.5rem;
}

.main-column {
  grid-column: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.side-column {
  grid-column: 2;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-width: 0;
}

.card {
  background-color: var(--bg-color-alt);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  transition: all 0.2s ease-in-out;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.card-header {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1.5rem 0;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background-color: var(--bg-color-alt);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  transition: all 0.2s ease-in-out;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: 1rem;
}

.stat-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stat-icon-wrapper.primary {
  background-color: var(--accent-primary-light);
  color: var(--accent-primary);
}
.stat-icon-wrapper.success {
  background-color: var(--accent-success-light);
  color: var(--accent-success);
}
.stat-icon-wrapper.info {
  background-color: var(--accent-info-light);
  color: var(--accent-info);
}
.stat-icon-wrapper.warning {
  background-color: var(--accent-warning-light);
  color: var(--accent-warning);
}
.stat-icon-wrapper svg {
  width: 20px;
  height: 20px;
}

.stat-number {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.stat-comparison {
  font-size: 0.875rem;
  font-weight: 500;
  margin-top: 0.25rem;
}
.stat-comparison.positive {
  color: var(--color-positive);
}
.stat-comparison.negative {
  color: var(--color-negative);
}
.stat-comparison.neutral {
  color: var(--color-neutral);
}

.trend-summary {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.trend-summary > div {
  display: flex;
  flex-direction: column;
}

.trend-summary span {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.trend-summary strong {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.trend-chart {
  height: 200px;
}
.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 100%;
}
.bar-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: 100%;
}
.bar {
  width: 100%;
  background-color: var(--accent-primary-light);
  border-radius: 4px;
  transition:
    background-color 0.2s,
    height 0.3s ease-out;
}
.bar-wrapper:hover .bar {
  background-color: var(--accent-primary);
}
.bar-tooltip {
  position: absolute;
  bottom: 110%;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--text-primary);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.2s,
    visibility 0.2s;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.bar-tooltip::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 5px;
  border-style: solid;
  border-color: var(--text-primary) transparent transparent transparent;
}
.bar-wrapper:hover .bar-tooltip {
  opacity: 1;
  visibility: visible;
}
.bar-tooltip strong {
  font-weight: 600;
}
.bar-tooltip span {
  font-size: 0.625rem;
  color: #a0aec0;
}

.top-pages-section {
  overflow-x: auto;
}

.pages-list .list-header {
  display: grid;
  grid-template-columns: minmax(300px, 1fr) repeat(4, 110px);
  gap: 1rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0 0.5rem 0.75rem;
  border-bottom: 1px solid var(--border-color);
}
.pages-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.pages-list li {
  display: grid;
  grid-template-columns: minmax(300px, 1fr) repeat(4, 110px);
  gap: 1rem;
  align-items: center;
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid var(--border-color);
  font-size: 0.875rem;
}
.pages-list li:last-child {
  border-bottom: none;
}
.page-path {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  color: var(--text-primary);
  width: 100%;
  display: block;
  min-width: 0;
}
.page-views {
  font-weight: 600;
  color: var(--text-primary);
  text-align: right;
}

.page-unique,
.page-duration,
.page-bounce {
  text-align: right;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem 1.5rem;
}

.analytics-item h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.75rem 0;
}

.analytics-item ul {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.analytics-item li {
  display: flex;
  justify-content: space-between;
  color: var(--text-secondary);
}

.analytics-item li span:first-child {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 0.5rem;
}
.analytics-item li span:last-child {
  font-weight: 500;
  color: var(--text-primary);
}

@media (max-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  .main-column,
  .side-column {
    grid-column: span 1;
  }
}

@media (max-width: 768px) {
  .dashboard-header h1 {
    font-size: 1.5rem;
  }
  .card {
    padding: 1rem;
  }
  .card-header {
    font-size: 1rem;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
  }
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .top-pages-section {
    overflow-x: visible;
  }
  .pages-list .list-header {
    display: none;
  }
  .pages-list ul {
    margin-top: -1rem;
  }
  .pages-list li {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    margin-bottom: 1rem;
    padding: 1rem;
    box-shadow: none;
  }
  .pages-list li:last-child {
    margin-bottom: 0;
  }
  .page-path {
    font-weight: 600;
    margin-bottom: 0.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-color);
  }

  .page-views,
  .page-unique,
  .page-duration,
  .page-bounce {
    display: flex;
    justify-content: space-between;
    width: 100%;
    text-align: right;
  }

  .page-views::before,
  .page-unique::before,
  .page-duration::before,
  .page-bounce::before {
    color: var(--text-secondary);
    text-align: left;
  }

  .page-views::before {
    content: "浏览量";
  }
  .page-unique::before {
    content: "独立访客";
  }
  .page-duration::before {
    content: "停留时间";
  }
  .page-bounce::before {
    content: "跳出率";
  }
}
</style>
