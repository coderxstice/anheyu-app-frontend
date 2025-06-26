<template>
  <div class="file-toolbar rounded-2xl overflow-hidden bg-white">
    <div class="right-actions">
      <!-- 刷新 -->
      <el-tooltip content="刷新" placement="bottom">
        <el-button circle :icon="Refresh" @click="emit('refresh')" />
      </el-tooltip>

      <!-- 选择操作 -->
      <el-tooltip content="选择操作" placement="bottom">
        <div>
          <el-dropdown trigger="click" placement="bottom-end">
            <el-button circle :icon="FullScreen" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="emit('select-all')">
                  全选
                </el-dropdown-item>
                <el-dropdown-item
                  :disabled="!hasSelection"
                  @click="emit('clear-selection')"
                >
                  取消选择
                </el-dropdown-item>
                <el-dropdown-item @click="emit('invert-selection')">
                  反选
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-tooltip>

      <!-- 视图设置 -->
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
            <!-- 视图切换 -->
            <el-button-group class="view-switcher">
              <div>
                <el-button
                  :type="viewMode === 'grid' ? 'primary' : 'default'"
                  :icon="Grid"
                  @click="emit('set-view-mode', 'grid')"
                />
                <el-button
                  :type="viewMode === 'list' ? 'primary' : 'default'"
                  :icon="Tickets"
                  @click="emit('set-view-mode', 'list')"
                />
              </div>
            </el-button-group>
            <!-- 分页大小 -->
            <div>
              <h1 class="text-base mt-2">分页大小</h1>
              <!-- 使用 v-model:model-value 和 @change 来同步数据 -->
              <el-slider
                :model-value="pageSize"
                :min="10"
                :max="200"
                :step="10"
                size="small"
                @update:model-value="onPageSizeChange"
              />
              <div class="text-xs text-gray-500">
                当前分页大小: {{ pageSize }} 条
              </div>
            </div>
          </el-popover>
        </div>
      </el-tooltip>

      <!-- 排序 -->
      <el-tooltip content="排序" placement="bottom">
        <div>
          <el-dropdown
            trigger="click"
            placement="bottom-end"
            class="sort-dropdown"
            @command="(key: SortKey) => emit('set-sort-key', key)"
          >
            <el-button circle :icon="Sort" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  command="name_asc"
                  :class="{ active: sortKey === 'name_asc' }"
                >
                  A-Z
                </el-dropdown-item>
                <el-dropdown-item
                  command="name_desc"
                  :class="{ active: sortKey === 'name_desc' }"
                >
                  Z-A
                </el-dropdown-item>
                <el-dropdown-item
                  divided
                  command="size_asc"
                  :class="{ active: sortKey === 'size_asc' }"
                >
                  最小
                </el-dropdown-item>
                <el-dropdown-item
                  command="size_desc"
                  :class="{ active: sortKey === 'size_desc' }"
                >
                  最大
                </el-dropdown-item>
                <el-dropdown-item
                  divided
                  command="updated_at_desc"
                  :class="{ active: sortKey === 'updated_at_desc' }"
                >
                  最新修改
                </el-dropdown-item>
                <el-dropdown-item
                  command="updated_at_asc"
                  :class="{ active: sortKey === 'updated_at_asc' }"
                >
                  最早修改
                </el-dropdown-item>
                <el-dropdown-item
                  divided
                  command="created_at_desc"
                  :class="{ active: sortKey === 'created_at_desc' }"
                >
                  最新上传
                </el-dropdown-item>
                <el-dropdown-item
                  command="created_at_asc"
                  :class="{ active: sortKey === 'created_at_asc' }"
                >
                  最早上传
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SortKey } from "@/store/modules/fileStore"; // 依然需要类型
import {
  Refresh,
  Grid,
  Tickets,
  Operation,
  Sort,
  FullScreen
} from "@element-plus/icons-vue";

// --- 1. 定义 Props 和 Emits ---
const props = defineProps<{
  viewMode: "list" | "grid";
  sortKey: SortKey;
  pageSize: number;
  hasSelection: boolean;
}>();

const emit = defineEmits<{
  (e: "refresh"): void;
  (e: "select-all"): void;
  (e: "clear-selection"): void;
  (e: "invert-selection"): void;
  (e: "set-view-mode", mode: "list" | "grid"): void;
  (e: "set-page-size", size: number): void;
  (e: "set-sort-key", key: SortKey): void;
}>();

// --- 2. 处理本地状态与父组件的同步 ---
// ElSlider 的 @update:model-value 事件提供了新值
const onPageSizeChange = (value: number) => {
  emit("set-page-size", value);
};
</script>

<style scoped lang="scss">
/* 样式保持不变 */
.file-toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 4px 12px; /* 调整了内边距以适应更紧凑的布局 */
  background-color: #fff;
  border: var(--style-border);
}
.right-actions {
  display: flex;
  align-items: center;
  gap: 8px; /* 减小间距 */
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
