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
        ref="fileToolbarRef"
        class="mb-2 ml-2"
        :view-mode="viewMode"
        :sort-key="sortKey"
        :page-size="pageSize"
        :has-selection="hasSelection"
        :is-simplified="false"
        :columns="columns"
        @refresh="handleRefresh"
        @select-all="selectAll"
        @clear-selection="clearSelection"
        @invert-selection="invertSelection"
        @set-view-mode="handleSetViewMode"
        @set-page-size="handleSetPageSize"
        @set-sort-key="handleSetSortKey"
        @set-columns="handleSetColumns"
      />
    </div>

    <div class="file-management-main rounded-2xl overflow-hidden">
      <transition name="loading-fade">
        <div v-if="loading" class="loading-overlay">
          <div class="loading-spinner" />
        </div>
      </transition>

      <div class="file-content-area">
        <component
          :is="activeViewComponent"
          :files="sortedFiles"
          :loading="loading"
          :selected-file-ids="selectedFiles"
          :is-more-loading="isMoreLoading"
          :has-more="hasMore"
          :columns="columns"
          :sort-key="sortKey"
          @select-single="selectSingle"
          @select-range="selectRange"
          @toggle-selection="toggleSelection"
          @select-all="selectAll"
          @navigate-to="handleNavigate"
          @scroll="handleScroll"
          @set-sort-key="handleSetSortKey"
          @open-column-settings="handleOpenColumnSettings"
          @set-columns="handleSetColumns"
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
      :is-global-overwrite="globalOverwrite"
      @close="handlePanelClose"
      @toggle-collapse="isPanelCollapsed = !isPanelCollapsed"
      @retry-item="retryItem"
      @remove-item="removeItem"
      @resolve-conflict="resolveConflict"
      @global-command="handleUploadGlobalCommand"
      @add-files="() => handleUploadFile()"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { ElMessageBox } from "element-plus";
import { UploadFilled } from "@element-plus/icons-vue";

// 工具 & Store
import { buildFullUri, extractLogicalPathFromUri } from "@/utils/fileUtils";
import {
  useFileStore,
  type SortKey,
  type UploaderActions
} from "@/store/modules/fileStore";
import type { ColumnConfig } from "@/api/sys-file/type";

// Composables
import { useFileUploader } from "@/composables/useFileUploader";
import { useFileSelection } from "@/composables/useFileSelection";
import { useFileActions } from "./hooks/useFileActions";
import { useDirectoryUpload } from "./hooks/useDirectoryUpload";
import { useContextMenuHandler } from "./hooks/useContextMenuHandler";
import { usePageInteractions } from "./hooks/usePageInteractions";
import { useFileDownload } from "./hooks/useFileDownload";
import { useFileModals } from "./hooks/useFileModals";

// Components
import FileToolbar from "./components/FileToolbar.vue";
import FileHeard from "./components/FileHeard.vue";
import FileBreadcrumb from "./components/FileBreadcrumb.vue";
import FileListView from "./components/FileListView.vue";
import FileGridView from "./components/FileGridView.vue";
import UploadProgress from "./components/UploadProgress.vue";
import ContextMenu from "./components/ContextMenu.vue";
import SearchOverlay from "./components/SearchOverlay.vue";
import FileDetailsPanel from "./components/FileDetailsPanel.vue";
import MoveModal from "./components/MoveModal.vue";

// --- 1. 核心实例和状态 ---
const route = useRoute();
const router = useRouter();
const fileStore = useFileStore();
const fileToolbarRef = ref<InstanceType<typeof FileToolbar> | null>(null);

const {
  sortedFiles,
  loading,
  path,
  parentInfo,
  storagePolicy,
  viewMode,
  sortKey,
  pageSize,
  isMoreLoading,
  hasMore,
  columns
} = storeToRefs(fileStore);

const viewComponents = { list: FileListView, grid: FileGridView };
const activeViewComponent = computed(() => viewComponents[viewMode.value]);

// --- 2. 动作与事件处理器 (在此处声明所有将被 Hooks 使用的函数) ---
const handleRefresh = () => fileStore.refreshCurrentPath(uploaderActions);
const handleNavigate = (newLogicalPath: string) => {
  const fullUri = buildFullUri(newLogicalPath);
  if (route.query.path !== fullUri) {
    router.push({ query: { path: fullUri } });
  }
};
const getSelectedFileItems = () =>
  sortedFiles.value.filter(f => selectedFiles.value.has(f.id));

const onActionRename = () => {
  if (isSingleSelection.value) handleRename(getSelectedFileItems()[0]);
};
const onActionDelete = () => {
  handleDelete(getSelectedFileItems()).then(success => {
    if (success) clearSelection();
  });
};
const onActionShare = () => {
  console.log("Share action triggered");
};

const handleSetViewMode = (mode: "list" | "grid") =>
  fileStore.setViewMode(mode);
const handleSetPageSize = (size: number) => fileStore.setPageSize(size);
const handleSetColumns = (newColumns: ColumnConfig[]) => {
  console.log(
    "LOG 2.1: index.vue - handleSetColumns - 已监听到事件，收到的 newColumns:",
    JSON.stringify(newColumns, null, 2)
  );

  setTimeout(() => {
    fileStore.setColumns(newColumns);
    console.log(
      "LOG 2.2: index.vue - handleSetColumns - 已在下一个 tick 中调用 fileStore.setColumns"
    );
  }, 0);
};
const handleSetSortKey = (key: SortKey) => fileStore.setSort(key);
const handleOpenColumnSettings = () => {
  fileToolbarRef.value?.openDialog();
};

