<template>
  <div class="file-toolbar rounded-2xl overflow-hidden bg-white">
    <div class="right-actions">
      <!-- 刷新 -->
      <el-tooltip content="刷新" placement="bottom">
        <el-button
          circle
          :icon="RefreshSvg"
          class="!text-[var(--anzhiyu-white)] !border-none !bg-[var(--anzhiyu-theme)]"
          @click="emit('refresh')"
        />
      </el-tooltip>

      <!-- 选择操作 -->
      <el-tooltip content="选择操作" placement="bottom">
        <div>
          <el-dropdown trigger="click" placement="bottom-end">
            <el-button
              circle
              :icon="FullScreen"
              class="!text-[var(--anzhiyu-white)] !border-none !bg-[#8468F3]"
            />
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
              <el-button
                circle
                :icon="Setting"
                class="!text-[var(--anzhiyu-white)] !border-none !bg-[#73A6F5]"
              />
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
              <!-- **核心修改**: 分离 input 和 change 事件 -->
              <el-slider
                :model-value="localPageSize"
                :min="10"
                :max="200"
                :step="10"
                size="small"
                @input="onPageSizeInput"
                @change="onPageSizeChange"
              />
              <div class="text-xs text-gray-500">
                当前分页大小: {{ localPageSize }} 条
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
            <el-button
              circle
              :icon="Sort"
              class="!text-[var(--anzhiyu-white)] !border-none !bg-[#6EB65E]"
            />
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
import { ref, watch } from "vue";
import type { SortKey } from "@/store/modules/fileStore";
import {
  Grid,
  Tickets,
  Setting,
  Sort,
  FullScreen
} from "@element-plus/icons-vue";
import RefreshSvg from "@/assets/icons/refresh.svg?component";

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

// **核心修改**: 处理 el-slider 的状态同步
const localPageSize = ref(props.pageSize);

// 当外部 prop 变化时（例如，加载了一个有不同配置的文件夹），同步更新本地值
watch(
  () => props.pageSize,
  newValue => {
    localPageSize.value = newValue;
  }
);

// 在拖动滑块时，只更新本地的 ref，用于实时显示
const onPageSizeInput = (value: number) => {
  localPageSize.value = value;
};

// 仅在拖动结束后，才发出事件通知父组件，以触发 API 调用
const onPageSizeChange = (value: number) => {
  emit("set-page-size", value);
};
</script>

<style scoped lang="scss">
.file-toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 4px 12px;
  background-color: #fff;
  border: var(--style-border);
}
.right-actions {
  display: flex;
  align-items: center;
  gap: 8px;
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
