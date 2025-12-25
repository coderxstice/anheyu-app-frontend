<template>
  <Transition name="float-save">
    <div v-if="hasChanges" class="floating-save-button">
      <div class="save-content">
        <span class="save-text">有未保存的更改</span>
        <el-button type="primary" :loading="loading" @click="handleSave">
          <el-icon v-if="!loading"><Check /></el-icon>
          {{ loading ? "保存中..." : "保存设置" }}
        </el-button>
      </div>
      <div class="keyboard-hint">
        <kbd>{{ isMac ? "⌘" : "Ctrl" }}</kbd>
        <span>+</span>
        <kbd>S</kbd>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { Check } from "@element-plus/icons-vue";

const props = defineProps<{
  hasChanges: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: "save"): void;
}>();

const isMac = computed(
  () => navigator.platform.toUpperCase().indexOf("MAC") >= 0
);

const handleSave = () => {
  emit("save");
};

// 监听快捷键
const handleKeydown = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "s") {
    e.preventDefault();
    if (props.hasChanges && !props.loading) {
      handleSave();
    }
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<style scoped lang="scss">
.floating-save-button {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: var(--el-bg-color);
  border-radius: 12px;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.12),
    0 0 0 1px var(--el-border-color-lighter);
  backdrop-filter: blur(8px);
}

.save-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.save-text {
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.keyboard-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);

  kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    font-family: inherit;
    font-size: 11px;
    background: var(--el-fill-color);
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
  }
}

// 动画
.float-save-enter-active,
.float-save-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.float-save-enter-from,
.float-save-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>