// --- 3. 核心功能 Hooks ---
const {
  uploadQueue,
  showUploadProgress,
  concurrency,
  speedDisplayMode,
  addUploadsToQueue,
  addResumableTaskFromFileItem,
  removeItem,
  retryItem,
  retryAllFailed,
  resolveConflict,
  globalOverwrite,
  setGlobalOverwriteAndRetry,
  clearFinishedUploads,
  setConcurrency,
  setSpeedMode
} = useFileUploader(
  sortedFiles,
  computed(() => storagePolicy.value),
  handleRefresh // 直接传递 handleRefresh
);

const uploaderActions: UploaderActions = { addResumableTaskFromFileItem };

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

const isPanelVisible = ref(false);
const isPanelCollapsed = ref(false);
const handleNewUploadsAdded = (hasAdded: boolean) => {
  if (hasAdded) {
    isPanelVisible.value = true;
    isPanelCollapsed.value = false;
  }
};

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
  handleUploadFile,
  handleUploadDir,
  handleCreateFile,
  handleCreateFolder,
  handleRename,
  handleDelete
} = useFileActions(addUploadsToQueue, path, {
  onSuccess: handleRefresh,
  onNewUploads: handleNewUploadsAdded
});

const { handleDrop: processDroppedFiles } = useDirectoryUpload(
  addUploadsToQueue,
  path,
  handleNewUploadsAdded
);

const onDropAdapter = (event: DragEvent) => {
  if (event.dataTransfer) {
    processDroppedFiles(event.dataTransfer);
  }
};

const {
  isDragging,
  dragHandlers,
  isSearchVisible,
  searchOrigin,
  openSearchFromElement
} = usePageInteractions(onDropAdapter);

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

// --- 4. 导航、滚动与其他事件处理 ---
const loadFilesFromRoute = (
  pathQuery: string | string[] | null | undefined
) => {
  const pathUri = Array.isArray(pathQuery) ? pathQuery[0] : pathQuery;
  const logicalPathToLoad = pathUri ? extractLogicalPathFromUri(pathUri) : "/";
  if (logicalPathToLoad !== fileStore.path || fileStore.files.length === 0) {
    clearSelection();
    fileStore.loadFiles(logicalPathToLoad, uploaderActions, true);
  }
};
watch(
  () => route.query.path,
  newPathQuery => {
    loadFilesFromRoute(newPathQuery);
  },
  { immediate: true }
);

let throttleTimer: number | null = null;
const handleScroll = (event: Event) => {
  if (throttleTimer) return;
  throttleTimer = window.setTimeout(() => {
    const el = event.target as HTMLElement;
    if (!el) {
      throttleTimer = null;
      return;
    }
    const canLoadMore = hasMore.value;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (isAtBottom && canLoadMore && !loading.value && !isMoreLoading.value) {
      fileStore.loadFiles(path.value, uploaderActions);
    }
    throttleTimer = null;
  }, 200);
};

const selectionCountLabel = computed(
  () => `${selectedFiles.value.size} 个对象`
);
const fileManagerContainerRef = ref(null);

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

// --- 5. 上传面板逻辑 ---
watch(showUploadProgress, isVisible => {
  if (!isVisible) {
    isPanelVisible.value = false;
  }
});

const handlePanelClose = () => {
  if (
    uploadQueue.some(item =>
      ["uploading", "pending", "error", "conflict"].includes(item.status)
    )
  ) {
    ElMessageBox.confirm(
      "关闭面板会取消所有进行中和待处理的上传任务，确定吗？",
      "警告",
      { confirmButtonText: "确定", cancelButtonText: "取消", type: "warning" }
    )
      .then(() => {
        [...uploadQueue].forEach(item => {
          if (item.status !== "success" && item.status !== "canceled") {
            removeItem(item.id);
          }
        });
        isPanelVisible.value = false;
      })
      .catch(() => {});
  } else {
    isPanelVisible.value = false;
  }
};

const handleUploadGlobalCommand = (command: string, value: any) => {
  switch (command) {
    case "set-overwrite-all":
      setGlobalOverwriteAndRetry(value);
      break;
    case "retry-all":
      retryAllFailed();
      break;
    case "clear-finished":
      clearFinishedUploads();
      break;
    case "set-concurrency":
      ElMessageBox.prompt("请输入新的并行上传数 (1-10)", "设置并发数", {
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
    case "set-speed-mode":
      setSpeedMode(value);
      break;
  }
};
</script>

<style>
.file-management-container {
  height: calc(100vh - 135px);
  display: flex;
  flex-direction: column;
  position: relative;
  margin: 0 auto !important;
  padding: 24px 24px 0;
}
.file-management-main {
  width: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border: var(--style-border);
  position: relative;
}
.file-content-area {
  flex: 1;
  overflow: hidden;
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
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--el-color-primary-light-7);
  border-top-color: var(--el-color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.loading-fade-enter-active,
.loading-fade-leave-active {
  transition: opacity 0.3s ease-in-out;
}
.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
}
</style>
