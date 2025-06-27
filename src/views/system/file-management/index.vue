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
    <FileDetailsPanel
      :file="detailsPanelFile"
      @close="detailsPanelFile = null"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch, onMounted, h } from "vue";
import { storeToRefs } from "pinia";
import { ElMessage, ElMessageBox, ElNotification } from "element-plus";
import JSZip from "jszip";

// --- API ---
import {
  getFileDetailsApi,
  downloadFileApi,
  getFolderTreeApi,
  fetchBlobFromUrl,
  type FolderTreeFile
} from "@/api/sys-file/sys-file";
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

// 2.2 定义需要在其他 Hooks 之前创建的状态
const hasSelection = computed(() => selectedFiles.value.size > 0);
const isSingleSelection = computed(() => selectedFiles.value.size === 1);
const getSelectedFileItems = () =>
  sortedFiles.value.filter(f => selectedFiles.value.has(f.id));

// 2.3 文件上传 Hook
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

// --- 3. 初始化其他 Hooks---

// 3.1 文件操作相关 Hooks (创建、重命名等)
const {
  handleUploadFile,
  handleUploadDir,
  handleCreateFile,
  handleCreateFolder,
  handleRename,
  handleDelete
} = useFileActions(addUploadsToQueue, path);

// 3.2 拖拽上传 Hook (必须在 pageInteractions 之前)
const { handleDrop } = useDirectoryUpload(addUploadsToQueue, path);

// 3.3 页面交互 Hook
const {
  isDragging,
  dragHandlers,
  isSearchVisible,
  searchOrigin,
  openSearchFromElement
} = usePageInteractions(handleDrop);

// --- 4. 详细信息面板 ---
const detailsPanelFile = ref<FileItem | null>(null);

