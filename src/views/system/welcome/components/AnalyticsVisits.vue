<script lang="ts" setup>
import type { EchartsUIType } from "@/plugins/echarts";
import { onMounted, ref, watch } from "vue";
import { EchartsUI, useEcharts } from "@/plugins/echarts";

interface TrendData {
  date: string;
  visitors: number;
  views: number;
}

interface Props {
  data?: TrendData[];
}

const props = withDefaults(defineProps<Props>(), {
  data: () => []
});

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

const renderChart = () => {
  // 按月份汇总数据
  const monthlyData = new Map<string, number>();

  props.data.forEach(item => {
    const date = new Date(item.date);
    const monthKey = `${date.getMonth() + 1}月`;
    const current = monthlyData.get(monthKey) || 0;
    monthlyData.set(monthKey, current + item.views);
  });

  const months = Array.from(monthlyData.keys());
  const views = Array.from(monthlyData.values());

  renderEcharts({
    grid: {
      bottom: 30,
      containLabel: true,
      left: "1%",
      right: "1%",
      top: 20
    },
    series: [
      {
        barMaxWidth: 60,
        data: views,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: "#3b82f6"
        },
        type: "bar"
      }
    ],
    tooltip: {
      axisPointer: {
        lineStyle: {
          width: 1
        }
      },
      trigger: "axis"
    },
    xAxis: {
      data: months.length > 0 ? months : ["暂无数据"],
      type: "category"
    },
    yAxis: {
      splitNumber: 4,
      type: "value"
    }
  });
};

onMounted(() => {
  renderChart();
});

watch(
  () => props.data,
  () => {
    renderChart();
  }
);
</script>

<template>
  <EchartsUI ref="chartRef" height="350px" />
</template>
