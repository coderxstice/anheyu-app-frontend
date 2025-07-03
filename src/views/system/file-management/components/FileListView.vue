<template>
  <div class="file-list-container">
    <!-- 表头区域 -->
    <div class="file-list-header">
      <!-- 直接通过 v-for 渲染所有列 -->
      <div
        v-for="col in columns"
        :key="col.type"
        :class="['column', `column-${columnTypeMap[col.type].key}`]"
        @click="handleHeaderClick(columnTypeMap[col.type].key)"
        @mouseenter="hoveredHeaderKey = columnTypeMap[col.type].key"
        @mouseleave="hoveredHeaderKey = null"
      >
        <span>{{ columnTypeMap[col.type].name }}</span>

        <div class="sort-indicator-wrapper">
          <!-- 当前激活的排序列 -->
          <div
            v-if="currentSort.key === columnTypeMap[col.type].key"
            class="sort-indicator active"
          >
            <el-icon v-if="currentSort.dir === 'asc'"><CaretTop /></el-icon>
            <el-icon v-else><CaretBottom /></el-icon>
          </div>
          <!-- 鼠标悬浮时显示的预备排序列 -->
          <div
            v-else-if="hoveredHeaderKey === columnTypeMap[col.type].key"
            class="sort-indicator-hover"
          >
            <el-icon><CaretBottom /></el-icon>
          </div>
        </div>
      </div>

      <!-- 添加列按钮 -->
      <div class="column-add">
        <el-tooltip content="配置列" placement="top">
          <el-icon @click="emit('open-column-settings')"><Plus /></el-icon>
        </el-tooltip>
      </div>
    </div>

    <!-- 列表主体区域 -->
    <ul
      class="file-list-body"
      data-is-file-container="true"
      @scroll="handleLocalScroll"
    >
      <!-- 空状态 -->
      <li v-if="!files.length && !loading && !isMoreLoading" class="state-view">
        <span>这里什么都没有</span>
      </li>

      <!-- 文件列表项 -->
      <li
        v-for="item in files"
        :key="item.id"
        class="file-item"
        :data-id="item.id"
        :data-type="item.type === FileType.Dir ? 'Dir' : 'File'"
        :class="{
          selected: selectedFileIds.has(item.id),
          'is-uploading': item.metadata?.['sys:upload_session_id'],
          'is-disabled': disabledFileIds?.has(item.id)
        }"
        @click="handleItemClick(item, $event)"
        @dblclick="handleItemDblClick(item)"
        @mousedown="handleMouseDown"
        @mouseup="handleMouseUp"
      >
        <!-- 动态列单元格 -->
        <div
          v-for="col in columns"
          :key="col.type"
          :class="['column', `column-${columnTypeMap[col.type].key}`]"
        >
          <!-- 名称列特殊处理，包含图标 -->
          <template v-if="columnTypeMap[col.type].key === 'name'">
            <div class="column-name-content">
              <Transition name="icon-swap" mode="out-in">
                <IconifyIconOnline
                  v-if="selectedFileIds.has(item.id)"
                  icon="material-symbols:check-circle-rounded"
                  class="file-icon selected-icon"
                  @click.stop="emit('toggle-selection', item.id)"
                />
                <component :is="getFileIcon(item)" v-else class="file-icon" />
              </Transition>
              <span class="file-name-text">{{ item.name }}</span>
              <el-tooltip
                v-if="item.metadata?.['sys:upload_session_id']"
                content="文件上传中..."
                placement="top"
              >
                <el-icon class="uploading-indicator"><Loading /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <!-- 其他列正常渲染 -->
          <template v-else-if="columnTypeMap[col.type].key === 'size'">
            {{ item.type === FileType.File ? formatSize(item.size) : "--" }}
          </template>
          <template v-else-if="columnTypeMap[col.type].key === 'updated_at'">
            {{ formatDateTime(item.updated_at) }}
          </template>
          <template v-else-if="columnTypeMap[col.type].key === 'created_at'">
            {{ formatDateTime(item.created_at) }}
          </template>
        </div>
      </li>

      <!-- 加载指示器 -->
      <li v-if="isMoreLoading" class="state-view load-more-indicator">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </li>
      <li
        v-if="!isMoreLoading && !hasMore && files.length > 0"
        class="state-view no-more-indicator"
      >
        <span>— 没有更多了 —</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, type PropType } from "vue";
