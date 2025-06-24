<template>
  <div v-loading="loading" class="file-grid-view">
    <div
      v-for="file in files"
      :key="file.id"
      class="grid-item"
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
import { storeToRefs } from "pinia";
import { useFileStore } from "@/store/modules/fileStore";
import { useFileIcons } from "../hooks/useFileIcons";
import gsap from "gsap";
import type { FileItem } from "@/api/sys-file/type";

// --- 初始化 Store 和 Hooks ---
const fileStore = useFileStore();
const { getFileIcon } = useFileIcons();
const { sortedFiles: files, loading, selectedFiles } = storeToRefs(fileStore);

// --- [!新增] 动画处理函数 ---
/**
 * 当鼠标按下时，缩小项目
 * @param event 鼠标事件
 */
const handleMouseDown = (event: MouseEvent) => {
  gsap.to(event.currentTarget as HTMLElement, {
    scale: 0.95,
    duration: 0.15,
    ease: "power2.out"
  });
};

/**
 * 当鼠标抬起或离开时，恢复项目大小，并带有回弹效果
 * @param event 鼠标事件
 */
const handleMouseUp = (event: MouseEvent) => {
  gsap.to(event.currentTarget as HTMLElement, {
    scale: 1,
    duration: 0.4, // 恢复动画可以稍长一点，以突出弹性效果
    ease: "elastic.out(1, 0.5)" // GSAP 经典的弹性缓动
  });
};

/**
 * 当鼠标移出时，同样恢复项目大小，防止项目卡在缩小状态
 * @param event 鼠标事件
 */
const handleMouseLeave = (event: MouseEvent) => {
  // 为了防止和 mouseup 冲突，可以检查鼠标是否仍处于按下状态，但通常直接恢复更稳妥
  gsap.to(event.currentTarget as HTMLElement, {
    scale: 1,
    duration: 0.4,
    ease: "elastic.out(1, 0.5)"
  });
};

// --- [!修改] 文件选择逻辑 (移除动画部分) ---
/**
 * 处理单击事件，现在只负责选择逻辑
 * @param file 被点击的文件项
 * @param event 鼠标事件对象
 */
const handleItemClick = (file: FileItem, event: MouseEvent) => {
  if (event.shiftKey) {
    fileStore.selectRange(file.id);
  } else if (event.metaKey || event.ctrlKey) {
    fileStore.toggleSelection(file.id);
  } else {
    fileStore.selectSingle(file.id);
  }
};

/**
 * 处理双击事件 (保持不变)
 */
const handleItemDblClick = (file: FileItem) => {
  if (file.type === "dir") {
    const newPath =
      file.path === "/" ? `/${file.name}` : `${file.path}/${file.name}`;
    fileStore.loadFiles(newPath);
  }
};
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
  /* 移除 transform 的 CSS transition，完全交由 GSAP 控制 */
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
