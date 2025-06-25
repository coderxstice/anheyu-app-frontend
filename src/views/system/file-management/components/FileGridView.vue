<template>
  <div v-loading="loading" class="file-grid-view">
    <div
      v-for="file in files"
      :key="file.id"
      class="grid-item deselect-safe-zone"
      :data-id="file.id"
      :class="{ selected: selectedFiles.has(file.id) }"
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
import { onMounted, onUnmounted } from "vue"; // 引入生命周期钩子
import { storeToRefs } from "pinia";
import { useFileStore } from "@/store/modules/fileStore";
import { useFileIcons } from "../hooks/useFileIcons";
import gsap from "gsap";
import type { FileItem } from "@/api/sys-file/type";

// --- 初始化 Store 和 Hooks ---
const fileStore = useFileStore();
const { getFileIcon } = useFileIcons();
const { sortedFiles: files, loading, selectedFiles } = storeToRefs(fileStore);

// --- 动画处理函数 ---
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

// --- 文件选择逻辑 ---
const handleItemClick = (file: FileItem, event: MouseEvent) => {
  if (event.shiftKey) {
    fileStore.selectRange(file.id);
  } else if (event.metaKey || event.ctrlKey) {
    fileStore.toggleSelection(file.id);
  } else {
    fileStore.selectSingle(file.id);
  }
};

// --- 双击事件 ---
const handleItemDblClick = (file: FileItem) => {
  if (file.type === "dir") {
    const newPath =
      file.path === "/" ? `/${file.name}` : `${file.path}/${file.name}`;
    fileStore.loadFiles(newPath);
  }
};

// --- [!新增] 全选快捷键逻辑 ---
const handleKeyDown = (event: KeyboardEvent) => {
  // 检查焦点是否在输入框等元素上，如果是则不执行快捷键
  const target = event.target as HTMLElement;
  if (["INPUT", "TEXTAREA"].includes(target.tagName)) {
    return;
  }

  // 判断是否按下了 Cmd/Ctrl + A
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a") {
    event.preventDefault(); // 阻止浏览器默认的全选文本行为
    fileStore.selectAll();
  }
};

// --- [!新增] 生命周期钩子 ---
onMounted(() => {
  // 组件挂载时，添加全局键盘事件监听
  window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  // 组件卸载时，移除监听，防止内存泄漏
  window.removeEventListener("keydown", handleKeyDown);
});
</script>

<style scoped>
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
