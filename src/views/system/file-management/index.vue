<template>
  <div
    ref="fileManagerContainerRef"
    class="file-management-container"
    @click="handleInternalClick"
    @dragenter="dragHandlers.onDragEnter"
    @dragover="dragHandlers.onDragOver"
    @dragleave="dragHandlers.onDragLeave"
    @drop="dragHandlers.onDrop"
    @contextmenu.prevent="handleContextMenuTrigger"
  >
    <!-- 头部区域 -->
    <FileHeard
      class="mb-2"
      :has-selection="hasSelection"
      :is-single-selection="isSingleSelection"
      :selection-count-label="selectionCountLabel"
      @open-new-menu="openBlankMenu"
      @trigger-search="openSearchFromElement"
      @clear-selection="clearSelection"
      @rename="onActionRename"
      @delete="onActionDelete"
      @download="onActionDownload"
      @copy="onActionCopy"
      @move="onActionMove"
      @share="onActionShare"
    />
    <!-- 面包屑和工具栏 -->
    <div class="flex w-full">
      <FileBreadcrumb class="flex-1 mb-2" />
      <FileToolbar
        class="mb-2 ml-2"
        :view-mode="viewMode"
        :sort-key="sortKey"
        :page-size="pageSize"
        :has-selection="hasSelection"
        @refresh="handleRefresh"
        @select-all="selectAll"
        @clear-selection="clearSelection"
        @invert-selection="invertSelection"
        @set-view-mode="handleSetViewMode"
        @set-page-size="handleSetPageSize"
        @set-sort-key="handleSetSortKey"
      />
    </div>

    <!-- 主内容区 -->
    <div class="file-management-main rounded-2xl overflow-hidden">
      <div class="file-content-area">
        <component
          :is="activeViewComponent"
          :files="sortedFiles"
          :loading="loading"
          :selected-file-ids="selectedFiles"
          @select-single="selectSingle"
          @select-range="selectRange"
          @toggle-selection="toggleSelection"
          @select-all="selectAll"
          @navigate-to="handleNavigate"
          @load-initial="handleLoadInitial"
        />
      </div>
    </div>

    <!-- 拖拽上传遮罩层 -->
    <div v-if="isDragging" class="drag-overlay">
      <div class="drag-content">
        <el-icon><UploadFilled /></el-icon>
        <span>松开鼠标开始上传</span>
        <p>将文件或目录拖拽至此</p>
      </div>
    </div>

    <!-- 其他浮层组件 -->
    <SearchOverlay
      :visible="isSearchVisible"
      :origin="searchOrigin"
      @close="isSearchVisible = false"
    />
    <ContextMenu
      :trigger-event="contextMenuTriggerEvent"
      :selected-file-ids="selectedFiles"
      @request-select-single="selectSingle"
      @select="onMenuSelect"
      @closed="handleContextMenuClosed"
    />

    <UploadProgress
      :visible="isPanelVisible"
      :is-collapsed="isPanelCollapsed"
      :queue="uploadQueue"
      :speed-mode="speedMode"
      @close="handlePanelClose"
      @toggle-collapse="isPanelCollapsed = !isPanelCollapsed"
      @retry-item="retryItem"
      @remove-item="removeItem"
      @resolve-conflict="resolveConflict"
      @global-command="handleUploadGlobalCommand"
      @add-files="handleUploadFile"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch, Ref } from "vue";
import { storeToRefs } from "pinia";
import { ElMessageBox } from "element-plus";
import { onClickOutside } from "@vueuse/core";

// --- 核心状态管理 ---
import { useFileStore, type SortKey } from "@/store/modules/fileStore";

// --- 引入所有需要的 Hooks ---
import { useFileUploader } from "@/composables/useFileUploader";
import { useFileSelection } from "@/composables/useFileSelection";
import { useFileActions } from "./hooks/useFileActions";
import { useDirectoryUpload } from "./hooks/useDirectoryUpload";
import { useContextMenuHandler } from "./hooks/useContextMenuHandler";
import { usePageInteractions } from "./hooks/usePageInteractions";

