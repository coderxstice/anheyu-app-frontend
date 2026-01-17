<!--
 * @Description: 分类分布饼图
 * @Author: 安知鱼
 * @Date: 2026-01-17
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, shallowRef } from "vue";
import type { CategoryStatItem } from "@/api/post/type";

interface Props {
  data: CategoryStatItem[];
}

const props = withDefaults(defineProps<Props>(), {
  data: () => []
});

const chartRef = ref<HTMLDivElement>();
const chartInstance = shallowRef<any>(null);
const isLoading = ref(true);

// 动态加载 ECharts
const loadEcharts = async () => {
  try {
    const echarts = await import("@/plugins/echarts/echarts");
    return echarts.default;
  } catch (error) {
    console.error("加载 ECharts 失败:", error);
    return null;
  }
};

const initChart = async () => {
  if (!chartRef.value) return;

  const echarts = await loadEcharts();
  if (!echarts) {
    isLoading.value = false;
    return;
  }

  chartInstance.value = echarts.init(chartRef.value);
  renderChart();
  isLoading.value = false;

  // 监听窗口大小变化
  window.addEventListener("resize", handleResize);
};

const handleResize = () => {
  chartInstance.value?.resize();
};

const renderChart = () => {
  if (!chartInstance.value) return;

  // 防御性检查：确保 data 是数组
  const safeData = Array.isArray(props.data) ? props.data : [];
  const chartData = safeData.slice(0, 8).map(item => ({
    name: item.name || "未分类",
    value: item.count
  }));

  const option = {
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)"
    },
    legend: {
      orient: "vertical",
      left: "left",
      top: "center",
      textStyle: {
        color: "var(--anzhiyu-fontcolor)"
      }
    },
    series: [
      {
        name: "分类分布",
        type: "pie",
        radius: ["40%", "70%"],
        center: ["60%", "50%"],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: "var(--anzhiyu-card-bg)",
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: "bold"
          }
        },
        labelLine: {
          show: false
        },
        data:
          chartData.length > 0 ? chartData : [{ name: "暂无数据", value: 1 }],
        color: [
          "#3b82f6",
          "#10b981",
          "#f59e0b",
          "#8b5cf6",
          "#ef4444",
          "#06b6d4",
          "#ec4899",
          "#84cc16"
        ]
      }
    ]
  };

  chartInstance.value.setOption(option);
};

watch(
  () => props.data,
  () => {
    renderChart();
  }
);

onMounted(() => {
  initChart();
});

// 清理
onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  chartInstance.value?.dispose();
});
</script>

<template>
  <div class="category-chart-container">
    <div v-if="isLoading" class="chart-loading">
      <div class="loading-spinner" />
    </div>
    <div ref="chartRef" class="chart" />
  </div>
</template>

<style lang="scss" scoped>
.category-chart-container {
  position: relative;
  width: 100%;
  height: 280px;
}

.chart {
  width: 100%;
  height: 100%;
}

.chart-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--anzhiyu-card-bg);
}

.loading-spinner {
  width: 32px;
  height: 32px;
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
</style>
