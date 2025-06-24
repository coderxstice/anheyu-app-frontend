<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-24 14:14:27
 * @LastEditTime: 2025-06-24 14:22:26
 * @LastEditors: 安知鱼
-->
<template>
  <div v-loading="loading" class="file-grid-view">
    <div
      v-for="file in files"
      :key="file.id"
      class="grid-item"
      :class="{ selected: isSelected(file.id) }"
      @click="handleItemClick(file)"
      @dblclick="handleItemDblClick(file)"
    >
      <div class="item-icon">
        <component :is="getFileIcon(file)" />
      </div>
      <div class="item-name">{{ file.name }}</div>
    </div>
    <el-empty v-if="files.length === 0 && !loading" description="空文件夹" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useFileStore } from "@/store/modules/fileStore";
import { getFileIcon } from "../utils/utils";
import type { FileItem } from "@/store/types";

const fileStore = useFileStore();
const files = computed(() => fileStore.files);
const loading = computed(() => fileStore.loading);
const isSelected = (id: string) => fileStore.selectedFiles.has(id);

const handleItemClick = (file: FileItem) => {
  fileStore.toggleSelection(file.id);
};

const handleItemDblClick = (file: FileItem) => {
  if (file.type === "folder") {
    const newPath = `${fileStore.path === "/" ? "" : fileStore.path}/${file.name}`;
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
  justify-content: center;
  padding: 16px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  text-align: center;
}
.grid-item:hover {
  background-color: #f5f7fa;
}
.grid-item.selected {
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
}
.item-icon :deep(.el-icon) {
  font-size: 50px;
  margin-bottom: 12px;
}
.item-name {
  width: 100%;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
