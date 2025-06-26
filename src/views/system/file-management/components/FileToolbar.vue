<template>
  <div class="file-toolbar rounded-2xl overflow-hidden bg-white">
    <div class="right-actions">
      <el-tooltip content="刷新" placement="bottom">
        <el-button circle :icon="Refresh" @click="refresh" />
      </el-tooltip>

      <el-tooltip content="选择操作" placement="bottom">
        <div>
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
        </div>
      </el-tooltip>

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
              <el-slider
                v-model="pageSize"
                :min="50"
                :max="2000"
                size="small"
              />
              <div class="text-xs text-gray-500">
                当前分页大小: {{ pageSize }} 条
              </div>
            </div>
          </el-popover>
        </div>
      </el-tooltip>

      <el-tooltip content="排序" placement="bottom">
        <div>
          <el-dropdown
            trigger="click"
            placement="bottom-end"
            class="sort-dropdown"
            @command="handleSortChange"
          >
            <el-button circle :icon="Sort" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  command="name_asc"
                  :class="{
                    active: sortKey === 'name_asc',
                    'sort-dropdown-item': true
                  }"
                  >A-Z</el-dropdown-item
                >
                <el-dropdown-item
                  command="name_desc"
                  :class="{
                    active: sortKey === 'name_desc',
                    'sort-dropdown-item': true
                  }"
                  >Z-A</el-dropdown-item
                >
                <el-dropdown-item
                  divided
                  command="size_asc"
                  :class="{
                    active: sortKey === 'size_asc',
                    'sort-dropdown-item': true
                  }"
                  >最小</el-dropdown-item
                >
                <el-dropdown-item
                  command="size_desc"
                  :class="{
                    active: sortKey === 'size_desc',
                    'sort-dropdown-item': true
                  }"
                  >最大</el-dropdown-item
                >
                <el-dropdown-item
                  divided
                  command="updated_at"
                  :class="{
                    active: sortKey === 'updated_at_asc',
                    'sort-dropdown-item': true
                  }"
                  >最早修改</el-dropdown-item
                >
                <el-dropdown-item
                  command="updated_at_desc"
                  :class="{
                    active: sortKey === 'updated_at_desc',
                    'sort-dropdown-item': true
                  }"
                  >最新修改</el-dropdown-item
                >
                <el-dropdown-item
                  divided
                  command="created_at"
                  :class="{
                    active: sortKey === 'created_at_asc',
                    'sort-dropdown-item': true
                  }"
                  >最早上传</el-dropdown-item
                >
                <el-dropdown-item
                  command="created_at_desc"
                  :class="{
                    active: sortKey === 'created_at_desc',
                    'sort-dropdown-item': true
                  }"
                  >最新上传</el-dropdown-item
                >
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
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
const { viewMode, sortKey } = storeToRefs(fileStore);
const pageSize = ref(50);

const setView = (mode: "list" | "grid") => {
  fileStore.setViewMode(mode);
};

const refresh = () => {
  fileStore.loadFiles(fileStore.path);
};

const handleSortChange = (key: SortKey) => {
  fileStore.setSort(key);
};
</script>

<style scoped lang="scss">
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
</style>
