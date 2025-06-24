<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-24 14:14:33
 * @LastEditTime: 2025-06-24 14:20:11
 * @LastEditors: 安知鱼
-->
<template>
  <el-table
    ref="tableRef"
    v-loading="loading"
    :data="files"
    style="width: 100%"
    @row-click="handleRowClick"
    @selection-change="handleSelectionChange"
  >
    <el-table-column type="selection" width="55" />
    <el-table-column label="名称" min-width="300">
      <template #default="{ row }">
        <div class="file-name-cell">
          <component :is="getFileIcon(row)" />
          <span class="file-name-text">{{ row.name }}</span>
        </div>
      </template>
    </el-table-column>
    <el-table-column prop="size" label="大小" width="180">
      <template #default="{ row }">
        {{ row.type === "folder" ? "-" : formatSize(row.size) }}
      </template>
    </el-table-column>
    <el-table-column prop="modified" label="修改日期" width="180">
      <template #default="{ row }">
        {{ formatTime(row.modified) }}
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup lang="ts">
import { computed, watch, ref } from "vue";
import { useFileStore } from "@/store/modules/fileStore";
import type { FileItem } from "@/store/types";
import { formatSize, formatTime, getFileIcon } from "../utils/utils";
import type { ElTable } from "element-plus";

const fileStore = useFileStore();
const files = computed(() => fileStore.files);
const loading = computed(() => fileStore.loading);
const tableRef = ref<InstanceType<typeof ElTable>>();

const handleRowClick = (row: FileItem) => {
  if (row.type === "folder") {
    const newPath = `${fileStore.path === "/" ? "" : fileStore.path}/${row.name}`;
    fileStore.loadFiles(newPath);
  }
};

const handleSelectionChange = (selection: FileItem[]) => {
  // 避免与 store 的 set 无限循环
  const newSelection = new Set(selection.map(f => f.id));
  if (
    JSON.stringify(Array.from(newSelection)) !==
    JSON.stringify(Array.from(fileStore.selectedFiles))
  ) {
    fileStore.selectedFiles = newSelection;
  }
};

// 监听Pinia中selection的变化，同步到el-table
watch(
  () => fileStore.selectedFiles,
  newSelection => {
    tableRef.value?.clearSelection();
    if (newSelection.size > 0) {
      files.value.forEach(file => {
        if (newSelection.has(file.id)) {
          tableRef.value?.toggleRowSelection(file, true);
        }
      });
    }
  },
  { deep: true }
);
</script>

<style scoped>
.file-name-cell {
  display: flex;
  align-items: center;
  cursor: pointer;
}
.file-name-cell .el-icon {
  margin-right: 8px;
}
.file-name-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
