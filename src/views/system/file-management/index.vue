<template>
  <div
    ref="fileManagerContainerRef"
    class="file-management-container"
    @dragenter="dragHandlers.onDragEnter"
    @dragover="dragHandlers.onDragOver"
    @dragleave="dragHandlers.onDragLeave"
    @drop="dragHandlers.onDrop"
    @contextmenu.prevent="handleContextMenuTrigger"
    @click="handleContainerClick"
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
      @download="onActionDownload(getSelectedFileItems)"
      @copy="onActionCopy"
      @move="onActionMove(getSelectedFileItems)"
      @share="onActionShare"
    />
    <!-- 面包屑和工具栏 -->
    <div class="flex w-full">
      <FileBreadcrumb
        class="flex-1 mb-2"
        :path="path"
        :parent-info="parentInfo"
        :show-dropdown="true"
        @navigate="handleNavigate"
        @show-details="handleShowDetailsForId"
        @download-folder="handleDownloadFolder"
      />
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

    <!-- === 浮层组件 === -->
    <!-- 文件移动 -->
    <MoveModal
      v-model="isMoveModalVisible"
      :items-to-move="itemsToMove"
      @move-success="handleMoveSuccess"
    />
    <!-- 详情面板 -->
    <FileDetailsPanel :file="detailsPanelFile" @close="closeDetailsPanel" />
    <!-- 搜索 -->
    <SearchOverlay
      :visible="isSearchVisible"
      :origin="searchOrigin"
      @close="isSearchVisible = false"
    />
    <!-- 右键菜单 -->
    <ContextMenu
      :trigger-event="contextMenuTriggerEvent"
      :selected-file-ids="selectedFiles"
      @request-select-single="selectSingle"
      @select="onMenuSelect"
      @closed="handleContextMenuClosed"
    />
    <!-- 上传进度 -->
    <UploadProgress
      :visible="isPanelVisible"
      :is-collapsed="isPanelCollapsed"
      :queue="uploadQueue"
      :speed-mode="speedDisplayMode"
      @close="handlePanelClose"
      @toggle-collapse="isPanelCollapsed = !isPanelCollapsed"
      @retry-item="uploader.retryItem"
      @remove-item="uploader.removeItem"
      @resolve-conflict="uploader.resolveConflict"
      @global-command="handleUploadGlobalCommand"
      @add-files="handleUploadFile"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { ElMessageBox } from "element-plus";

// --- 核心状态管理 ---
import {
  useFileStore,
  type SortKey,
  type UploaderActions
} from "@/store/modules/fileStore";
// --- 引入所有需要的 Hooks ---
import { useFileUploader } from "@/composables/useFileUploader";
import { useFileSelection } from "@/composables/useFileSelection";
import { useFileActions } from "./hooks/useFileActions";
import { useDirectoryUpload } from "./hooks/useDirectoryUpload";
import { useContextMenuHandler } from "./hooks/useContextMenuHandler";
import { usePageInteractions } from "./hooks/usePageInteractions";
import { useFileDownload } from "./hooks/useFileDownload";
import { useFileModals } from "./hooks/useFileModals";
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
import FileDetailsPanel from "./components/FileDetailsPanel.vue";
import MoveModal from "./components/MoveModal.vue";

// 1. 初始化核心 Store 和状态
const fileStore = useFileStore();
const {
  sortedFiles,
  loading,
  path,
  parentInfo,
  storagePolicy,
  viewMode,
  sortKey,
  pageSize
} = storeToRefs(fileStore);

// 2. 初始化基础 Hooks
const {
  selectedFiles,
  selectSingle,
  selectRange,
  toggleSelection,
  selectAll,
  clearSelection,
  invertSelection
} = useFileSelection(sortedFiles);
const hasSelection = computed(() => selectedFiles.value.size > 0);
const isSingleSelection = computed(() => selectedFiles.value.size === 1);
const getSelectedFileItems = () =>
  sortedFiles.value.filter(f => selectedFiles.value.has(f.id));

// 3. 页面导航与刷新逻辑
const uploaderActions: UploaderActions = {
  addResumableTaskFromFileItem: async () => {} // 提供符合类型的占位符
};
const handleRefresh = () => fileStore.loadFiles(path.value, uploaderActions);
const handleNavigate = (newPath: string) => {
  clearSelection();
  fileStore.loadFiles(newPath, uploaderActions);
};

// 4. 初始化功能性 Hooks (依赖基础方法)
const { isDownloading, onActionDownload, handleDownloadFolder } =
  useFileDownload();