const loadPath = (newPath: string) => {
  detailsPanelFile.value = null; // 切换目录时关闭详情面板
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

// --- 5. 下载逻辑 ---

/**
 * 核心功能：处理打包下载
 * @param itemsToDownload 用户选择的 FileItem 列表
 * @param zipName 最终生成的 zip 文件名 (不含 .zip 后缀)
 */
const handlePackageDownload = async (
  itemsToDownload: FileItem[],
  zipName: string
) => {
  const notificationTitle = ref("正在准备打包下载");
  const notificationMessage = ref("正在获取文件列表，请稍候...");

  // 使用 h() 渲染函数包装响应式 ref，并传递给 message，使其能够动态更新
  const notification = ElNotification({
    title: "打包下载",
    message: h("div", null, [
      h(
        "p",
        { style: "font-weight: bold; margin: 0; padding-bottom: 6px;" },
        notificationTitle.value
      ),
      h(
        "p",
        { style: "margin: 0; font-size: 12px;" },
        notificationMessage.value
      )
    ]),
    duration: 0,
    showClose: false,
    type: "info",
    position: "bottom-right"
  });

  const zip = new JSZip();
  const filesToFetch: FolderTreeFile[] = [];

  try {
    // 步骤1: 收集所有需要下载的文件信息
    for (const item of itemsToDownload) {
      if (item.type === FileType.Dir) {
        notificationMessage.value = `正在分析文件夹 [${item.name}]...`;
        const treeResponse = await getFolderTreeApi(item.id);
        if (treeResponse.code === 200 && treeResponse.data.files) {
          // 为文件夹内的文件路径添加顶层文件夹名
          const filesInFolder = treeResponse.data.files.map(file => ({
            ...file,
            relative_path: `${item.name}/${file.relative_path}`
          }));
          filesToFetch.push(...filesInFolder);
        }
      } else {
        // 对于单个文件，直接获取其下载信息
        const detailResponse = await getFileDetailsApi(item.id);
        if (detailResponse.code === 200 && detailResponse.data.url) {
          filesToFetch.push({
            url: detailResponse.data.url,
            relative_path: item.name,
            size: item.size
          });
        }
      }
    }

    if (filesToFetch.length === 0) {
      notification.close();
      ElMessage.info("所选项目中没有可下载的文件。");
      return;
    }

    const totalFiles = filesToFetch.length;
    notificationTitle.value = `开始打包下载 (${totalFiles}个文件)`;
    ElMessage.info({
      message: "正在下载文件内容，请勿关闭浏览器。",
      duration: 5000
    });

    // 步骤2: 并发下载所有文件内容并添加到 zip
    let fileIndex = 0;
    for (const file of filesToFetch) {
      fileIndex++;
      notificationMessage.value = `(${fileIndex}/${totalFiles}) 正在处理: ${file.relative_path}`;
      try {
        const blob = await fetchBlobFromUrl(file.url);
        zip.file(file.relative_path, blob);
      } catch (e: any) {
        console.error(`下载文件 ${file.relative_path} 失败:`, e);
        // 在 zip 中添加一个错误文件，告知用户哪个文件下载失败
        zip.file(
          `${file.relative_path}.error.txt`,
          `下载此文件失败: ${e.message}`
        );
      }
    }

    // 步骤3: 生成并下载 ZIP 文件
    notificationTitle.value = "正在生成 ZIP 文件";
    notificationMessage.value = "文件已全部处理，正在进行最终打包...";

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = window.URL.createObjectURL(zipBlob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${zipName}.zip`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    notification.close();
    ElNotification.success({
      title: "下载完成",
      message: `文件 [${zipName}.zip] 已成功打包并开始下载。`,
      position: "bottom-right"
    });
  } catch (error: any) {
    console.error("打包下载过程中发生错误:", error);
    notification.close();
    ElMessage.error(error.message || "打包下载失败");
  }
};

/**
 * 顶级下载动作处理器
 */
async function onActionDownload() {
  const selectedItems = getSelectedFileItems();
  if (selectedItems.length === 0) {
    ElMessage.warning("请选择要下载的项目");
    return;
  }
  // 优化：如果只选择了一个文件，直接调用标准下载接口，不打包
  if (selectedItems.length === 1 && selectedItems[0].type === FileType.File) {
    ElMessage.info(`开始下载文件: ${selectedItems[0].name}`);
    await downloadFileApi(selectedItems[0].id, selectedItems[0].name);
    return;
  }
  // 确定 zip 文件名
  let zipName = "打包下载";
  if (selectedItems.length === 1 && selectedItems[0].type === FileType.Dir) {
    zipName = selectedItems[0].name;
  }
  // 启动打包下载流程
  handlePackageDownload(selectedItems, zipName);
}

/**
 * 处理从面包屑触发的文件夹下载
 * @param folderId 要下载的文件夹 ID
 */
const handleDownloadFolder = async (folderId: string) => {
  try {
    const res = await getFileDetailsApi(folderId);
    if (res.code === 200 && res.data) {
      // 启动单文件夹打包下载
      handlePackageDownload([res.data], res.data.name);
    } else {
      ElMessage.error(res.message || "无法获取文件夹信息以下载");
    }
  } catch (error: any) {
    ElMessage.error(error.message || "请求文件夹信息失败");
  }
};

function onActionRename() {
  if (isSingleSelection.value) handleRename(getSelectedFileItems()[0]);
}
function onActionDelete() {
  handleDelete(getSelectedFileItems());
}
function onActionCopy() {
  console.log("Copy:", getSelectedFileItems());
  ElMessage.info("复制功能正在开发中...");
}
function onActionMove() {
  console.log("Move:", getSelectedFileItems());
  ElMessage.info("移动功能正在开发中...");
}
function onActionShare() {
  console.log("Share:", getSelectedFileItems());
  ElMessage.info("分享功能正在开发中...");
}

// --- 6. 右键菜单 Hook ---
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
    const selected = getSelectedFileItems();
    if (selected.length > 0) handleShowDetailsForId(selected[0].id);
  }
});

// --- 7. 其他事件处理器和生命周期 ---
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
