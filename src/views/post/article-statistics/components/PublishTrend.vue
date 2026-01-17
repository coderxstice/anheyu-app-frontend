<!--
 * @Description: 发布趋势折线图
 * @Author: 安知鱼
 * @Date: 2026-01-17
-->
<script setup lang="ts">
import { ref, onMounted, watch, shallowRef, onUnmounted } from "vue";
import type { PublishTrendItem } from "@/api/post/type";

interface Props {
  data: PublishTrendItem[];
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

  window.addEventListener("resize", handleResize);
};

const handleResize = () => {
  chartInstance.value?.resize();
};

const renderChart = () => {
  if (!chartInstance.value) return;

  // 防御性检查：确保 data 是数组
  const safeData = Array.isArray(props.data) ? props.data : [];

  // 反转数据，让最新的在右边
  const reversedData = [...safeData].reverse();

  const months = reversedData.map(item => {
    // 将 "2025-01" 格式转换为 "1月"
    const [, month] = item.month.split("-");
    return `${parseInt(month)}月`;
  });

  const counts = reversedData.map(item => item.count);

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
        label: {
          backgroundColor: "#6a7985"
        }
      }
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: "10%",
      containLabel: true
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: months.length > 0 ? months : ["暂无数据"],
      axisLine: {
        lineStyle: {
          color: "var(--anzhiyu-secondtext)"
        }
      },
      axisLabel: {
        color: "var(--anzhiyu-secondtext)"
      }
    },
    yAxis: {
      type: "value",
      splitLine: {
        lineStyle: {
          color: "var(--anzhiyu-card-border)",
          type: "dashed"
        }
      },
      axisLabel: {
        color: "var(--anzhiyu-secondtext)"
      }
    },
    series: [
      {
        name: "发布文章数",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 8,
        lineStyle: {
          width: 3,
          color: "#3b82f6"
        },
        itemStyle: {
          color: "#3b82f6"
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(59, 130, 246, 0.3)" },
              { offset: 1, color: "rgba(59, 130, 246, 0.05)" }
            ]
          }
        },
        data: counts.length > 0 ? counts : [0]
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

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  chartInstance.value?.dispose();
});
</script>

<template>
  <div class="publish-trend-container">
    <div v-if="isLoading" class="chart-loading">
      <div class="loading-spinner" />
    </div>
    <div ref="chartRef" class="chart" />
  </div>
</template>

<style lang="scss" scoped>
.publish-trend-container {
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
