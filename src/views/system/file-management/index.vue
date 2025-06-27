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
      @download="onActionDownload"
      @copy="onActionCopy"
      @move="onActionMove"
      @share="onActionShare"
    />
    <!-- 面包屑和工具栏 -->
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
      :speed-mode="speedDisplayMode"
      @close="handlePanelClose"
      @toggle-collapse="isPanelCollapsed = !isPanelCollapsed"
      @retry-item="retryItem"
      @remove-item="removeItem"
      @resolve-conflict="resolveConflict"
      @global-command="handleUploadGlobalCommand"
      @add-files="handleUploadFile"
    />

    <!-- 文件详情面板 -->
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
import { getFileDetailsApi, downloadFileApi } from "@/api/sys-file/sys-file";

// --- 核心状态管理 ---
import {
  useFileStore,
  type SortKey,
  type UploaderActions
} from "@/store/modules/fileStore";

// --- 类型定义 ---
import { type FileItem, FileType } from "@/api/sys-file/type";

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

const detailsPanelFile = ref<FileItem | null>(null);

const {
  selectedFiles,
  selectSingle,
  selectRange,
  toggleSelection,
  selectAll,
  clearSelection,
  invertSelection
} = useFileSelection(sortedFiles);

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

const uploaderActions: UploaderActions = { addResumableTaskFromFileItem };
const loadPath = (newPath: string) => {
  detailsPanelFile.value = null;
  fileStore.loadFiles(newPath, uploaderActions);
};

const handleShowDetailsForId = async (id: string) => {
  try {
    const response = await getFileDetailsApi(id);
    if (response.code === 200 && response.data) {
      detailsPanelFile.value = response.data;
    } else {
      ElMessage.error(response.message || "获取文件详情失败");
    }
  } catch (error: any) {
    ElMessage.error(error.message || "请求文件详情时发生错误");
  }
};

const {
  handleUploadFile,
  handleUploadDir,
  handleCreateFile,
  handleCreateFolder,
  handleRename,
  handleDelete
} = useFileActions(addUploadsToQueue, path);

const { handleDrop } = useDirectoryUpload(addUploadsToQueue, path);

const {
  isDragging,
  dragHandlers,
  isSearchVisible,
  searchOrigin,
  openSearchFromElement
} = usePageInteractions(handleDrop);

// --- 核心修改：重写 onActionDownload 函数 ---
async function onActionDownload() {
  const selectedItems = getSelectedFileItems();
  if (selectedItems.length === 0) {
    ElMessage.warning("请至少选择一个文件进行下载");
    return;
  }

  const filesToDownload = selectedItems.filter(
    item => item.type === FileType.File
  );

  if (filesToDownload.length === 0) {
    ElMessage.info("选择的项目中不包含可下载的文件（文件夹暂不支持直接下载）");
    return;
  }

  ElMessage.info(`已开始下载 ${filesToDownload.length} 个文件...`);

  // 依次下载每个文件
  for (const file of filesToDownload) {
    try {
      // 为了防止浏览器因连续快速触发下载而产生阻止，可以加入一个微小的延迟
      await new Promise(resolve => setTimeout(resolve, 300));
      await downloadFileApi(file.id, file.name);
    } catch (error) {
      // 错误已在 downloadFileApi 中通过 ElMessage 提示，这里仅在控制台记录
      console.error(`下载文件 ${file.name} 失败:`, error);
    }
  }
}

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
  onDownload: onActionDownload, // 确保这里连接的是新的 onActionDownload
  onCopy: onActionCopy,
  onMove: onActionMove,
  onShare: onActionShare,
  onInfo: () => {
    const selectedItems = getSelectedFileItems();
    if (selectedItems.length > 0) {
      handleShowDetailsForId(selectedItems[0].id);
    }
  }
});

const hasSelection = computed(() => selectedFiles.value.size > 0);
const isSingleSelection = computed(() => selectedFiles.value.size === 1);
const selectionCountLabel = computed(
  () => `${selectedFiles.value.size} 个对象`
);

const fileManagerContainerRef = ref(null);

const handleContainerClick = (event: MouseEvent) => {
  if (detailsPanelFile.value) {
    const panel = (event.target as HTMLElement).closest(
      ".details-panel-drawer"
    );
    if (panel) return;
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

const getSelectedFileItems = () =>
  sortedFiles.value.filter(f => selectedFiles.value.has(f.id));

function onActionRename() {
  if (isSingleSelection.value) handleRename(getSelectedFileItems()[0]);
}
function onActionDelete() {
  handleDelete(getSelectedFileItems());
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

const handleRefresh = () => loadPath(path.value);
const handleSetViewMode = (mode: "list" | "grid") =>
  fileStore.setViewMode(mode);
const handleSetPageSize = (size: number) => fileStore.setPageSize(size);
const handleSetSortKey = (key: SortKey) => fileStore.setSort(key);

const handleNavigate = (newPath: string) => {
  clearSelection();
  loadPath(newPath);
};

onMounted(() => {
  if (fileStore.files.length === 0 && !fileStore.loading) {
    loadPath("/");
  }
});

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
