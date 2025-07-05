<template>
  <div class="file-list-container">
    <!-- 表头区域 -->
    <div
      ref="headerRef"
      class="file-list-header"
      :style="{
        transform: `translateX(-${scrollLeft}px)`,
        paddingRight: `${scrollbarWidth}px`
      }"
      @mouseenter="isHeaderHovered = true"
      @mouseleave="isHeaderHovered = false"
    >
      <div
        v-for="(col, index) in localColumns"
        :key="col.type"
        :style="getColumnStyle(col)"
        :class="['column', `column-${columnTypeMap[col.type].key}`]"
        @click="handleHeaderClick(columnTypeMap[col.type].key)"
        @mouseenter="hoveredHeaderKey = columnTypeMap[col.type].key"
        @mouseleave="hoveredHeaderKey = null"
      >
        <span>{{ columnTypeMap[col.type].name }}</span>

        <div class="sort-indicator-wrapper">
          <div
            v-if="currentSort.key === columnTypeMap[col.type].key"
            class="sort-indicator active"
          >
            <el-icon v-if="currentSort.dir === 'asc'"><CaretTop /></el-icon>
            <el-icon v-else><CaretBottom /></el-icon>
          </div>
          <div
            v-else-if="hoveredHeaderKey === columnTypeMap[col.type].key"
            class="sort-indicator-hover"
          >
            <el-icon><CaretBottom /></el-icon>
          </div>
        </div>

        <div
          v-if="index < localColumns.length - 1"
          class="column-resizer"
          :class="{
            'is-hovered': hoveredResizerIndex === index,
            'is-resizing':
              resizeState.isResizing && resizeState.columnIndex === index
          }"
          @mousedown="startResize($event, index)"
          @mouseenter="hoveredResizerIndex = index"
          @mouseleave="hoveredResizerIndex = null"
        />
      </div>

      <!-- + 按钮现在在 flex 布局的末尾 -->
      <div class="column-add-container">
        <transition name="add-btn-slide">
          <div v-if="isHeaderHovered" class="column-add">
            <el-tooltip content="配置列" placement="top">
              <div class="add-btn-wrapper">
                <el-icon @click="emit('open-column-settings')"
                  ><Plus
                /></el-icon>
              </div>
            </el-tooltip>
          </div>
        </transition>
      </div>
    </div>

    <!-- 虚拟滚动容器 -->
    <div
      ref="scrollContainerRef"
      class="virtual-scroll-container"
      @scroll="handleScroll"
    >
      <!-- “幽灵”占位符，撑开滚动条 -->
      <div
        class="virtual-sizer"
        :style="{ height: `${totalHeight}px`, width: `${actualTotalWidth}px` }"
      />

      <!-- 内容渲染区域 -->
      <ul
        class="file-list-body"
        :style="{ transform: `translateY(${contentOffset}px)` }"
      >
        <li
          v-if="!visibleFiles.length && !loading && !isMoreLoading"
          class="state-view"
          :style="{ width: `${actualTotalWidth}px` }"
        >
          <span>这里什么都没有</span>
        </li>

        <li
          v-for="item in visibleFiles"
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
          <div
            v-for="col in localColumns"
            :key="col.type"
            :style="getColumnStyle(col)"
            :class="['column', `column-${columnTypeMap[col.type].key}`]"
          >
            <!-- ...模板内容不变... -->
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
            <template v-else-if="columnTypeMap[col.type].key === 'size'">
              {{ item.type === FileType.File ? formatSize(item.size) : "--" }}
            </template>
            <template v-else-if="columnTypeMap[col.type].key === 'updated_at'">
              {{ formatRelativeTime(item.updated_at) }}
            </template>
            <template v-else-if="columnTypeMap[col.type].key === 'created_at'">
              {{ formatRelativeTime(item.created_at) }}
            </template>
          </div>
        </li>
      </ul>

      <!-- 状态指示器 -->
      <div v-if="isMoreLoading" class="state-view-overlay bottom-indicator">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </div>
      <div
        v-else-if="!hasMore && files.length > 0"
        class="state-view-overlay bottom-indicator"
      >
        <span>— 没有更多了 —</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  type PropType,
  reactive,
  watch
} from "vue";
import { formatSize, formatRelativeTime } from "@/utils/format";
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
  (e: "scroll-to-load"): void;
  (e: "set-sort-key", key: SortKey): void;
  (e: "open-column-settings"): void;
  (e: "set-columns", columns: ColumnConfig[]): void;
}>();

const columnTypeMap = {
  0: { key: "name", name: "文件名" },
  1: { key: "size", name: "大小" },
  2: { key: "updated_at", name: "修改日期" },
  3: { key: "created_at", name: "创建日期" }
} as const;

// --- 虚拟滚动核心状态 ---
const scrollContainerRef = ref<HTMLElement | null>(null);
const itemHeight = 40;
const bufferSize = 5;

