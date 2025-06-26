<template>
  <div v-loading="loading" class="file-grid-view">
    <!-- 使用从 props 传入的文件列表 -->
    <div
      v-for="file in files"
      :key="file.id"
      class="grid-item deselect-safe-zone"
      :data-id="file.id"
      :class="{ selected: selectedFileIds.has(file.id) }"
      @click="handleItemClick(file, $event)"
      @dblclick="handleItemDblClick(file)"
      @mousedown="handleMouseDown"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseLeave"
    >
      <div class="item-icon">
        <component :is="getFileIcon(file)" class="file-icon" />
      </div>
      <div class="item-name">{{ file.name }}</div>
    </div>
    <el-empty
      v-if="files.length === 0 && !loading"
      description="这里什么都没有"
      class="grid-empty"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { useFileIcons } from "../hooks/useFileIcons";
import gsap from "gsap";
import { FileItem, FileType } from "@/api/sys-file/type";

// --- 1. 定义 Props 和 Emits ---
const props = defineProps<{
  files: FileItem[];
  loading: boolean;
  selectedFileIds: Set<string>;
}>();

const emit = defineEmits<{
  (e: "select-single", fileId: string): void;
  (e: "select-range", fileId: string): void;
  (e: "toggle-selection", fileId: string): void;
  (e: "select-all"): void;
  (e: "navigate-to", path: string): void;
}>();

// --- 2. 初始化独立的 Hooks ---
const { getFileIcon } = useFileIcons();

// --- 3. 动画处理 (保持不变) ---
const handleMouseDown = (event: MouseEvent) => {
  gsap.to(event.currentTarget as HTMLElement, {
    scale: 0.95,
    duration: 0.15,
    ease: "power2.out"
  });
};
const handleMouseUp = (event: MouseEvent) => {
  gsap.to(event.currentTarget as HTMLElement, {
    scale: 1,
    duration: 0.4,
    ease: "elastic.out(1, 0.5)"
  });
};
const handleMouseLeave = (event: MouseEvent) => {
  gsap.to(event.currentTarget as HTMLElement, {
    scale: 1,
    duration: 0.4,
    ease: "elastic.out(1, 0.5)"
  });
};

// --- 4. 修改事件处理器，通过 emit 发出意图 ---
const handleItemClick = (file: FileItem, event: MouseEvent) => {
  if (event.shiftKey) {
    emit("select-range", file.id);
  } else if (event.metaKey || event.ctrlKey) {
    emit("toggle-selection", file.id);
  } else {
    emit("select-single", file.id);
  }
};

const handleItemDblClick = (file: FileItem) => {
  if (file.type === FileType.Dir) {
    emit("navigate-to", file.path);
  }
};

const handleKeyDown = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement;
  if (["INPUT", "TEXTAREA"].includes(target.tagName)) return;

  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a") {
    event.preventDefault();
    emit("select-all");
  }
};

// --- 生命周期钩子 (保持不变) ---
onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
});
</script>

<style scoped>
/* 样式保持不变 */
.file-grid-view {
  padding: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 20px;
}
.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 16px 8px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid transparent;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
  text-align: center;
  user-select: none;
}
.grid-item:hover {
  background-color: #f5f7fa;
}
.grid-item.selected {
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
}
.item-icon {
  width: 50px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 12px;
}
.file-icon {
  font-size: 50px;
  width: 50px;
  height: 50px;
}
.item-name {
  width: 100%;
  min-width: 0;
  font-size: 14px;
  word-break: break-all;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
  height: calc(1.4 * 2 * 1em);
}
.grid-empty {
  grid-column: 1 / -1;
}
</style>
