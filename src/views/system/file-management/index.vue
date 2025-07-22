<template>
  <div
    ref="fileManagerContainerRef"
    class="file-management-container"
    @dragenter="dragHandlers.onDragEnter"
    @dragover="dragHandlers.onDragOver"
    @dragleave="dragHandlers.onDragLeave"
    @drop="dragHandlers.onDrop"
    @contextmenu.prevent="handleContextMenuTrigger($event)"
    @click="handleContainerClick"
  >
    <!-- 头部操作区 -->
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
      @share="onActionShare"
      @copy="onActionCopy"
      @move="onActionMove"
    />

    <!-- 路径和工具栏 -->
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

    <!-- 主内容区 -->
    <div class="file-management-main rounded-2xl overflow-hidden">
      <transition name="loading-fade">
        <div v-if="loading && !sortedFiles.length" class="loading-overlay">
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
          @scroll-to-load="handleLoadMore"
          @set-sort-key="handleSetSortKey"
          @open-column-settings="handleOpenColumnSettings"
          @set-columns="handleSetColumns"
          @preview-file="handlePreviewFile"
          @contextmenu="handleContextMenuTrigger"
        />
      </div>
    </div>

    <!-- 拖拽上传遮罩 -->
    <div v-if="isDragging" class="drag-overlay">
      <div class="drag-content">
        <el-icon><UploadFilled /></el-icon>
        <span>松开鼠标开始上传</span>
        <p>将文件或目录拖拽至此</p>
      </div>
    </div>

    <!-- 弹窗和侧边栏 -->
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
      :trigger="contextMenuTrigger"
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

    <AzImagePreview ref="imagePreviewRef" page="sys-file" />
    <AzVideoPreview ref="videoPreviewRef" />
    <AzTextPreview ref="textPreviewRef" />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { UploadFilled } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

// 工具 & Store
import {
  useFileStore,
  type SortKey,
  type UploaderActions
} from "@/store/modules/fileStore";
import type { ColumnConfig, FileItem } from "@/api/sys-file/type";
import { regenerateThumbnailApi } from "@/api/sys-file/sys-file";

// 自定义 Hooks
import { useFileUploader } from "@/composables/useFileUploader";
import { useFileSelection } from "@/composables/useFileSelection";
import { useFileActions } from "./hooks/useFileActions";
import { useDirectoryUpload } from "./hooks/useDirectoryUpload";
import { useContextMenuHandler } from "./hooks/useContextMenuHandler";
import { usePageInteractions } from "./hooks/usePageInteractions";
import { useFileDownload } from "./hooks/useFileDownload";
import { useFileModals } from "./hooks/useFileModals";
import { useUploadPanel } from "./hooks/useUploadPanel";
import { useDataLoading } from "./hooks/useDataLoading";
import { useSwipeNavigationBlocker } from "./hooks/useSwipeNavigationBlocker";
import { useFileDirectLinks } from "./hooks/useFileDirectLinks";
import { useFilePreview } from "./hooks/useFilePreview";
import { useMonacoTheme } from "@/components/AzTextPreview/hooks/useMonacoTheme";

// 子组件
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
import AzImagePreview from "@/components/AzImagePreview";
import AzVideoPreview from "@/components/AzVideoPreview";
import AzTextPreview from "@/components/AzTextPreview";

const fileStore = useFileStore();
const fileToolbarRef = ref<InstanceType<typeof FileToolbar> | null>(null);
const fileManagerContainerRef = ref<HTMLElement | null>(null);
const imagePreviewRef = ref<InstanceType<typeof AzImagePreview> | null>(null);
const videoPreviewRef = ref<InstanceType<typeof AzVideoPreview> | null>(null);
const textPreviewRef = ref<InstanceType<typeof AzTextPreview> | null>(null);

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
  () => handleRefresh()
);
const uploaderActions: UploaderActions = { addResumableTaskFromFileItem };

const { finalMonacoTheme } = useMonacoTheme(textPreviewRef);

// 文件选择逻辑 (必须在依赖它的Hooks之前)
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
const selectionCountLabel = computed(
  () => `${selectedFiles.value.size} 个对象`
);
const getSelectedFileItems = () =>
  sortedFiles.value.filter(f => selectedFiles.value.has(f.id));

