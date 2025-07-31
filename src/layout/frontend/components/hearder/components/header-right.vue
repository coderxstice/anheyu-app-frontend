<template>
  <div class="header-right">
    <el-tooltip
      v-if="navConfig?.travelling"
      content="随机前往一个开往项目网站"
      placement="top"
      :show-arrow="false"
      :offset="8"
    >
      <a class="nav-button" @click="handleTravelClick">
        <i class="anzhiyufont anzhiyu-icon-train" />
      </a>
    </el-tooltip>
    <el-tooltip
      content="随机前往一个文章"
      placement="top"
      :show-arrow="false"
      :offset="8"
    >
      <a class="nav-button">
        <i class="anzhiyufont anzhiyu-icon-dice" />
      </a>
    </el-tooltip>
    <el-tooltip content="搜索" placement="top" :show-arrow="false" :offset="8">
      <a class="nav-button">
        <i class="anzhiyufont anzhiyu-icon-magnifying-glass" />
      </a>
    </el-tooltip>

    <!-- TODO: 控制台+滚动球 -->
  </div>
</template>

<script setup lang="ts">
import type { PropType } from "vue";
import { useSnackbar } from "@/composables/useSnackbar";

defineOptions({
  name: "HeaderRight"
});

defineProps({
  navConfig: {
    type: Object as PropType<any>,
    required: false
  }
});

const { showSnackbar } = useSnackbar();

let travellingsTimer: ReturnType<typeof setTimeout> | null = null;

const handleTravelClick = () => {
  if (travellingsTimer) {
    clearTimeout(travellingsTimer);
  }
  const cancelAction = () => {
    if (travellingsTimer) {
      clearTimeout(travellingsTimer);
      showSnackbar("跳转已取消");
    }
  };

  // 调用 Snackbar
  showSnackbar(
    "即将跳转到「开往」项目的成员博客，不保证跳转网站的安全性和可用性",
    cancelAction,
    5000,
    "取消"
  );

  // 设置一个5秒后执行的定时器，用于打开新页面
  travellingsTimer = setTimeout(() => {
    window.open("https://www.travellings.cn/go.html", "_blank");
  }, 5000);
};
</script>

<style scoped lang="scss">
.header-right {
  z-index: 102;
  position: absolute;
  right: 0;
  display: flex;
  flex-direction: row;
  height: 100%;
  align-items: center;
  padding-right: 1.5rem;

  .nav-button {
    margin-left: 1rem;
    padding: 0;
    border-radius: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: 0.3s;
    height: 35px;
    width: 35px;
    cursor: pointer;
    i {
      font-size: 1.2rem;
      transition: color 0.3s;
      font-weight: 700;
    }

    &:hover {
      color: var(--anzhiyu-white);
      box-shadow: var(--anzhiyu-shadow-main);
      background: var(--anzhiyu-lighttext);
    }
  }
}
</style>
