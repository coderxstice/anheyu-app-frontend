<template>
  <div class="file-toolbar rounded-2xl overflow-hidden bg-white">
    <div class="right-actions">
      <el-tooltip content="刷新" placement="bottom">
        <div>
          <el-button circle :icon="Refresh" @click="refresh" />
        </div>
      </el-tooltip>

      <el-dropdown trigger="click" placement="bottom-end">
        <el-button circle :icon="FullScreen" />
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="fileStore.selectAll"
              >全选</el-dropdown-item
            >
            <el-dropdown-item
              :disabled="fileStore.selectedFiles.size === 0"
              @click="fileStore.clearSelection"
              >取消选择</el-dropdown-item
            >
            <el-dropdown-item @click="fileStore.invertSelection"
              >反选</el-dropdown-item
            >
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-popover
        placement="bottom-end"
        title="布局设置"
        :width="250"
        trigger="click"
      >
        <template #reference>
          <div>
            <el-tooltip content="视图设置" placement="bottom">
              <div>
                <el-button circle :icon="Operation" />
              </div>
            </el-tooltip>
          </div>
        </template>
        <el-button-group class="view-switcher">
          <div>
            <el-button
              :type="viewMode === 'grid' ? 'primary' : 'default'"
              :icon="Grid"
              @click="setView('grid')"
            />
            <el-button
              :type="viewMode === 'list' ? 'primary' : 'default'"
              :icon="Tickets"
              @click="setView('list')"
            />
          </div>
        </el-button-group>
        <div>
          <h1 class="text-base mt-2">分页大小</h1>
          <el-slider v-model="pageSize" :min="50" :max="2000" size="small" />
          <div class="text-xs text-gray-500">
            当前分页大小: {{ pageSize }} 条
          </div>
        </div>
      </el-popover>

      <el-tooltip content="排序" placement="bottom">
        <div>
          <el-button circle :icon="Sort" />
        </div>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { storeToRefs } from "pinia"; // <<< [!优化] 引入 storeToRefs
import { useFileStore } from "@/store/modules/fileStore";
import {
  Refresh,
  Grid,
  Tickets,
  Operation,
  Sort,
  FullScreen
} from "@element-plus/icons-vue";

const fileStore = useFileStore();
// --- [!优化] 使用 storeToRefs 获取响应式状态 ---
// 这样可以确保 viewMode 始终与 store 保持同步，且代码风格更统一
const { viewMode } = storeToRefs(fileStore);

const pageSize = ref(50);

// setViewMode action 现在可以直接从 store 实例调用
const setView = (mode: "list" | "grid") => {
  fileStore.setViewMode(mode);
};

const refresh = () => {
  fileStore.loadFiles(fileStore.path);
};
</script>

<style scoped>
.file-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 24px;
  background-color: #fff;
  border: var(--style-border);
}
.left-actions,
.right-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
:deep(.el-slider__button) {
  width: 16px !important;
  height: 16px !important;
}
</style>
