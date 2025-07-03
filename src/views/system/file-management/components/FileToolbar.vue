<template>
  <div class="file-toolbar rounded-2xl overflow-hidden bg-white mb-2 ml-2">
    <div class="right-actions">
      <el-tooltip content="刷新" placement="bottom">
        <el-button
          circle
          :icon="RefreshSvg"
          class="!text-[var(--anzhiyu-white)] !border-none !bg-[var(--anzhiyu-theme)]"
          @click="emit('refresh')"
        />
      </el-tooltip>

      <el-tooltip v-if="!isSimplified" content="选择操作" placement="bottom">
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

            <!-- 新增：列设置 -->
            <div v-if="viewMode === 'list'">
              <h1 class="text-base mt-4 mb-2">列设置</h1>
              <el-button class="w-full" :icon="Operation" @click="openDialog">
                列设置
              </el-button>
            </div>

            <!-- 分页大小设置 -->
            <div>
              <h1 class="text-base mt-4">分页大小</h1>
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

  <!-- 列设置对话框 -->
  <el-dialog
    v-model="dialogVisible"
    title="列设置"
    width="500"
    class="rounded-2xl"
    append-to-body
    :close-on-click-modal="false"
  >
    <div class="column-settings-body">
      <!-- 表头 -->
      <div class="column-settings-header">
        <span>列</span>
        <span>操作</span>
      </div>
      <!-- 可拖拽列表 -->
      <transition-group name="list-anim" tag="div" class="column-list">
        <div
          v-for="(col, index) in editableColumns"
          :key="col.type"
          class="column-item"
        >
          <span class="column-name">{{
            columnTypeMap.get(col.type)?.name
          }}</span>
          <div class="column-actions">
            <!-- 上移 -->
            <el-icon
              v-if="index > 0"
              class="action-icon"
              @click="moveColumn(index, -1)"
              ><Top
            /></el-icon>
            <!-- 下移 -->
            <el-icon
              v-if="index < editableColumns.length - 1"
              class="action-icon"
              @click="moveColumn(index, 1)"
              ><Bottom
            /></el-icon>
            <!-- 删除 -->
            <el-icon class="action-icon danger" @click="removeColumn(index)"
              ><Close
            /></el-icon>
          </div>
        </div>
      </transition-group>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <!-- 添加列 -->
        <el-dropdown trigger="click" placement="top-start">
          <el-button type="primary" plain :icon="Plus">添加列</el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="colType in availableColumnsToAdd"
                :key="colType"
                @click="addColumn(colType)"
              >
                {{ columnTypeMap.get(colType)?.name }}
              </el-dropdown-item>
              <el-dropdown-item v-if="!availableColumnsToAdd.length" disabled>
                已添加所有列
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <div>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirm">确定</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
// 新增：从 vue 导入 toRaw
import { ref, watch, computed, toRaw } from "vue";
import type { SortKey } from "@/store/modules/fileStore";
import type { ColumnConfig } from "@/api/sys-file/type";
import {
  Grid,
  Tickets,
  Setting,
  Sort,
  FullScreen,
  Operation,
  Plus,
  Top,
  Bottom,
  Close
} from "@element-plus/icons-vue";
import RefreshSvg from "@/assets/icons/refresh.svg?component";

// --- 列定义 ---
enum ColumnType {
  Name = 0,
  Size = 1,
  UpdatedAt = 2,
  CreatedAt = 3
}

const columnTypeMap = new Map<ColumnType, { name: string }>([
  [ColumnType.Name, { name: "文件名" }],
  [ColumnType.Size, { name: "大小" }],
  [ColumnType.UpdatedAt, { name: "修改时间" }],
  [ColumnType.CreatedAt, { name: "创建时间" }]
]);

// --- Props ---
const props = defineProps<{
  viewMode: "list" | "grid";
  sortKey: SortKey;
  pageSize: number;
  hasSelection: boolean;
  isSimplified?: boolean;
  columns: ColumnConfig[];
}>();