const viewportHeight = ref(0);
const scrollTop = ref(0);
const scrollLeft = ref(0);

// --- 本地列状态 & 宽度计算 ---
const localColumns = ref<ColumnConfig[]>([]);
const actualTotalWidth = ref(0); // 改为 ref，用于存储测量后的真实宽度

// --- 虚拟滚动计算属性 ---
const totalHeight = computed(() => props.files.length * itemHeight);
const visibleItemCount = computed(() => {
  if (viewportHeight.value === 0) return 0;
  return Math.ceil(viewportHeight.value / itemHeight);
});
const startIndex = computed(() => {
  const start = Math.floor(scrollTop.value / itemHeight);
  return Math.max(0, start - bufferSize);
});
const endIndex = computed(() => {
  const end = startIndex.value + visibleItemCount.value + bufferSize * 2;
  return Math.min(props.files.length, end);
});
const visibleFiles = computed(() => {
  return props.files.slice(startIndex.value, endIndex.value);
});
const contentOffset = computed(() => {
  return startIndex.value * itemHeight;
});

// --- 事件处理 ---
const handleScroll = () => {
  if (!scrollContainerRef.value) return;
  const {
    scrollTop: newScrollTop,
    scrollLeft: newScrollLeft,
    scrollHeight,
    clientHeight
  } = scrollContainerRef.value;
  scrollTop.value = newScrollTop;
  scrollLeft.value = newScrollLeft;

  const proactiveThreshold = clientHeight * 1.5;
  const shouldLoadMore =
    scrollHeight > 0 &&
    scrollHeight - newScrollTop - clientHeight < proactiveThreshold;

  if (shouldLoadMore && props.hasMore && !props.isMoreLoading) {
    emit("scroll-to-load");
  }
};

// --- 生命周期钩子 & 观察器 ---
let vScrollObserver: ResizeObserver | null = null;
let headerObserver: ResizeObserver | null = null;

onMounted(() => {
  // 观察滚动容器的高度变化
  if (scrollContainerRef.value) {
    viewportHeight.value = scrollContainerRef.value.clientHeight;
    vScrollObserver = new ResizeObserver(entries => {
      viewportHeight.value = entries[0]?.contentRect.height || 0;
    });
    vScrollObserver.observe(scrollContainerRef.value);
  }

  // 观察表头的宽度变化
  if (headerRef.value) {
    headerObserver = new ResizeObserver(entries => {
      actualTotalWidth.value = entries[0]?.target.scrollWidth || 0;
    });
    headerObserver.observe(headerRef.value);
  }

  window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  vScrollObserver?.disconnect();
  headerObserver?.disconnect();
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("mousemove", handleResizing);
  window.removeEventListener("mouseup", stopResizing);
});

const headerRef = ref<HTMLElement | null>(null);
const scrollbarWidth = ref(0);
const resizeState = reactive({
  isResizing: false,
  startClientX: 0,
  startWidth: 0,
  columnIndex: -1,
  minWidth: 80
});

watch(
  () => props.columns,
  newColumns => {
    if (!resizeState.isResizing) {
      localColumns.value = JSON.parse(JSON.stringify(newColumns));
    }
  },
  { immediate: true, deep: true }
);

type ColumnKey = (typeof columnTypeMap)[keyof typeof columnTypeMap]["key"];

const currentSort = computed(() => {
  const parts = props.sortKey.split("_");
  const dir = parts.pop();
  const key = parts.join("_");
  return { key, dir };
});

const justFinishedResizing = ref(false);
const hoveredResizerIndex = ref<number | null>(null);
const isHeaderHovered = ref(false);
const hoveredHeaderKey = ref<ColumnKey | null>(null);

const handleHeaderClick = (key: ColumnKey) => {
  if (justFinishedResizing.value) {
    justFinishedResizing.value = false;
    return;
  }
  if (currentSort.value.key === key) {
    const newDir = currentSort.value.dir === "asc" ? "desc" : "asc";
    emit("set-sort-key", `${key}_${newDir}` as SortKey);
  } else {
    const newDir = key === "name" ? "asc" : "desc";
    emit("set-sort-key", `${key}_${newDir}` as SortKey);
  }
};

const startResize = (event: MouseEvent, index: number) => {
  event.preventDefault();
  event.stopPropagation();
  const currentColumn = localColumns.value[index];
  if (!currentColumn) return;
  const columnElement = (event.target as HTMLElement).closest<HTMLElement>(
    ".column"
  );
  const startWidth =
    currentColumn.width || columnElement?.offsetWidth || resizeState.minWidth;
  resizeState.columnIndex = index;
  resizeState.startClientX = event.clientX;
  resizeState.startWidth = startWidth;
  window.addEventListener("mousemove", handleResizing);
  window.addEventListener("mouseup", stopResizing);
};