import { formatSize, formatDateTime } from "@/utils/format";
import { useFileIcons } from "../hooks/useFileIcons";
import gsap from "gsap";
import { FileItem, FileType, type ColumnConfig } from "@/api/sys-file/type";
import { Loading, CaretTop, CaretBottom, Plus } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { extractLogicalPathFromUri } from "@/utils/fileUtils";
import type { SortKey } from "@/store/modules/fileStore";

const props = defineProps({
  files: { type: Array as PropType<FileItem[]>, required: true },
  loading: { type: Boolean, default: false },
  selectedFileIds: { type: Set as PropType<Set<string>>, required: true },
  disabledFileIds: {
    type: Set as PropType<Set<string>>,
    default: () => new Set()
  },
  isMoreLoading: { type: Boolean, default: false },
  hasMore: { type: Boolean, default: true },
  columns: { type: Array as PropType<ColumnConfig[]>, required: true },
  sortKey: { type: String as PropType<SortKey>, required: true }
});

const emit = defineEmits<{
  (e: "select-single", fileId: string): void;
  (e: "select-range", fileId: string): void;
  (e: "toggle-selection", fileId: string): void;
  (e: "select-all"): void;
  (e: "navigate-to", path: string): void;
  (e: "scroll", event: Event): void;
  (e: "set-sort-key", key: SortKey): void;
  (e: "open-column-settings"): void;
}>();

const columnTypeMap = {
  0: { key: "name", name: "文件名" },
  1: { key: "size", name: "大小" },
  2: { key: "updated_at", name: "修改日期" },
  3: { key: "created_at", name: "创建日期" }
} as const;

type ColumnKey = (typeof columnTypeMap)[keyof typeof columnTypeMap]["key"];

/**
 * [关键修正]
 * 计算属性，解析当前排序键为 { key, dir } 对象。
 * 采用更健壮的分割方式，以处理键名中包含下划线的情况 (如 'updated_at')。
 */
const currentSort = computed(() => {
  const parts = props.sortKey.split("_");
  // pop() 会移除并返回数组的最后一个元素
  const dir = parts.pop();
  // join('_') 会将数组剩余的所有部分用下划线重新连接起来
  const key = parts.join("_");
  return { key, dir };
});

const handleHeaderClick = (key: ColumnKey) => {
  if (currentSort.value.key === key) {
    const newDir = currentSort.value.dir === "asc" ? "desc" : "asc";
    emit("set-sort-key", `${key}_${newDir}` as SortKey);
  } else {
    const newDir = key === "name" ? "asc" : "desc";
    emit("set-sort-key", `${key}_${newDir}` as SortKey);
  }
};

const { getFileIcon } = useFileIcons();
const hoveredHeaderKey = ref<ColumnKey | null>(null);

const handleLocalScroll = (event: Event) => emit("scroll", event);