// --- 引入所有需要的子组件 ---
import FileHeard from "./components/FileHeard.vue";
import FileBreadcrumb from "./components/FileBreadcrumb.vue";
import FileToolbar from "./components/FileToolbar.vue";
import FileListView from "./components/FileListView.vue";
import FileGridView from "./components/FileGridView.vue";
import UploadProgress from "./components/UploadProgress.vue";
import ContextMenu from "./components/ContextMenu.vue";
import SearchOverlay from "./components/SearchOverlay.vue";
import { UploadFilled } from "@element-plus/icons-vue";

// --- 1. 初始化核心 Store 和状态 ---
const fileStore = useFileStore();
const {
  sortedFiles,
  loading,
  path,
  storagePolicy,
  viewMode,
  sortKey,
  pageSize
} = storeToRefs(fileStore);

// --- 2. 初始化核心功能 Hooks ---

// 2.1 文件选择 Hook
const {
  selectedFiles,
  selectSingle,
  selectRange,
  toggleSelection,
  selectAll,
  clearSelection,
  invertSelection
} = useFileSelection(sortedFiles);

// 2.2 文件上传 Hook
const {
  uploadQueue,
  addUploadsToQueue,
  removeItem,
  retryItem,
  retryAllFailed,
  resolveConflict,
  setGlobalOverwriteAndRetry,
  clearFinishedUploads,
  setConcurrency,
  concurrency
} = useFileUploader(
  sortedFiles,
  computed(() => storagePolicy.value),
  () => fileStore.loadFiles(path.value)
);

// --- 3. 初始化与用户交互相关的 Hooks ---

// 3.1 文件操作 Hook
const {
  handleUploadFile,
  handleUploadDir,
  handleCreateFile,
  handleCreateFolder,
  handleRename,
  handleDelete
} = useFileActions(addUploadsToQueue, path);

// 3.2 拖拽上传 Hook
const { handleDrop } = useDirectoryUpload(addUploadsToQueue, path);

// 3.3 页面交互 Hook
const {
  isDragging,
  dragHandlers,
  isSearchVisible,
  searchOrigin,
  openSearchFromElement
} = usePageInteractions(handleDrop);

// 3.4 上下文菜单 Hook
const {
  contextMenuTriggerEvent,
  onMenuSelect,
  handleContextMenuClosed,
  openBlankMenu
} = useContextMenuHandler({
  onUploadFile: handleUploadFile,
  onUploadDir: handleUploadDir,
  onCreateFolder: handleCreateFolder,
  onCreateMd: () => handleCreateFile("md"),
  onCreateTxt: () => handleCreateFile("txt"),
  onRefresh: () => fileStore.loadFiles(path.value),
  onRename: onActionRename,
  onDelete: onActionDelete,
  onDownload: onActionDownload,
  onCopy: onActionCopy,
  onMove: onActionMove,
  onShare: onActionShare,
  onInfo: () => console.log("Info action triggered")
});

// --- 4. 准备传递给子组件的 Props 和事件处理器 ---

// 4.1 为 FileHeard 和 FileToolbar 计算 Props
const hasSelection = computed(() => selectedFiles.value.size > 0);
const isSingleSelection = computed(() => selectedFiles.value.size === 1);
const selectionCountLabel = computed(
  () => `${selectedFiles.value.size} 个对象`
);

// --- 核心交互逻辑 ---

const fileManagerContainerRef = ref(null);
const speedMode: Ref<"instant" | "average"> = ref("instant");

// **策略一: 处理组件外部的点击**
onClickOutside(
  fileManagerContainerRef,
  () => {
    if (hasSelection.value) {
      clearSelection();
    }
  },
  {
    ignore: [
      ".el-popper",
      ".el-overlay",
      ".upload-progress-panel",
      ".context-menu-overlay",
      ".context-menu"
    ]
  }
);

/**
 * **策略二: 处理组件内部的点击**
 */