// 数据加载、刷新、导航
const { handleRefresh, handleNavigate, handleLoadMore } = useDataLoading({
  uploaderActions,
  clearSelection: clearSelection
});

// 文件下载
const { isDownloading, onActionDownload, handleDownloadFolder } =
  useFileDownload({
    getSelectedItems: getSelectedFileItems
  });

const { previewFile } = useFilePreview();
const handlePreviewFile = (item: FileItem) => {
  previewFile(
    item,
    { imagePreviewRef, videoPreviewRef, textPreviewRef },
    finalMonacoTheme.value
  );
};

// 各种弹窗（移动、复制、详情）
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
} = useFileModals({
  getSelectedItems: getSelectedFileItems,
  refresh: handleRefresh,
  clearSelection
});

// 上传面板交互
const {
  isPanelVisible,
  isPanelCollapsed,
  handlePanelClose,
  handleUploadGlobalCommand,
  handleNewUploadsAdded
} = useUploadPanel({
  uploadQueue,
  showUploadProgress,
  removeItem,
  retryAllFailed,
  clearFinishedUploads,
  setGlobalOverwriteAndRetry,
  setConcurrency,
  setSpeedMode,
  getConcurrency: () => concurrency.value
});

// 文件操作（创建、重命名、删除等）
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

// 拖拽上传
const { handleDrop: processDroppedFiles } = useDirectoryUpload(
  addUploadsToQueue,
  path,
  handleNewUploadsAdded
);
const onDropAdapter = (event: DragEvent) => {
  if (event.dataTransfer) processDroppedFiles(event.dataTransfer);
};

// 页面交互（拖拽覆盖、搜索、点击空白、手势阻止）
const {
  isDragging,
  dragHandlers,
  isSearchVisible,
  searchOrigin,
  openSearchFromElement,
  handleContainerClick
} = usePageInteractions({
  onDrop: onDropAdapter,
  detailsPanelFile,
  hasSelection,
  clearSelection
});
useSwipeNavigationBlocker(fileManagerContainerRef);

// 右键菜单相关逻辑
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

const { onActionGetLinks } = useFileDirectLinks({
  getSelectedItems: getSelectedFileItems
});

// 实现“重新生成缩略图”的逻辑
const onActionRegenerateThumbnail = async () => {
  const selectedItems = getSelectedFileItems();
  if (selectedItems.length !== 1) {
    ElMessage.warning("请选择一个文件进行操作。");
    return;
  }

  const fileToRegenerate = selectedItems[0];
  try {
    const res = await regenerateThumbnailApi(fileToRegenerate.id);
    if (res.code === 202) {
      ElMessage.success("重新生成请求已提交，请稍后刷新查看。");
      handleRefresh(); // 触发一次刷新来更新文件列表状态
    } else {
      ElMessage.error(res.message || "请求失败");
    }
  } catch (error) {
    ElMessage.error("操作失败，请检查网络。");
  }
};

const {
  contextMenuTrigger,
  onMenuSelect,
  handleContextMenuClosed,
  openBlankMenu,
  handleContextMenuTrigger
} = useContextMenuHandler({
  onUploadFile: handleUploadFile,
  onUploadDir: handleUploadDir,
  onCreateFolder: handleCreateFolder,
  onCreateMd: () => handleCreateFile("md"),
  onCreateTxt: () => handleCreateFile("txt"),
  onRefresh: handleRefresh,
  onRename: onActionRename,
  onDelete: onActionDelete,
  onDownload: onActionDownload,
  onCopy: onActionCopy,
  onMove: onActionMove,
  onShare: onActionShare,
  onGetLink: onActionGetLinks,
  onInfo: () => {
    if (isSingleSelection.value)
      handleShowDetailsForId(getSelectedFileItems()[0].id);
  },
  onRegenerateThumbnail: onActionRegenerateThumbnail, // 注入实现
  hasSelection,
  clearSelection
});

// 视图设置处理器
const handleSetViewMode = (mode: "list" | "grid") =>
  fileStore.setViewMode(mode);
const handleSetPageSize = (size: number) => fileStore.setPageSize(size);
const handleSetColumns = (newColumns: ColumnConfig[]) => {
  setTimeout(() => fileStore.setColumns(newColumns), 0);
};
const handleSetSortKey = (key: SortKey) => fileStore.setSort(key);
const handleOpenColumnSettings = () => fileToolbarRef.value?.openDialog();
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
