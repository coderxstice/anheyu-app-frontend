<script lang="ts" setup>
import type { EchartsUIType } from "@/plugins/echarts";
import { onMounted, ref, watch } from "vue";
import { EchartsUI, useEcharts } from "@/plugins/echarts";

interface SourceData {
  referer: string;
  count: number;
}

interface Props {
  data?: SourceData[];
}

const props = withDefaults(defineProps<Props>(), {
  data: () => []
});

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

// 解析并格式化 referer 名称
const formatRefererName = (referer: string): string => {
  if (!referer) return "直接访问";

  try {
    // 尝试解码 URL 编码的字符串
    const decoded = decodeURIComponent(referer);

    // 尝试提取域名
    try {
      const url = new URL(
        decoded.startsWith("http") ? decoded : `https://${decoded}`
      );
      return url.hostname.replace(/^www\./, "");
    } catch {
      // 如果不是有效 URL，截取前20个字符
      return decoded.length > 20 ? decoded.substring(0, 20) + "..." : decoded;
    }
  } catch {
    // 解码失败，截取显示
    return referer.length > 20 ? referer.substring(0, 20) + "..." : referer;
  }
};

const renderChart = () => {
  const chartData = props.data.slice(0, 6).map(item => ({
    name: formatRefererName(item.referer),
    value: item.count
  }));

  renderEcharts({
    legend: {
      bottom: "2%",
      left: "center"
    },
    series: [
      {
        animationDelay() {
          return Math.random() * 100;
        },
        animationEasing: "exponentialInOut",
        animationType: "scale",
        avoidLabelOverlap: false,
        color: [
          "#5ab1ef",
          "#b6a2de",
          "#67e0e3",
          "#2ec7c9",
          "#ffb980",
          "#d87a80"
        ],
        data:
          chartData.length > 0 ? chartData : [{ name: "暂无数据", value: 1 }],
        emphasis: {
          label: {
            fontSize: "12",
            fontWeight: "bold",
            show: true
          }
        },
        itemStyle: {
          borderRadius: 10,
          borderWidth: 2
        },
        label: {
          position: "center",
          show: false
        },
        labelLine: {
          show: false
        },
        name: "访问来源",
        radius: ["40%", "65%"],
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