const handleInternalClick = (event: MouseEvent) => {
  if (!hasSelection.value) return;

  const target = event.target as HTMLElement;

  // 关键逻辑: 如果点击的是任何明确的交互项，则不取消选择。
  // 我们不再依赖特定 class，而是通过更通用的方式判断。

  // 1. 如果点击的是文件项，则不取消选择
  if (target.closest(".file-item, .grid-item")) {
    return;
  }

  // 2. 如果点击的是 Element Plus 的按钮或输入框，则不取消选择
  if (target.closest(".el-button, .el-input, .el-select, .el-dropdown")) {
    return;
  }

  // 3. 如果点击的是我们自定义的、可点击的图标，也不取消选择
  // (这是一个备用规则，以防有些图标不是el-button)
  if (target.closest(".action-icon")) {
    return;
  }

  // 如果代码能执行到这里，说明点击的是组件内部的“空白区域”。
  clearSelection();
};

/**
 * 处理右键点击
 */
const handleContextMenuTrigger = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  const clickedOnItem = target.closest(".file-item, .grid-item");

  if (!clickedOnItem) {
    if (hasSelection.value) {
      clearSelection();
    }
  }
  contextMenuTriggerEvent.value = event;
};

// 4.2 为 FileHeard 和右键菜单实现事件处理器
const getSelectedFileItems = () =>
  sortedFiles.value.filter(f => selectedFiles.value.has(f.id));
function onActionRename() {
  if (isSingleSelection.value) handleRename(getSelectedFileItems()[0]);
}
function onActionDelete() {
  handleDelete(getSelectedFileItems());
}
function onActionDownload() {
  console.log("Download:", getSelectedFileItems());
}
function onActionCopy() {
  console.log("Copy:", getSelectedFileItems());
}
function onActionMove() {
  console.log("Move:", getSelectedFileItems());
}
function onActionShare() {
  console.log("Share:", getSelectedFileItems());
}

// 4.3 为 FileToolbar 实现事件处理器
const handleRefresh = () => fileStore.loadFiles(path.value);
const handleSetViewMode = (mode: "list" | "grid") =>
  fileStore.setViewMode(mode);
const handleSetPageSize = (size: number) => fileStore.setPageSize(size);
const handleSetSortKey = (key: SortKey) => fileStore.setSort(key);

// 4.4 为 FileList / FileGrid 实现事件处理器
const handleNavigate = (newPath: string) => {
  clearSelection();
  fileStore.loadFiles(newPath);
};
const handleLoadInitial = () => {
  if (sortedFiles.value.length === 0 && !loading.value)
    fileStore.loadFiles("/");
};

// 4.5 为 UploadProgress 处理显示逻辑和事件
const isPanelVisible = ref(false);
const isPanelCollapsed = ref(false);

watch(
  () => uploadQueue.length,
  (newLength, oldLength) => {
    if (newLength > 0 && oldLength === 0) {
      isPanelVisible.value = true;
      isPanelCollapsed.value = false;
    }
  }
);

const handlePanelClose = () => {
  isPanelVisible.value = false;
};

// 实现处理全局上传命令的函数
const handleUploadGlobalCommand = (command: string) => {
  switch (command) {
    case "overwrite-all":
      setGlobalOverwriteAndRetry(true);
      break;
    case "retry-all":
      retryAllFailed();
      break;
    case "clear-finished":
      clearFinishedUploads();
      break;
    case "set-concurrency":
      ElMessageBox.prompt("请输入新的并发上传数 (1-10)", "设置并发数", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputValue: String(concurrency.value),
        inputPattern: /^[1-9]$|^10$/,
        inputErrorMessage: "请输入 1 到 10 之间的整数"
      })
        .then(({ value }) => {
          setConcurrency(Number(value));
        })
        .catch(() => {});
      break;
  }
};

// --- 5. 视图状态 ---
const viewComponents = { list: FileListView, grid: FileGridView };
const activeViewComponent = computed(() => viewComponents[viewMode.value]);
</script>

<style>
.file-management-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}
.file-management-main {
  width: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border: var(--style-border);
}
.file-content-area {
  flex: 1;
  overflow: auto;
  position: relative;
}
.drag-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  pointer-events: none;
  border-radius: inherit;
}
.drag-content {
  text-align: center;
}
.drag-content .el-icon {
  font-size: 80px;
}
.drag-content span {
  display: block;
  font-size: 24px;
  margin-top: 20px;
}
.drag-content p {
  font-size: 16px;
  color: #eee;
  margin-top: 8px;
}
</style>
