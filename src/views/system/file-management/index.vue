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
      @share="onActionShare"
      @copy="onActionCopy(getSelectedFileItems)"
      @move="onActionMove(getSelectedFileItems)"
    />
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
        :is-simplified="false"
        @refresh="handleRefresh"
        @select-all="selectAll"
        @clear-selection="clearSelection"
        @invert-selection="invertSelection"
        @set-view-mode="handleSetViewMode"
        @set-page-size="handleSetPageSize"
        @set-sort-key="handleSetSortKey"
      />
    </div>

    <div class="file-management-main rounded-2xl overflow-hidden">
      <div
        ref="fileContentAreaRef"
        class="file-content-area"
        @scroll="handleScroll"
      >
        <component
          :is="activeViewComponent"
          :files="sortedFiles"
          :loading="loading"
          :selected-file-ids="selectedFiles"
          :is-more-loading="isMoreLoading"
          @select-single="selectSingle"
          @select-range="selectRange"
          @toggle-selection="toggleSelection"
          @select-all="selectAll"
          @navigate-to="handleNavigate"
        />
      </div>
    </div>

    <div v-if="isDragging" class="drag-overlay">
      <div class="drag-content">
        <el-icon><UploadFilled /></el-icon>
        <span>松开鼠标开始上传</span>
        <p>将文件或目录拖拽至此</p>
      </div>
    </div>

    <MoveModal
      v-model="isDestinationModalVisible"
      :items-for-action="itemsForAction"
      :mode="destinationModalMode"
      @success="handleActionSuccess"
    />
    <FileDetailsPanel :file="detailsPanelFile" @close="closeDetailsPanel" />
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

import {
  useFileStore,
  type SortKey,
  type UploaderActions
} from "@/store/modules/fileStore";
import { useFileUploader } from "@/composables/useFileUploader";
import { useFileSelection } from "@/composables/useFileSelection";
import { useFileActions } from "./hooks/useFileActions";
import { useDirectoryUpload } from "./hooks/useDirectoryUpload";
import { useContextMenuHandler } from "./hooks/useContextMenuHandler";
import { usePageInteractions } from "./hooks/usePageInteractions";
import { useFileDownload } from "./hooks/useFileDownload";
import { useFileModals } from "./hooks/useFileModals";

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
  pageSize,
  // 核心修改：从 store 获取分页和加载状态
  pagination,
  isMoreLoading
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
  addResumableTaskFromFileItem: async () => {}
};
// 核心修改：刷新和导航时，确保从第1页开始加载
const handleRefresh = () => fileStore.loadFiles(path.value, uploaderActions, 1);
const handleNavigate = (newPath: string) => {
  clearSelection();
  fileStore.loadFiles(newPath, uploaderActions, 1);
};

// 4. 初始化功能性 Hooks
const { isDownloading, onActionDownload, handleDownloadFolder } =
  useFileDownload();
const {
  isDestinationModalVisible,
  itemsForAction,
  destinationModalMode,
  onActionMove,
  onActionCopy,
  handleActionSuccess,
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
uploaderActions.addResumableTaskFromFileItem = addResumableTaskFromFileItem;
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

// 5. 简单操作 Action
const onActionRename = () => {
  if (isSingleSelection.value) handleRename(getSelectedFileItems()[0]);
};
const onActionDelete = () => {
  // handleDelete 是一个 async 函数，它返回一个 Promise
  handleDelete(getSelectedFileItems()).then(success => {
    // 只有当删除操作成功时（用户没有取消对话框），才清空选择
    if (success) {
      clearSelection();
    }
  });
};
const onActionShare = () => {
  console.log("Share action triggered");
};

// 6. 右键菜单 Hook
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
  onCopy: () => onActionCopy(getSelectedFileItems),
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
const fileContentAreaRef = ref<HTMLElement | null>(null); // 新增 ref

const handleContainerClick = (event: MouseEvent) => {
  if (
    detailsPanelFile.value &&
    (event.target as HTMLElement).closest(".details-panel-drawer")
  )
    return;
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
  if (fileStore.files.length === 0 && !fileStore.loading) {
    handleNavigate("/");
  }
});

let throttleTimer: number | null = null;
const handleScroll = () => {
  if (throttleTimer) return;
  throttleTimer = window.setTimeout(() => {
    const el = fileContentAreaRef.value;
    if (!el) return;

    const canLoadMore = pagination.value.page < pagination.value.total_page;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;

    if (isAtBottom && canLoadMore && !loading.value && !isMoreLoading.value) {
      const nextPage = pagination.value.page + 1;
      fileStore.loadFiles(path.value, uploaderActions, nextPage);
    }

    throttleTimer = null;
  }, 200);
};

// 8. 上传面板逻辑
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
  margin: 0 auto !important;
  padding: 24px;
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
