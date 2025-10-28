<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-05 18:27:55
 * @LastEditTime: 2025-10-28 10:12:21
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { computed } from "vue";

defineOptions({
  name: "CardWebInfo"
});

// 1. 更新 props 定义以匹配新的参数名和默认值
const props = defineProps({
  config: {
    type: Object,
    required: true,
    default: () => ({
      // -1 代表不开启
      totalPostCount: -1,
      runtimeEnable: false,
      // -1 代表不开启
      totalWordCount: -1,
      launch_time: null
    })
  }
});

const runningDays = computed(() => {
  if (!props.config.launch_time) {
    return 0;
  }
  try {
    const launchDate = new Date(props.config.launch_time);
    const currentDate = new Date();
    const differenceInTime = currentDate.getTime() - launchDate.getTime();
    const differenceInDays = differenceInTime / (1000 * 3600 * 24);
    return Math.floor(differenceInDays);
  } catch (error) {
    console.error("Invalid launch_time format:", props.config.launch_time);
    return 0;
  }
});

const formattedWordCount = computed(() => {
  const count = props.config.totalWordCount;
  if (count === -1 || count === 0) {
    return "0";
  }
  if (count < 1000) {
    return count.toString();
  }
  return (count / 1000).toFixed(1) + "k";
});
</script>

<template>
  <div class="card-webinfo">
    <div class="card-content">
      <div class="webinfo">
        <div v-if="config.totalPostCount !== -1" class="webinfo-item">
          <div class="webinfo-item-title">
            <i class="anzhiyufont anzhiyu-icon-file-lines" />
            <div class="item-name">文章总数 :</div>
          </div>
          <div class="item-count">{{ config.totalPostCount }}</div>
        </div>

        <div v-if="config.runtimeEnable" class="webinfo-item">
          <div class="webinfo-item-title">
            <i class="anzhiyufont anzhiyu-icon-stopwatch" />
            <div class="item-name">建站天数 :</div>
          </div>
          <div class="item-count">{{ runningDays }} 天</div>
        </div>

        <div v-if="config.totalWordCount !== -1" class="webinfo-item">
          <div class="webinfo-item-title">
            <i class="anzhiyufont anzhiyu-icon-font" />
            <div class="item-name">全站字数 :</div>
          </div>
          <div class="item-count">{{ formattedWordCount }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.webinfo {
  min-height: 5.4rem;
  padding: 0.2rem 0;
}

.webinfo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 0.9rem;
}

.webinfo-item-title {
  display: flex;
  align-items: center;
  color: var(--anzhiyu-fontcolor);

  i {
    width: 1.5em;
    margin-right: 4px;
    text-align: center;
  }
}
</style>