// --- Emits ---
const emit = defineEmits<{
  (e: "refresh"): void;
  (e: "select-all"): void;
  (e: "clear-selection"): void;
  (e: "invert-selection"): void;
  (e: "set-view-mode", mode: "list" | "grid"): void;
  (e: "set-page-size", size: number): void;
  (e: "set-sort-key", key: SortKey): void;
  (e: "set-columns", columns: ColumnConfig[]): void;
}>();

// --- 分页滑块逻辑 ---
const localPageSize = ref(props.pageSize);
watch(
  () => props.pageSize,
  newValue => {
    localPageSize.value = newValue;
  }
);
const onPageSizeInput = (value: number) => {
  localPageSize.value = value;
};
const onPageSizeChange = (value: number) => {
  emit("set-page-size", value);
};

// --- 列设置对话框逻辑 ---
const dialogVisible = ref(false);
const editableColumns = ref<ColumnConfig[]>([]);

// 打开对话框时，深拷贝 props.columns 以便在本地编辑
const openDialog = () => {
  // --- 修正点 ---
  // 错误原因：structuredClone 无法直接克隆 Pinia 的响应式代理 (Proxy) 对象。
  // 解决方案 1 (推荐): 使用 toRaw() 将响应式对象转换为原始对象，然后再进行克隆。
  editableColumns.value = structuredClone(toRaw(props.columns));

  // 解决方案 2 (备选): 使用 JSON.parse/stringify 的老方法。这种方法可以处理 Pinia 的代理对象，但性能稍差且有类型限制。
  // editableColumns.value = JSON.parse(JSON.stringify(props.columns));

  dialogVisible.value = true;
};

// 计算可供添加的列
const availableColumnsToAdd = computed(() => {
  const allColumnTypes = Array.from(columnTypeMap.keys());
  const currentColTypes = new Set(editableColumns.value.map(c => c.type));
  return allColumnTypes.filter(type => !currentColTypes.has(type));
});

// 添加一列
const addColumn = (type: ColumnType) => {
  editableColumns.value.push({ type });
};

// 移除一列
const removeColumn = (index: number) => {
  editableColumns.value.splice(index, 1);
};

// 移动列
const moveColumn = (index: number, direction: -1 | 1) => {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= editableColumns.value.length) return;
  // 交换元素
  const temp = editableColumns.value[index];
  editableColumns.value[index] = editableColumns.value[newIndex];
  editableColumns.value[newIndex] = temp;
};

// 确认修改
const handleConfirm = () => {
  // 提交时，提交的是普通的 JS 数组，Pinia 会自动将其转换为响应式对象
  emit("set-columns", editableColumns.value);
  dialogVisible.value = false;
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
// 视图切换按钮组
.view-switcher {
  width: 100%;
  > div {
    display: flex;
    .el-button {
      flex: 1;
    }
  }
}

// --- 列设置对话框样式 ---
.column-settings-body {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--el-bg-color);
}

.column-settings-header {
  display: flex;
  justify-content: space-between;
  padding: 8px 16px;
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 14px;
  font-weight: 500;
}

.column-list {
  position: relative; // for transition-group
}

.column-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-bg-color);

  &:last-child {
    border-bottom: none;
  }
}

.column-name {
  font-size: 14px;
}

.column-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  color: var(--el-text-color-regular);

  .action-icon {
    cursor: pointer;
    font-size: 16px;
    transition: color 0.2s ease;

    &:hover {
      color: var(--el-color-primary);
    }

    &.danger:hover {
      color: var(--el-color-danger);
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

// --- 列表动画 ---
.list-anim-move,
.list-anim-enter-active,
.list-anim-leave-active {
  transition: all 0.3s cubic-bezier(0.55, 0, 0.1, 1);
}

.list-anim-enter-from,
.list-anim-leave-to {
  opacity: 0;
  transform: scaleY(0.01) translate(30px, 0);
}

.list-anim-leave-active {
  position: absolute;
  width: calc(100% - 32px); // 减去左右padding
}
</style>