const handleResizing = (event: MouseEvent) => {
  if (resizeState.columnIndex === -1) return;
  if (!resizeState.isResizing) {
    resizeState.isResizing = true;
  }
  const deltaX = event.clientX - resizeState.startClientX;
  const newWidth = Math.max(
    resizeState.startWidth + deltaX,
    resizeState.minWidth
  );
  if (localColumns.value[resizeState.columnIndex]) {
    localColumns.value[resizeState.columnIndex].width = Math.round(newWidth);
  }
};

const stopResizing = () => {
  window.removeEventListener("mousemove", handleResizing);
  window.removeEventListener("mouseup", stopResizing);
  if (resizeState.isResizing) {
    justFinishedResizing.value = true;
    emit("set-columns", JSON.parse(JSON.stringify(localColumns.value)));
  }
  resizeState.isResizing = false;
  resizeState.columnIndex = -1;
};

const getColumnStyle = (col: ColumnConfig) => {
  if (col.width) {
    return { flex: "none", width: `${col.width}px` };
  }
  const key = columnTypeMap[col.type].key;
  switch (key) {
    case "name":
      return { flex: "5" };
    case "size":
      return { flex: "1.5", justifyContent: "flex-start" };
    case "updated_at":
    case "created_at":
      return { flex: "2.5" };
    default:
      return { flex: "1" };
  }
};

const { getFileIcon } = useFileIcons();
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
  if (event.shiftKey) emit("select-range", item.id);
  else if (event.metaKey || event.ctrlKey) emit("toggle-selection", item.id);
  else emit("select-single", item.id);
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
</script>

<style scoped lang="scss">
.file-list-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.file-list-header {
  display: flex;
  align-items: center;
  color: #64748b;
  font-weight: 500;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
  user-select: none;
  position: relative;
  z-index: 10;
  background-color: #fff;
  box-sizing: border-box;
  /* 让内容宽度决定自身宽度，而不是100% */
  width: fit-content;
  min-width: 100%;
}

.virtual-scroll-container {
  flex: 1;
  overflow: auto;
  position: relative;
  min-height: 0;
}

.virtual-sizer {
  position: absolute;
  top: 0;
  left: 0;
  height: 0;
  /* width 由JS动态设置 */
}

.file-list-body {
  position: absolute;
  top: 0;
  left: 0;
  min-width: 100%; /* 确保在内容少时也撑满 */
  width: fit-content; /* 宽度由内容决定 */
  padding: 0 8px;
  box-sizing: border-box;
}

.file-item {
  display: flex;
  align-items: center;
  height: 38px;
  margin: 1px 0;
  border-radius: 6px;
  transition: background-color 0.2s ease;
  user-select: none;
  box-sizing: border-box;
}

.column {
  padding: 12px 8px;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  position: relative;
  flex-shrink: 0;
  box-sizing: border-box;

  &.column-name {
    padding-left: 20px;
  }
  &.column-size {
    color: #64748b;
  }
  &.column-updated_at,
  &.column-created_at {
    color: #64748b;
  }
}

.state-view {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
  color: #909399;
  font-size: 14px;
  box-sizing: border-box;
  position: absolute;
  top: 0;
  left: 0;
}

.state-view-overlay {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  align-items: center;
  color: #909399;
  font-size: 14px;
  pointer-events: none;

  &.bottom-indicator {
    bottom: 20px;
  }
}

.file-list-header .column {
  cursor: pointer;
  transition: background-color 0.2s;
  &:hover {
    background-color: #f8fafc;
  }
}

.column-resizer {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  bottom: 0;
  width: 3px;
  height: 60%;
  border-radius: 8px;
  cursor: col-resize;
  z-index: 10;
  background-color: transparent;
  transition:
    background-color 0.2s ease-in-out,
    width 0.2s ease-in-out;

  &::before {
    content: "";
    position: absolute;
    top: -10px;
    bottom: -10px;
    left: -7px;
    right: -7px;
    background-color: transparent;
    cursor: col-resize;
  }

  &.is-hovered,
  &.is-resizing {
    background-color: var(--anzhiyu-theme);
    width: 5px;
  }
}

.column-add-container {
  flex-grow: 1; /* 占据所有剩余空间 */
  position: relative;
  min-width: 50px; /* 保证有一个最小宽度 */
}

.column-add {
  position: absolute;
  /* 不再使用 right 定位，而是 left */
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
}

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

.add-btn-wrapper {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease-in-out;

  .el-icon {
    font-size: 18px;
    color: #606266;
  }

  &:hover {
    background-color: var(--el-color-primary);
    .el-icon {
      color: #fff;
    }
  }
}

.add-btn-slide-enter-active,
.add-btn-slide-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.add-btn-slide-enter-from,
.add-btn-slide-leave-to {
  opacity: 0;
  transform: translateY(-50%) translateX(20px);
}
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
