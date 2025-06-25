<template>
  <div class="file-toolbar rounded-2xl overflow-hidden bg-white">
    <div class="right-actions">
      <el-tooltip content="视图设置" placement="bottom">
        <div>
          <el-popover
            placement="bottom-end"
            title="布局设置"
            :width="250"
            trigger="click"
          >
            <template #reference>
              <el-button circle :icon="Operation" />
            </template>
            <div>
              <h1 class="text-base mt-2">分页大小</h1>
              <el-slider
                v-model="pageSize"
                :min="10"
                :max="200"
                :step="10"
                size="small"
                @change="handlePageSizeChange"
              />
              <div class="text-xs text-gray-500">
                当前分页大小: {{ pageSize }} 条
              </div>
            </div>
          </el-popover>
        </div>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from "vue"; // [!新增] 引入 watch
import { storeToRefs } from "pinia";
import { useFileStore } from "@/store/modules/fileStore";
import type { SortKey } from "@/store/modules/fileStore";
import {
  Refresh,
  Grid,
  Tickets,
  Operation,
  Sort,
  FullScreen
} from "@element-plus/icons-vue";

const fileStore = useFileStore();
// [!修改] 从 store 中解构出 pageSize
const { viewMode, sortKey, pageSize } = storeToRefs(fileStore);

const setView = (mode: "list" | "grid") => {
  fileStore.setViewMode(mode);
};

const refresh = () => {
  fileStore.loadFiles(fileStore.path);
};

const handleSortChange = (key: SortKey) => {
  fileStore.setSort(key);
};

// [!新增] 当 pageSize 变化时，调用 store 的 action 来更新
const handlePageSizeChange = (newSize: number) => {
  // 我们在 store 中已经创建了一个更明确的 action
  fileStore.setPageSize(newSize);
};
</script>

<style scoped lang="scss">
/* ... 样式保持不变 ... */
.file-toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 8px 24px;
  background-color: #fff;
  border: var(--style-border);
}
.right-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
:deep(.el-slider__button) {
  width: 16px !important;
  height: 16px !important;
}
:deep(.el-dropdown-menu__item.active) {
  color: var(--el-color-primary, #409eff);
  background-color: var(--el-color-primary-light-9, #ecf5ff);
}
:deep(.el-dropdown-menu__item.active:hover) {
  background-color: var(--el-color-primary-light-9, #ecf5ff);
}
</style>
