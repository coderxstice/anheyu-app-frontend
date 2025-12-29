<template>
  <Teleport to="body">
    <div v-if="modelValue" class="an-dialog-wrapper">
      <div
        ref="overlayRef"
        class="dialog-overlay"
        @mousedown="handleOverlayMouseDown"
        @mouseup="handleOverlayMouseUp"
      >
        <div
          ref="dialogRef"
          class="dialog-container"
          :class="containerClass"
          :style="containerStyle"
          @click.stop
        >
          <!-- 头部 -->
          <div v-if="!hideHeader" class="dialog-header">
            <slot name="header">
              <h3 class="dialog-title">{{ title }}</h3>
            </slot>
            <button
              v-if="showClose"
              class="close-btn"
              :aria-label="closeText"
              @click="handleClose"
            >
              <i class="anzhiyufont anzhiyu-icon-xmark" />
            </button>
          </div>

          <!-- 内容 -->
          <div class="dialog-content" :class="contentClass">
            <slot />
          </div>

          <!-- 底部 -->
          <div
            v-if="!hideFooter && (showFooter || $slots.footer)"
            class="dialog-footer"
          >
            <slot name="footer">
              <el-button @click="handleClose">{{ cancelText }}</el-button>
              <el-button
                class="confirm-btn"
                type="primary"
                :loading="confirmLoading"
                :disabled="confirmDisabled"
                @click="handleConfirm"
              >
                {{ confirmText }}
              </el-button>
            </slot>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from "vue";
import { gsap } from "gsap";

interface Props {
  modelValue: boolean;
  title?: string;
  width?: string | number;
  maxWidth?: string | number;
  maxHeight?: string | number;
  showClose?: boolean;
  closeOnClickModal?: boolean;
  closeOnPressEscape?: boolean;
  hideHeader?: boolean;
  hideFooter?: boolean;
  showFooter?: boolean;
  confirmText?: string;
  cancelText?: string;
  closeText?: string;
  confirmLoading?: boolean;
  confirmDisabled?: boolean;
  containerClass?: string | string[] | Record<string, boolean>;
  contentClass?: string | string[] | Record<string, boolean>;
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  width: "580px",
  maxWidth: "95vw",
  maxHeight: "85vh",
  showClose: true,
  closeOnClickModal: true,
  closeOnPressEscape: true,
  hideHeader: false,
  hideFooter: false,
  showFooter: false,
  confirmText: "确定",
  cancelText: "取消",
  closeText: "关闭",
  confirmLoading: false,
  confirmDisabled: false
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "open"): void;
  (e: "opened"): void;
  (e: "close"): void;
  (e: "closed"): void;
  (e: "confirm"): void;
}>();

const overlayRef = ref<HTMLElement>();
const dialogRef = ref<HTMLElement>();

const containerStyle = computed(() => ({
  width: typeof props.width === "number" ? `${props.width}px` : props.width,
  maxWidth:
    typeof props.maxWidth === "number" ? `${props.maxWidth}px` : props.maxWidth,
  maxHeight:
    typeof props.maxHeight === "number"
      ? `${props.maxHeight}px`
      : props.maxHeight
}));

// GSAP 动画
const openDialog = () => {
  if (!dialogRef.value || !overlayRef.value) return;

  const dialog = dialogRef.value;
  const overlay = overlayRef.value;

  emit("open");

  gsap.set(overlay, { opacity: 0 });
  gsap.set(dialog, {
    scale: 0.95,
    y: 10,
    opacity: 0,
    force3D: true
  });

  const tl = gsap.timeline({
    onComplete: () => emit("opened")
  });

  tl.to(overlay, {
    opacity: 1,
    duration: 0.2,
    ease: "power2.out"
  }).to(
    dialog,
    {
      scale: 1,
      y: 0,
      opacity: 1,
      duration: 0.25,
      ease: "power2.out",
      force3D: true
    },
    "-=0.1"
  );
};

const closeDialog = () => {
  if (!dialogRef.value || !overlayRef.value) return;

  const dialog = dialogRef.value;
  const overlay = overlayRef.value;

  emit("close");

  const tl = gsap.timeline({
    onComplete: () => {
      emit("update:modelValue", false);
      emit("closed");
    }
  });

  tl.to(dialog, {
    scale: 0.95,
    y: 10,
    opacity: 0,
    duration: 0.2,
    ease: "power2.in",
    force3D: true
  }).to(
    overlay,
    {
      opacity: 0,
      duration: 0.15,
      ease: "power2.in"
    },
    "-=0.1"
  );
};

// 追踪 mousedown 是否发生在遮罩层上
const mouseDownOnOverlay = ref(false);

const handleOverlayMouseDown = (event: MouseEvent) => {
  // 只有当 mousedown 直接发生在遮罩层上时才标记
  mouseDownOnOverlay.value = event.target === overlayRef.value;
};

const handleOverlayMouseUp = (event: MouseEvent) => {
  // 只有当 mousedown 和 mouseup 都发生在遮罩层上时才关闭
  if (
    props.closeOnClickModal &&
    mouseDownOnOverlay.value &&
    event.target === overlayRef.value
  ) {
    handleClose();
  }
  mouseDownOnOverlay.value = false;
};

const handleClose = () => {
  closeDialog();
};

const handleConfirm = () => {
  emit("confirm");
};

// 键盘事件
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === "Escape" && props.closeOnPressEscape) {
    event.preventDefault();
    handleClose();
  }
};

// 监听弹窗状态
watch(
  () => props.modelValue,
  newValue => {
    if (newValue) {
      nextTick(() => {
        openDialog();
      });
      window.addEventListener("keydown", handleKeyDown);
    } else {
      window.removeEventListener("keydown", handleKeyDown);
    }
  }
);

// 暴露方法给父组件
defineExpose({
  close: handleClose
});
</script>

<style lang="scss" scoped>
.an-dialog-wrapper {
  position: fixed;
  inset: 0;
  z-index: 2000;
}

.dialog-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: var(--anzhiyu-maskbgdeep);
  backdrop-filter: blur(12px);
}

.dialog-container {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: hidden;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 16px;
  box-shadow: var(--anzhiyu-shadow-lightblack);
}

.dialog-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: var(--style-border);
}

.dialog-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--anzhiyu-fontcolor);
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  color: var(--anzhiyu-secondtext);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 50%;
  transition: all 0.2s;

  i {
    font-size: 1.2rem;
  }

  &:hover {
    color: var(--anzhiyu-white);
    background: var(--anzhiyu-lighttext);
  }
}

.dialog-content {
  flex: 1;
  min-height: 0; // 关键：允许 flex 子元素正确计算滚动
  padding: 1.5rem;
  overflow-y: auto;

  // 美化滚动条
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: var(--el-fill-color-lighter);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-color-info-light-5);
    border-radius: 3px;

    &:hover {
      background: var(--el-color-info-light-3);
    }
  }
}

.dialog-footer {
  display: flex;
  flex-shrink: 0;
  gap: 12px;
  justify-content: flex-end;
  padding: 1.25rem 1.5rem;
  background: var(--anzhiyu-secondbg);
  border-top: var(--style-border);

  :deep(.confirm-btn) {
    min-width: 80px;
    transition: all 0.3s ease;
  }
}

// 移动端适配
@media (width <= 768px) {
  .dialog-header,
  .dialog-content,
  .dialog-footer {
    padding-right: 1rem;
    padding-left: 1rem;
  }
}
</style>
