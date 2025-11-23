<template>
  <div>
    <Transition
      name="search-overlay"
      :css="false"
      @enter="onEnter"
      @leave="onLeave"
    >
      <div v-if="visible" class="search-overlay" @click="handleOverlayClick">
        <div class="search-box">
          <el-input
            ref="searchInputRef"
            v-model="query"
            placeholder="搜索您的所有文件..."
            clearable
            size="large"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="search-results" />
        <el-icon class="close-icon" @click="close"><CloseBold /></el-icon>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import { Search, CloseBold } from "@element-plus/icons-vue";
import gsap from "gsap";

const props = defineProps<{
  visible: boolean;
  origin: { x: number; y: number };
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const query = ref("");
const searchInputRef = ref(null);

watch(
  () => props.visible,
  newVal => {
    if (newVal) {
      nextTick(() => {
        searchInputRef.value?.focus();
      });
    }
  }
);

const close = () => {
  emit("close");
};

/**
 * 处理遮罩层背景点击事件
 */
const handleOverlayClick = (event: MouseEvent) => {
  // 如果点击的目标就是事件绑定的目标本身（即背景），则关闭
  if (event.target === event.currentTarget) {
    close();
  }
};

// GSAP 动画
const onEnter = (el: HTMLElement, done: () => void) => {
  const { x, y } = props.origin;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  gsap.fromTo(
    el,
    { clipPath: `circle(0px at ${x}px ${y}px)` },
    {
      clipPath: `circle(${radius}px at ${x}px ${y}px)`,
      duration: 0.5,
      ease: "power3.inOut",
      onComplete: done
    }
  );
};

const onLeave = (el: HTMLElement, done: () => void) => {
  const { x, y } = props.origin;
  gsap.to(el, {
    clipPath: `circle(0px at ${x}px ${y}px)`,
    duration: 0.4,
    ease: "power3.inOut",
    onComplete: done
  });
};
</script>

<style scoped lang="scss">
.search-overlay {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 2050;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100vw;
  height: 100vh;
  padding-top: 15vh;

  /* [!修改] 为背景添加可点击的光标样式 */
  cursor: pointer;
  background-color: rgb(255 255 255 / 90%);
  backdrop-filter: blur(10px);
}

.search-box {
  width: 100%;
  max-width: 600px;
  cursor: default;
}

.close-icon {
  position: absolute;
  top: 40px;
  right: 40px;
  font-size: 24px;
  color: var(--anzhiyu-secondtext);
  cursor: pointer;

  &:hover {
    color: var(--anzhiyu-theme);
  }
}

:deep(.el-input__wrapper) {
  padding: 4px 20px;
  border-radius: 24px !important;
  box-shadow: 0 4px 20px rgb(0 0 0 / 10%) !important;
}

:deep(.el-input__prefix .el-icon) {
  font-size: 20px;
}
</style>
