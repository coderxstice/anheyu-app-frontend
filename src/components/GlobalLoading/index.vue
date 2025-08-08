<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useLoadingStore } from "@/store/modules/loadingStore";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

const loadingStore = useLoadingStore();
const siteConfigStore = useSiteConfigStore();

const avatarUrl = computed(() => siteConfigStore.getSiteConfig?.USER_AVATAR);
const isClickable = ref(false);
let clickTimer: number | null = null;

const forceClose = () => {
  if (isClickable.value) {
    loadingStore.stopLoading();
  }
};

watch(
  () => loadingStore.isLoading,
  isLoading => {
    if (isLoading) {
      // 1. 重置状态
      isClickable.value = false;
      if (clickTimer) clearTimeout(clickTimer);

      // 2. 启动2秒计时器
      clickTimer = window.setTimeout(() => {
        // 3. 2秒后，检查加载状态是否仍然为 true
        if (loadingStore.isLoading) {
          isClickable.value = true;
        }
      }, 2000);
    } else {
      // 加载正常结束时，清理计时器，防止它在后台继续运行
      if (clickTimer) clearTimeout(clickTimer);
    }
  }
);
</script>

<template>
  <transition name="fade">
    <div v-if="loadingStore.isLoading" class="loading-box">
      <div class="loading-bg">
        <img
          v-if="avatarUrl"
          class="loading-img nolazyload"
          alt="加载头像"
          :src="avatarUrl"
          :class="{ clickable: isClickable }"
          @click="forceClose"
        />
        <div class="loading-image-dot" />
      </div>
    </div>
  </transition>
</template>

<style lang="scss" scoped>
.loading-box {
  user-select: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1001;
  overflow: hidden;

  .loading-bg {
    display: flex;
    width: 100%;
    height: 100%;
    position: relative; // 改为 relative 以便定位小圆点
    background: var(--anzhiyu-card-bg);
    transition: opacity 0.3s;
  }
}

.loading-img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin: auto; // 使其在 flex 容器中居中
  border: 4px solid #f0f0f2;
  animation-name: loadingAction;
  animation-duration: 0.8s; // 让呼吸效果更柔和
  animation-iteration-count: infinite;
  animation-direction: alternate;

  &.clickable {
    cursor: pointer;
  }
}

.loading-image-dot {
  width: 30px;
  height: 30px;
  background: #6bdf8f;
  position: absolute;
  border-radius: 50%;
  border: 6px solid var(--anzhiyu-card-bg);
  top: 50%;
  left: 50%;
  // 精确调整位置，使其在 100px 的头像右下角
  // (头像半径50 - 小圆点半径15 + 边框等偏移)
  transform: translate(24px, 24px);
}

@keyframes loadingAction {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0.6;
    transform: scale(0.95);
  }
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
