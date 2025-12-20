<script lang="ts" setup>
import type { EchartsUIType } from "@/plugins/echarts";
import { onMounted, ref, watch } from "vue";
import { EchartsUI, useEcharts } from "@/plugins/echarts";

interface OSData {
  os: string;
  count: number;
}

interface Props {
  data?: OSData[];
}

const props = withDefaults(defineProps<Props>(), {
  data: () => []
});

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

const renderChart = () => {
  const chartData = props.data.slice(0, 6).map(item => ({
    name: item.os || "未知",
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
        color: [
          "#3b82f6",
          "#60a5fa",
          "#93c5fd",
          "#bfdbfe",
          "#dbeafe",
          "#eff6ff"
        ],
        data:
          chartData.length > 0
            ? chartData.sort((a, b) => a.value - b.value)
            : [{ name: "暂无数据", value: 1 }],
        name: "操作系统占比",
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
