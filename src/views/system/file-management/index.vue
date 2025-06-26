<template>
  <div
    class="file-management-container"
    @dragenter="dragHandlers.onDragEnter"
    @dragover="dragHandlers.onDragOver"
    @dragleave="dragHandlers.onDragLeave"
    @drop="dragHandlers.onDrop"
    @contextmenu.prevent="handleContextMenuTrigger"
  >
    <!-- 头部区域 -->
    <FileHeard
      class="mb-2 deselect-safe-zone"
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
    <div class="flex w-full deselect-safe-zone">
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
      :queue="uploadQueue"
      @close="handlePanelClose"
      @clear-finished="clearFinishedUploads"
      @cancel-upload="cancelUpload"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";

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
  showUploadProgress,
  addUploadsToQueue,
  cancelUpload,
  clearFinishedUploads
} = useFileUploader(
  computed(() => storagePolicy.value),
  () => fileStore.loadFiles(path.value)
);

// --- 3. 初始化与用户交互相关的 Hooks ---

// 3.1 文件操作 Hook (新建、重命名、删除等)
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

// 3.3 页面交互 Hook (处理拖拽覆盖层等)
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
  handleContextMenuTrigger,
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
  // 导航前清空选择
  clearSelection();
  fileStore.loadFiles(newPath);
};
const handleLoadInitial = () => {
  if (sortedFiles.value.length === 0 && !loading.value) {
    fileStore.loadFiles("/");
  }
};

// 4.5 为 UploadProgress 处理显示逻辑
const isPanelVisible = ref(false);
watch(showUploadProgress, shouldShow => {
  if (shouldShow) isPanelVisible.value = true;
});
const handlePanelClose = () => {
  isPanelVisible.value = false;
};

// --- 5. 视图状态 ---
const viewComponents = {
  list: FileListView,
  grid: FileGridView
};
const activeViewComponent = computed(() => viewComponents[viewMode.value]);
</script>

<style>
/* 样式保持不变 */
.file-management-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative; /* 为遮罩层提供定位上下文 */
}
.file-management-main {
  width: 100%;
  flex: 1; /* 占据剩余空间 */
  min-height: 0; /* 防止在 flex 布局中溢出 */
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border: var(--style-border);
}
.file-content-area {
  flex: 1;
  overflow: auto;
  position: relative; /* 确保内容区可以作为定位参考 */
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
  pointer-events: none; /* 关键：允许下方的 dragleave 事件触发 */
  border-radius: inherit; /* 如果父容器有圆角，则继承 */
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
