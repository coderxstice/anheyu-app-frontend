<script setup lang="ts">
import { ref, computed } from "vue";

defineOptions({
  name: "CardWebInfo"
});

// 1. 更新 props 定义，添加 launch_time
const props = defineProps({
  config: {
    type: Object,
    required: true,
    default: () => ({
      postCountEnable: false,
      runtimeEnable: false,
      wordCountEnable: false,
      launch_time: null
    })
  }
});

// 网站的静态具体数据
const webInfo = ref({
  posts: 70,
  words: "218.3k"
});

// 2. 添加 computed 属性来动态计算建站天数
const runningDays = computed(() => {
  if (!props.config.launch_time) {
    return 0;
  }
  try {
    // 解析 "MM/DD/YYYY HH:mm:ss" 格式的日期
    const launchDate = new Date(props.config.launch_time);
    const currentDate = new Date();
    // 计算两个日期之间的毫秒差
    const differenceInTime = currentDate.getTime() - launchDate.getTime();
    // 将毫秒差转换为天数并向下取整
    const differenceInDays = differenceInTime / (1000 * 3600 * 24);
    return Math.floor(differenceInDays);
  } catch (error) {
    console.error("Invalid launch_time format:", props.config.launch_time);
    return 0;
  }
});
</script>

<template>
  <div class="card-webinfo">
    <div class="card-content">
      <div class="webinfo">
        <div v-if="config.postCountEnable" class="webinfo-item">
          <div class="webinfo-item-title">
            <i class="anzhiyufont anzhiyu-icon-file-lines" />
            <div class="item-name">文章总数 :</div>
          </div>
          <div class="item-count">{{ webInfo.posts }}</div>
        </div>

        <div v-if="config.runtimeEnable" class="webinfo-item">
          <div class="webinfo-item-title">
            <i class="anzhiyufont anzhiyu-icon-stopwatch" />
            <div class="item-name">建站天数 :</div>
          </div>
          <!-- 3. 使用计算出的 runningDays -->
          <div class="item-count">{{ runningDays }} 天</div>
        </div>

        <div v-if="config.wordCountEnable" class="webinfo-item">
          <div class="webinfo-item-title">
            <i class="anzhiyufont anzhiyu-icon-font" />
            <div class="item-name">全站字数 :</div>
          </div>
          <div class="item-count">{{ webInfo.words }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.webinfo {
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
    text-align: center;
    margin-right: 4px;
  }
}
</style>
