<script lang="ts" setup>
import type { EchartsUIType } from "@/plugins/echarts";
import { onMounted, ref, watch } from "vue";
import { EchartsUI, useEcharts } from "@/plugins/echarts";

interface BrowserData {
  browser: string;
  count: number;
}

interface Props {
  data?: BrowserData[];
}

const props = withDefaults(defineProps<Props>(), {
  data: () => []
});

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

const renderChart = () => {
  const chartData = props.data.slice(0, 6).map(item => ({
    name: item.browser || "未知",
    value: item.count
  }));

  renderEcharts({
    series: [
      {
        animationDelay() {
          return Math.random() * 400;
        },
        animationEasing: "exponentialInOut",
        animationType: "scale",
        center: ["50%", "50%"],
        color: ["#5ab1ef", "#b6a2de", "#67e0e3", "#2ec7c9", "#ffb980", "#d87a80"],
        data:
          chartData.length > 0
            ? chartData.sort((a, b) => a.value - b.value)
            : [{ name: "暂无数据", value: 1 }],
        name: "浏览器占比",
        radius: "75%",
        roseType: "radius",
        type: "pie"
      }
    ],
    tooltip: {
      trigger: "item"
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
  <EchartsUI ref="chartRef" height="280px" />
</template>

