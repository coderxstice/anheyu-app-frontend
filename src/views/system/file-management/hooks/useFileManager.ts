import { computed, ref, defineAsyncComponent } from "vue";
import { storeToRefs } from "pinia";
import { useFileStore, type UploaderActions } from "@/store/modules/fileStore";
import type { FileItem, ColumnConfig } from "@/api/sys-file/type";
import {
  updateFileContentByPublicIdApi,
  regenerateThumbnailApi,
  regenerateDirectoryThumbnailsApi
} from "@/api/sys-file/sys-file";
import { ElMessage, ElMessageBox } from "element-plus";

// 导入所有需要的子 Hooks
import { useFileUploader } from "@/composables/useFileUploader";
import { useFileSelection } from "@/composables/useFileSelection";
import { useFileActions } from "./useFileActions";
import { useDirectoryUpload } from "./useDirectoryUpload";
import { useContextMenuHandler } from "./useContextMenuHandler";
import { usePageInteractions } from "./usePageInteractions";
import { useFileDownload } from "./useFileDownload";
import { useFileModals } from "./useFileModals";
import { useUploadPanel } from "./useUploadPanel";
import { useDataLoading } from "./useDataLoading";
import { useFileDirectLinks } from "./useFileDirectLinks";
import { useFilePreview } from "./useFilePreview";
import { useMonacoTheme } from "@/components/AzTextPreview/hooks/useMonacoTheme";

/**
 * 一个高阶 Hook，用于封装文件管理页面的所有核心逻辑。
 * 它聚合了多个子 Hook 的功能，为视图组件提供一个统一的接口。
 */