const handleMouseDown = (event: MouseEvent) => {
  gsap.to(event.currentTarget as HTMLElement, {
    scale: 0.995,
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

const handleItemClick = (item: FileItem, event: MouseEvent) => {
  if (
    props.disabledFileIds?.has(item.id) ||
    item.metadata?.["sys:upload_session_id"]
  )
    return;
  if (event.shiftKey) {
    emit("select-range", item.id);
  } else if (event.metaKey || event.ctrlKey) {
    emit("toggle-selection", item.id);
  } else {
    emit("select-single", item.id);
  }
};

const handleItemDblClick = (item: FileItem) => {
  if (props.disabledFileIds?.has(item.id)) {
    ElMessage.warning("不能进入正在移动的文件夹。");
    return;
  }
  if (item.metadata?.["sys:upload_session_id"]) return;
  if (item.type === FileType.Dir) {
    const logicalPath = extractLogicalPathFromUri(item.path);
    emit("navigate-to", logicalPath);
  }
};

const handleKeyDown = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement;
  if (["INPUT", "TEXTAREA"].includes(target.tagName)) return;
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a") {
    event.preventDefault();
    emit("select-all");
  }
};

onMounted(() => window.addEventListener("keydown", handleKeyDown));
onUnmounted(() => window.removeEventListener("keydown", handleKeyDown));
</script>

<style scoped lang="scss">
/* --- 整体布局 --- */
.file-list-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background-color: white;
  position: relative;
}

.file-list-header {
  display: flex;
  align-items: center;
  color: #64748b;
  font-weight: 500;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 8px;
  flex-shrink: 0;
  user-select: none;
}

.file-list-body {
  flex: 1 1 auto;
  overflow-y: auto;
  min-height: 0;
  padding: 6px 8px;
}

/* --- 列通用样式 --- */
.column {
  padding: 12px 8px;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;

  &.column-name {
    flex: 5;
    padding-left: 20px;
  }
  &.column-size {
    flex: 1.5;
    justify-content: flex-start;
    color: #64748b;
  }
  &.column-updated_at,
  &.column-created_at {
    flex: 2.5;
    color: #64748b;
  }
}

.file-list-header .column {
  cursor: pointer;
}

/* --- 名称列的特殊内容 --- */
.column-name-content {
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
}
.file-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}
.selected-icon {
  color: gold;
  cursor: pointer;
}
.file-name-text {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* --- 文件行项目 --- */
.file-item {
  display: flex;
  align-items: center;
  margin: 1px 0;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

/* --- 排序和添加按钮 --- */
.sort-indicator-wrapper {
  margin-left: 4px;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sort-indicator.active {
  color: var(--el-color-primary);
}
.sort-indicator-hover {
  color: #c0c4cc;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}
.file-list-header .column:hover .sort-indicator-hover {
  opacity: 1;
}

.column-add {
  margin-left: auto; /* 将按钮推到最右边 */
  padding: 0 16px;
  .el-icon {
    cursor: pointer;
    font-size: 16px;
    color: #909399;
    &:hover {
      color: var(--el-color-primary);
    }
  }
}

/* --- 动画 --- */
.header-list-move,
.header-list-enter-active,
.header-list-leave-active,
.cell-list-move,
.cell-list-enter-active,
.cell-list-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}
.header-list-enter-from,
.header-list-leave-to,
.cell-list-enter-from,
.cell-list-leave-to {
  opacity: 0;
  transform: scaleY(0.01);
}
.header-list-leave-active,
.cell-list-leave-active {
  position: absolute;
  width: 100%;
}

/* --- 其他状态样式 --- */
.file-item:hover {
  background-color: #f8fafc;
}
.file-item.selected {
  color: #fff;
  background-color: var(--anzhiyu-theme, #007bff) !important;
  .column-name-content,
  .column.column-size,
  .column.column-updated_at,
  .column.column-created_at {
    color: #fff !important;
  }
}
.file-item.is-uploading {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
.file-item.is-disabled {
  cursor: not-allowed;
  color: #a8abb2;
  &:hover {
    background-color: transparent;
  }
  .file-icon {
    color: #c0c4cc;
  }
}

.state-view {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
  color: #909399;
  font-size: 14px;
}
.load-more-indicator,
.no-more-indicator {
  padding: 20px 0;
}
.is-loading {
  animation: spin 1.5s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.uploading-indicator {
  animation: spin 1.5s linear infinite;
  margin-left: 8px;
}
</style>