const {
  isMoveModalVisible,
  itemsToMove,
  onActionMove,
  handleMoveSuccess,
  detailsPanelFile,
  handleShowDetailsForId,
  closeDetailsPanel
} = useFileModals({ refresh: handleRefresh, clearSelection });
const {
  uploadQueue,
  addUploadsToQueue,
  addResumableTaskFromFileItem,
  ...uploader
} = useFileUploader(
  sortedFiles,
  computed(() => storagePolicy.value),
  () => fileStore.refreshCurrentPath(uploaderActions)
);
uploaderActions.addResumableTaskFromFileItem = addResumableTaskFromFileItem; // 补全 uploaderActions
const {
  handleUploadFile,
  handleUploadDir,
  handleCreateFile,
  handleCreateFolder,
  handleRename,
  handleDelete
} = useFileActions(addUploadsToQueue, path, { onSuccess: handleRefresh });
const { handleDrop } = useDirectoryUpload(addUploadsToQueue, path);
const {
  isDragging,
  dragHandlers,
  isSearchVisible,
  searchOrigin,
  openSearchFromElement
} = usePageInteractions(handleDrop);

// 5. 简单操作 Action (连接到具体实现)
const onActionRename = () => {
  if (isSingleSelection.value) handleRename(getSelectedFileItems()[0]);
};
const onActionDelete = () => {
  handleDelete(getSelectedFileItems());
};
const onActionCopy = () => {
  console.log("Copy action triggered");
};
const onActionShare = () => {
  console.log("Share action triggered");
};

// 6. 右键菜单 Hook (连接所有 actions)
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
  onRefresh: handleRefresh,
  onRename: onActionRename,
  onDelete: onActionDelete,
  onDownload: () => onActionDownload(getSelectedFileItems),
  onCopy: onActionCopy,
  onMove: () => onActionMove(getSelectedFileItems),
  onShare: onActionShare,
  onInfo: () => {
    if (getSelectedFileItems().length > 0)
      handleShowDetailsForId(getSelectedFileItems()[0].id);
  }
});

// 7. 视图与杂项事件处理器
const selectionCountLabel = computed(
  () => `${selectedFiles.value.size} 个对象`
);
const fileManagerContainerRef = ref(null);
const handleContainerClick = (event: MouseEvent) => {
  if (detailsPanelFile.value) {
    if ((event.target as HTMLElement).closest(".details-panel-drawer")) return;
  }
  if (!hasSelection.value) return;
  const ignoredSelectors = [
    ".file-item",
    ".grid-item",
    "[role=button]",
    "[role=menu]",
    "[role=listbox]",
    "input",
    "button",
    ".el-button",
    ".el-popper",
    ".el-overlay",
    ".upload-progress-panel",
    ".context-menu",
    ".search-overlay-container"
  ];
  if (
    ignoredSelectors.some(selector =>
      (event.target as HTMLElement).closest(selector)
    )
  )
    return;
  clearSelection();
};
const handleContextMenuTrigger = (event: MouseEvent) => {
  if (
    !(event.target as HTMLElement).closest(".file-item, .grid-item") &&
    hasSelection.value
  ) {
    clearSelection();
  }
  contextMenuTriggerEvent.value = event;
};
const handleSetViewMode = (mode: "list" | "grid") =>
  fileStore.setViewMode(mode);
const handleSetPageSize = (size: number) => fileStore.setPageSize(size);
const handleSetSortKey = (key: SortKey) => fileStore.setSort(key);

onMounted(() => {
  if (fileStore.files.length === 0 && !fileStore.loading) handleNavigate("/");
});

// 8. 上传面板逻辑 (未来可抽离为 Hook)
const isPanelVisible = ref(false);
const isPanelCollapsed = ref(false);
watch(
  () => uploadQueue.length,
  newLength => {
    if (newLength > 0) isPanelVisible.value = true;
  }
);
const handlePanelClose = () => {
  isPanelVisible.value = false;
};
const handleUploadGlobalCommand = (command: string, value: any) => {
  switch (command) {
    case "overwrite-all":
      uploader.setGlobalOverwriteAndRetry(true);
      break;
    case "retry-all":
      uploader.retryAllFailed();
      break;
    case "clear-finished":
      uploader.clearFinishedUploads();
      break;
    case "set-concurrency":
      ElMessageBox.prompt("请输入新的并发上传数 (1-10)", "设置并发数", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputValue: String(uploader.concurrency.value),
        inputPattern: /^[1-9]$|^10$/,
        inputErrorMessage: "请输入 1 到 10 之间的整数"
      })
        .then(({ value }) => {
          uploader.setConcurrency(Number(value));
        })
        .catch(() => {});
      break;
    case "set-speed-mode":
      uploader.setSpeedMode(value);
      break;
  }
};
const speedDisplayMode = computed(() => uploader.speedDisplayMode.value);

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