export function useFileManager() {
  const fileStore = useFileStore();
  const { sortedFiles, storagePolicy, path, parentInfo, ...storeState } =
    storeToRefs(fileStore);

  // 视图与 Refs
  const imagePreviewRef = ref<any>(null);
  const videoPreviewRef = ref<any>(null);
  const textPreviewRef = ref<any>(null);
  const fileToolbarRef = ref<any>(null);
  const FileListView = defineAsyncComponent(
    () => import("../components/FileListView.vue")
  );
  const FileGridView = defineAsyncComponent(
    () => import("../components/FileGridView.vue")
  );
  const activeViewComponent = computed(() =>
    fileStore.viewMode === "list" ? FileListView : FileGridView
  );

  // 主题管理
  const { monacoTheme } = useMonacoTheme();

  // 文件选择
  const selection = useFileSelection(sortedFiles);
  const hasSelection = computed(() => selection.selectedFiles.value.size > 0);
  const isSingleSelection = computed(
    () => selection.selectedFiles.value.size === 1
  );
  const selectionCountLabel = computed(
    () => `${selection.selectedFiles.value.size} 个对象`
  );
  const getSelectedFileItems = () =>
    sortedFiles.value.filter(f => selection.selectedFiles.value.has(f.id));

  // 解决循环依赖的核心
  // 1. 先定义一个包含安全空函数的 uploaderActions 对象
  const uploaderActions: UploaderActions = {
    addResumableTaskFromFileItem: async () => {}
  };

  // 2. 将此对象的【引用】传递给 useDataLoading
  const { handleRefresh, handleNavigate, handleLoadMore } = useDataLoading({
    uploaderActions,
    clearSelection: selection.clearSelection
  });

  // 3. 定义上传核心，它依赖于已经存在的 handleRefresh
  const uploader = useFileUploader(
    sortedFiles,
    computed(() => storagePolicy.value),
    handleRefresh
  );

  // 4. 用 uploader 提供的真实函数，来修改 uploaderActions 对象的内容
  uploaderActions.addResumableTaskFromFileItem =
    uploader.addResumableTaskFromFileItem;

  const uploadPanel = useUploadPanel({
    uploadQueue: uploader.uploadQueue,
    showUploadProgress: uploader.showUploadProgress,
    removeItem: uploader.removeItem,
    retryAllFailed: uploader.retryAllFailed,
    clearFinishedUploads: uploader.clearFinishedUploads,
    setGlobalOverwriteAndRetry: uploader.setGlobalOverwriteAndRetry,
    setConcurrency: uploader.setConcurrency,
    setSpeedMode: uploader.setSpeedMode,
    getConcurrency: () => uploader.concurrency.value
  });

  const fileActions = useFileActions(uploader.addUploadsToQueue, path, {
    onSuccess: handleRefresh,
    onNewUploads: uploadPanel.handleNewUploadsAdded
  });

  const modals = useFileModals({
    getSelectedItems: getSelectedFileItems,
    refresh: handleRefresh,
    clearSelection: selection.clearSelection
  });

  const download = useFileDownload({ getSelectedItems: getSelectedFileItems });

  const directLinks = useFileDirectLinks({
    getSelectedItems: getSelectedFileItems
  });

  const { previewFile } = useFilePreview();

  /**
   * 实现文件保存的动作
   * @param file 要保存的文件对象
   * @param content 新的文件内容
   * @returns {Promise<boolean | Partial<FileItem>>} 成功时返回更新后的元数据，失败时返回 false
   */
  const onActionSave = async (
    file: FileItem,
    content: string
  ): Promise<boolean | Partial<FileItem>> => {
    if (!file.id) {
      ElMessage.error("文件缺少唯一标识，无法保存。");
      return false;
    }

    try {
      const res = await updateFileContentByPublicIdApi(
        file.id,
        file.path,
        content
      );

      if (res.code === 200 && res.data) {
        const updates = {
          size: res.data.size,
          updated_at: res.data.updated
        };
        fileStore.updateFileInState(file.id, updates);
        return res.data;
      } else {
        ElMessage.error(res.message || "保存失败");
        return false;
      }
    } catch (error: any) {
      if (error.response?.status === 409) {
        ElMessage.error("文件位置已改变，请刷新后重试。");
      } else {
        console.error("Error saving file content:", error);
        ElMessage.error("保存时发生网络错误");
      }
      throw error;
    }
  };

  const handlePreviewFile = (item: FileItem) => {
    previewFile(
      item,
      { imagePreviewRef, videoPreviewRef, textPreviewRef },
      monacoTheme.value,
      onActionSave
    );
  };

  const { handleDrop: processDroppedFiles } = useDirectoryUpload(
    uploader.addUploadsToQueue,
    path,
    uploadPanel.handleNewUploadsAdded
  );
  const onDropAdapter = (event: DragEvent) => {
    if (event.dataTransfer) processDroppedFiles(event.dataTransfer);
  };
  const pageInteractions = usePageInteractions({
    onDrop: onDropAdapter,
    detailsPanelFile: modals.detailsPanelFile,
    hasSelection,
    clearSelection: selection.clearSelection
  });

  const onActionRegenerateThumbnail = async () => {
    const selectedItems = getSelectedFileItems();
    if (selectedItems.length !== 1) {
      ElMessage.warning("请选择一个文件进行操作。");
      return;
    }
    try {
      const res = await regenerateThumbnailApi(selectedItems[0].id);
      if (res.code === 202) {
        ElMessage.success("重新生成请求已提交，请稍后刷新。");
        handleRefresh();
      } else {
        ElMessage.error(res.message || "请求失败");
      }
    } catch {
      ElMessage.error("操作失败。");
    }
  };

  /**
   * @description 批量重新生成当前目录下所有文件的缩略图
   */
  const onActionRegenerateDirectoryThumbnails = async () => {
    const currentDirectoryId = parentInfo.value?.id;
    if (!currentDirectoryId) {
      ElMessage.warning("无法确定当前目录，无法执行该操作。");
      return;
    }

    try {
      await ElMessageBox.confirm(
        "此操作将为当前目录下的所有文件重新派发缩略图生成任务。这是一个后台异步操作，请稍后刷新查看结果。是否继续？",
        "确认操作",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning"
        }
      );

      const res = await regenerateDirectoryThumbnailsApi(currentDirectoryId);
      console.log(res);

      if (res.code === 202 && res.data) {
        ElMessage.success(res.message || "后台任务已启动，请稍后刷新。");
      } else {
        ElMessage.error(res.message || "请求失败");
      }
    } catch (error: any) {
      if (error !== "cancel") {
        ElMessage.error("操作失败或已取消。");
        console.error("Error regenerating directory thumbnails:", error);
      }
    }
  };

  const onActionRename = () => {
    if (isSingleSelection.value)
      fileActions.handleRename(getSelectedFileItems()[0]);
  };
  const onActionDelete = () => {
    fileActions.handleDelete(getSelectedFileItems()).then(success => {
      if (success) selection.clearSelection();
    });
  };
  const onActionShare = () => {
    console.log("Share action");
  };

  const contextMenu = useContextMenuHandler({
    onUploadFile: fileActions.handleUploadFile,
    onUploadDir: fileActions.handleUploadDir,
    onCreateFolder: fileActions.handleCreateFolder,
    onCreateMd: () => fileActions.handleCreateFile("md"),
    onCreateTxt: () => fileActions.handleCreateFile("txt"),
    onRefresh: handleRefresh,
    onRename: onActionRename,
    onDelete: onActionDelete,
    onDownload: download.onActionDownload,
    onCopy: modals.onActionCopy,
    onMove: modals.onActionMove,
    onShare: onActionShare,
    onGetLink: directLinks.onActionGetLinks,
    onInfo: () => {
      if (isSingleSelection.value)
        modals.handleShowDetailsForId(getSelectedFileItems()[0].id);
    },
    onRegenerateThumbnail: onActionRegenerateThumbnail,
    hasSelection,
    clearSelection: selection.clearSelection
  });

  const handleSetViewMode = (mode: "list" | "grid") =>
    fileStore.setViewMode(mode);
  const handleSetPageSize = (size: number) => fileStore.setPageSize(size);
  const handleSetColumns = (cols: ColumnConfig[]) => fileStore.setColumns(cols);
  const handleSetSortKey = (key: any) => fileStore.setSort(key);
  const handleOpenColumnSettings = () => {
    if (fileToolbarRef.value) {
      fileToolbarRef.value.openDialog();
    }
  };

  return {
    // Refs
    fileManagerContainerRef: pageInteractions.containerRef,
    imagePreviewRef,
    videoPreviewRef,
    textPreviewRef,
    fileToolbarRef,

    // Store state
    path,
    ...storeState,
    sortedFiles,
    parentInfo,

    // Selection
    ...selection,
    hasSelection,
    isSingleSelection,
    selectionCountLabel,

    // Component state
    activeViewComponent,

    // Modals, panels, overlays
    ...modals,
    ...uploader,
    ...uploadPanel,
    ...pageInteractions,
    ...contextMenu,
    ...download,

    // Event handlers
    handleNavigate,
    handleLoadMore,
    handlePreviewFile,
    handleRefresh,

    // View settings handlers
    handleSetViewMode,
    handleSetPageSize,
    handleSetColumns,
    handleSetSortKey,
    handleOpenColumnSettings,

    // Action handlers for header/menu
    ...fileActions,
    onActionDownload: download.onActionDownload,
    onActionRename,
    onActionDelete,
    onActionShare,
    onActionCopy: modals.onActionCopy,
    onActionMove: modals.onActionMove,
    onActionRegenerateDirectoryThumbnails
  };
}
