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
  const dates = props.data.map(item => {
    const date = new Date(item.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });
  const visitors = props.data.map(item => item.visitors);
  const views = props.data.map(item => item.views);

  renderEcharts({
    grid: {
      bottom: 30,
      containLabel: true,
      left: "1%",
      right: "1%",
      top: 40
    },
    legend: {
      data: ["访客数", "浏览量"],
      top: 0
    },
    series: [
      {
        areaStyle: {
          opacity: 0.3
        },
        data: visitors,
        itemStyle: {
          color: "#3b82f6"
        },
        name: "访客数",
        smooth: true,
        type: "line"
      },
      {
        areaStyle: {
          opacity: 0.3
        },
        data: views,
        itemStyle: {
          color: "#60a5fa"
        },
        name: "浏览量",
        smooth: true,
        type: "line"
      }
    ],
    tooltip: {
      axisPointer: {
        lineStyle: {
          color: "#3b82f6",
          width: 1
        }
      },
      trigger: "axis"
    },
    xAxis: {
      axisTick: {
        show: false
      },
      boundaryGap: false,
      data: dates,
      splitLine: {
        lineStyle: {
          type: "dashed"
        },
        show: true
      },
      type: "category"
    },
    yAxis: [
      {
        axisTick: {
          show: false
        },
        splitArea: {
          show: false
        },
        splitNumber: 4,
        type: "value"
      }
    ]
  });
};

onMounted(() => {
  if (props.data.length > 0) {
    renderChart();
  }
});

watch(
  () => props.data,
  () => {
    if (props.data.length > 0) {
      renderChart();
    }
  }
);
</script>

<template>
  <EchartsUI ref="chartRef" height="350px" />
</template>
