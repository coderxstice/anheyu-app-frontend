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
      @download="onActionDownload"
      @copy="onActionCopy"
      @move="onActionMove"
      @share="onActionShare"
    />
    <div class="flex w-full">
      <FileBreadcrumb
        class="flex-1 mb-2"
        @show-details="handleShowDetailsForId"
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

    <div v-if="isDragging" class="drag-overlay">
      <div class="drag-content">
        <el-icon><UploadFilled /></el-icon>
        <span>松开鼠标开始上传</span>
        <p>将文件或目录拖拽至此</p>
      </div>
    </div>

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
      @retry-item="retryItem"
      @remove-item="removeItem"
      @resolve-conflict="resolveConflict"
      @global-command="handleUploadGlobalCommand"
      @add-files="handleUploadFile"
    />

    <FileDetailsPanel
      :file="detailsPanelFile"
      @close="detailsPanelFile = null"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { ElMessage, ElMessageBox } from "element-plus";

// --- API ---
import { getFileDetailsApi } from "@/api/sys-file/sys-file";

// --- 核心状态管理 ---
import {
  useFileStore,
  type SortKey,
  type UploaderActions
} from "@/store/modules/fileStore";

// --- 类型定义 ---
import { type FileItem } from "@/api/sys-file/type";

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
import FileDetailsPanel from "./components/FileDetailsPanel.vue";

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

// --- 详细信息面板状态 ---
const detailsPanelFile = ref<FileItem | null>(null);

// --- 2. 初始化核心功能 Hooks ---
// ... 此处省略未变化的代码 ...
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
  addResumableTaskFromFileItem,
  removeItem,
  retryItem,
  retryAllFailed,
  resolveConflict,
  setGlobalOverwriteAndRetry,
  clearFinishedUploads,
  setConcurrency,
  speedDisplayMode,
  setSpeedMode
} = useFileUploader(
  sortedFiles,
  computed(() => storagePolicy.value),
  () => fileStore.refreshCurrentPath({ addResumableTaskFromFileItem })
);

// --- 统一的加载函数 ---
const uploaderActions: UploaderActions = { addResumableTaskFromFileItem };
const loadPath = (newPath: string) => {
  detailsPanelFile.value = null; // 切换目录时关闭详情面板
  fileStore.loadFiles(newPath, uploaderActions);
};

// --- 详细信息面板处理函数 ---
/**
 * @description: 根据ID调用API获取详情并显示面板
 * @param {string} id 要查询的文件或目录ID
 */
const handleShowDetailsForId = async (id: string) => {
  try {
    // 可以在这里设置一个加载状态，比如 detailsPanelFile.value = { id: id, loading: true }
    const response = await getFileDetailsApi(id);
    if (response.code === 200 && response.data) {
      detailsPanelFile.value = response.data;
    } else {
      ElMessage.error(response.message || "获取文件详情失败");
    }
  } catch (error: any) {
    ElMessage.error(error.message || "请求文件详情时发生错误");
    console.error(error);
  }
};

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
  onRefresh: () => loadPath(path.value),
  onRename: onActionRename,
  onDelete: onActionDelete,
  onDownload: onActionDownload,
  onCopy: onActionCopy,
  onMove: onActionMove,
  onShare: onActionShare,
  onInfo: () => {
    const selectedItems = getSelectedFileItems();
    if (selectedItems.length > 0) {
      handleShowDetailsForId(selectedItems[0].id); // 直接调用API
    }
  }
});

// --- 4. 准备传递给子组件的 Props 和事件处理器 ---
const hasSelection = computed(() => selectedFiles.value.size > 0);
const isSingleSelection = computed(() => selectedFiles.value.size === 1);
const selectionCountLabel = computed(
  () => `${selectedFiles.value.size} 个对象`
);

// --- 核心交互逻辑 ---
const fileManagerContainerRef = ref(null);

const handleContainerClick = (event: MouseEvent) => {
  // 如果详情面板是打开的，则点击任何地方都可能需要判断是否关闭它
  if (detailsPanelFile.value) {
    // 检查点击是否发生在详情面板内部
    const panel = (event.target as HTMLElement).closest(
      ".details-panel-drawer"
    );
    if (panel) return; // 点击在面板内，不操作
  }

  if (!hasSelection.value) return;
  const target = event.target as HTMLElement;
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
  if (ignoredSelectors.some(selector => target.closest(selector))) {
    return;
  }
  clearSelection();
};

const handleContextMenuTrigger = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  const clickedOnItem = target.closest(".file-item, .grid-item");
  if (!clickedOnItem && hasSelection.value) {
    clearSelection();
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
const handleRefresh = () => loadPath(path.value);
const handleSetViewMode = (mode: "list" | "grid") =>
  fileStore.setViewMode(mode);
const handleSetPageSize = (size: number) => fileStore.setPageSize(size);
const handleSetSortKey = (key: SortKey) => fileStore.setSort(key);

// 4.4 为 FileList / FileGrid 实现事件处理器
const handleNavigate = (newPath: string) => {
  clearSelection();
  loadPath(newPath);
};

// 初始加载逻辑
onMounted(() => {
  if (fileStore.files.length === 0 && !fileStore.loading) {
    loadPath("/");
  }
});

// 4.5 为 UploadProgress 处理显示逻辑和事件
// ... 此处省略未变化的代码 ...
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
        inputValue: String(
          useFileUploader(
            sortedFiles,
            computed(() => storagePolicy.value),
            () => {}
          ).concurrency.value
        ),
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

// --- 5. 视图状态 ---
const viewComponents = { list: FileListView, grid: FileGridView };
const activeViewComponent = computed(() => viewComponents[viewMode.value]);
</script>

<style>
/* 样式与之前保持一致，此处省略 */
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
