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
          :has-more="hasMore"
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
import { computed, ref, watch, onMounted } from "vue";
// [路径参数改造] 1. 导入 vue-router 相关钩子和路径处理工具
import { useRoute, useRouter } from "vue-router";
import { buildFullUri, extractLogicalPathFromUri } from "@/utils/fileUtils";

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

// [路径参数改造] 2. 初始化 route 和 router 实例
const route = useRoute();
const router = useRouter();
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
  isMoreLoading,
  hasMore
} = storeToRefs(fileStore);

// 初始化上传核心 Hook (Uploader) - 无需改动
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
  () => fileStore.refreshCurrentPath(uploaderActions)
);

const uploaderActions: UploaderActions = {
  addResumableTaskFromFileItem
};

// 初始化文件选择 Hook - 无需改动
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

// [路径参数改造] 3. 更新导航与刷新逻辑
const handleRefresh = () =>
  fileStore.loadFiles(path.value, uploaderActions, true);

/**
 * 处理导航请求。此函数现在只负责更新URL的查询参数。
 * @param newLogicalPath - 目标逻辑路径, 例如 "/Images"
 */
const handleNavigate = (newLogicalPath: string) => {
  const fullUri = buildFullUri(newLogicalPath);
  // 仅在目标URI与当前URL查询参数不同时才更新URL，以避免不必要的历史记录条目
  if (route.query.path !== fullUri) {
    router.push({ query: { path: fullUri } });
  }
};

/**
 * 根据路由参数加载文件。
 * @param pathQuery - 从 aue-router 的 route.query.path 中获取的值
 */
const loadFilesFromRoute = (
  pathQuery: string | string[] | null | undefined
) => {
  // 处理 pathQuery 可能为数组的情况
  const pathUri = Array.isArray(pathQuery) ? pathQuery[0] : pathQuery;
  // 从完整的URI中提取逻辑路径（例如从 "anzhiyu://my/A" 得到 "/A"），如果不存在则默认为根目录 "/"
  const logicalPathToLoad = pathUri ? extractLogicalPathFromUri(pathUri) : "/";

  // 只有当目标路径与当前store中的路径不同时，才执行加载，避免重复加载
  if (logicalPathToLoad !== fileStore.path || fileStore.files.length === 0) {
    clearSelection();
    fileStore.loadFiles(logicalPathToLoad, uploaderActions, true);
  }
};

// 4. 监视路由查询参数的变化
// 当 URL 的 ?path=... 改变时 (例如，通过 handleNavigate 或浏览器后退/前进按钮)，此观察者将触发文件加载。
// `immediate: true` 确保在组件首次加载时也会运行，从而处理初始URL（包括深链接）。
watch(
  () => route.query.path,
  newPathQuery => {
    loadFilesFromRoute(newPathQuery);
  },
  { immediate: true }
);

// 5. 初始化功能性 Hooks
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

// 6. 简单操作 Action
const onActionRename = () => {
  if (isSingleSelection.value) handleRename(getSelectedFileItems()[0]);
};
const onActionDelete = () => {
  handleDelete(getSelectedFileItems()).then(success => {
    if (success) {
      clearSelection();
    }
  });
};
const onActionShare = () => {
  console.log("Share action triggered");
};

// 7. 右键菜单 Hook
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

// 8. 视图与杂项事件处理器
const selectionCountLabel = computed(
  () => `${selectedFiles.value.size} 个对象`
);
const fileManagerContainerRef = ref(null);
const fileContentAreaRef = ref<HTMLElement | null>(null);

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

// [路径参数改造] 5. 移除 onMounted 钩子
// onMounted 的初始加载逻辑现在由 watch 侦听器的 `immediate: true` 选项处理。
// onMounted(() => {
//   if (fileStore.files.length === 0 && !fileStore.loading) {
//     handleNavigate("/");
//   }
// });

// 滚动加载逻辑 - 无需改动
let throttleTimer: number | null = null;
const handleScroll = () => {
  if (throttleTimer) return;

  throttleTimer = window.setTimeout(() => {
    const el = fileContentAreaRef.value;
    if (!el) return;

    const canLoadMore = hasMore.value;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;

    if (isAtBottom && canLoadMore && !loading.value && !isMoreLoading.value) {
      fileStore.loadFiles(path.value, uploaderActions);
    }
    throttleTimer = null;
  }, 200);
};

// 上传面板逻辑 - 无需改动
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

const viewComponents = { list: FileListView, grid: FileGridView };
const activeViewComponent = computed(() => viewComponents[viewMode.value]);
</script>

<style>
.file-management-container {
  height: calc(100vh - 152px);
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
