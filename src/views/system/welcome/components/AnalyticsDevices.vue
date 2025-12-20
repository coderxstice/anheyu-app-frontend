<script lang="ts" setup>
import type { EchartsUIType } from "@/plugins/echarts";
import { onMounted, ref, watch } from "vue";
import { EchartsUI, useEcharts } from "@/plugins/echarts";

interface DeviceData {
  browser?: string;
  os?: string;
  device?: string;
  count: number;
}

interface Props {
  browsers?: DeviceData[];
  os?: DeviceData[];
  devices?: DeviceData[];
}

const props = withDefaults(defineProps<Props>(), {
  browsers: () => [],
  os: () => [],
  devices: () => []
});

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

const renderChart = () => {
  // 获取浏览器数据
  const browserData = props.browsers.slice(0, 5).map(item => ({
    name: item.browser || "未知",
    value: item.count
  }));

  // 获取操作系统数据
  const osData = props.os.slice(0, 5).map(item => ({
    name: item.os || "未知",
    value: item.count
  }));

  // 获取设备数据
  const deviceData = props.devices.slice(0, 5).map(item => ({
    name: item.device || "未知",
    value: item.count
  }));

  // 合并所有数据用于雷达图
  const allNames = [
    ...browserData.map(d => d.name),
    ...osData.map(d => d.name),
    ...deviceData.map(d => d.name)
  ].slice(0, 6);

  const indicator = allNames.map(name => ({
    name
  }));

  // 计算各类数据的值
  const values1 = allNames.map((_, index) => {
    if (index < browserData.length) return browserData[index]?.value || 0;
    return 0;
  });

  const values2 = allNames.map((_, index) => {
    if (index < osData.length) return osData[index]?.value || 0;
    return 0;
  });

  renderEcharts({
    legend: {
      bottom: 0,
      data: ["浏览器", "操作系统"]
    },
    radar: {
      indicator:
        indicator.length > 0
          ? indicator
          : [{ name: "网页" }, { name: "移动端" }, { name: "其他" }],
      radius: "55%",
      splitNumber: 4
    },
    series: [
      {
        areaStyle: {
          opacity: 0.3
        },
        data: [
          {
            itemStyle: {
              color: "#b6a2de"
            },
            name: "浏览器",
            value: values1.length > 0 ? values1 : [0, 0, 0]
          },
          {
            itemStyle: {
              color: "#5ab1ef"
            },
            name: "操作系统",
            value: values2.length > 0 ? values2 : [0, 0, 0]
          }
        ],
        itemStyle: {
          borderRadius: 10,
          borderWidth: 2
        },
        symbolSize: 0,
        type: "radar"
      }
    ],
    tooltip: {}
  });
};

onMounted(() => {
  renderChart();
});

watch(
  () => [props.browsers, props.os, props.devices],
  () => {
    renderChart();
  },
  { deep: true }
);
</script>

<template>
  <EchartsUI ref="chartRef" height="280px" />
</template>

