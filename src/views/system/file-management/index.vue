<template>
  <div
    class="file-management-container"
    @dragenter="dragHandlers.onDragEnter"
    @dragover="dragHandlers.onDragOver"
    @dragleave="dragHandlers.onDragLeave"
    @drop="dragHandlers.onDrop"
    @contextmenu.prevent="handleContextMenuTrigger"
  >
    <FileHeard
      class="mb-2 deselect-safe-zone"
      @open-new-menu="openBlankMenu"
      @trigger-search="openSearchFromElement"
    />
    <div class="flex w-full deselect-safe-zone">
      <FileBreadcrumb class="flex-1 mb-2" />
      <FileToolbar class="mb-2 ml-2" />
    </div>

    <div class="file-management-main rounded-2xl overflow-hidden">
      <div class="file-content-area">
        <component :is="activeViewComponent" />
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
      @select="onMenuSelect"
      @closed="handleContextMenuClosed"
    />
    <UploadProgress class="deselect-safe-zone" />
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useFileStore } from "@/store/modules/fileStore";
import { useContextMenuHandler } from "./hooks/useContextMenuHandler";
import { usePageInteractions } from "./hooks/usePageInteractions";
import { useDirectoryUpload } from "./hooks/useDirectoryUpload";

// 引入所有需要的子组件
import FileHeard from "./components/FileHeard.vue";
import FileBreadcrumb from "./components/FileBreadcrumb.vue";
import FileToolbar from "./components/FileToolbar.vue";
import FileListView from "./components/FileListView.vue";
import FileGridView from "./components/FileGridView.vue";
import UploadProgress from "./components/UploadProgress.vue";
import ContextMenu from "./components/ContextMenu.vue";
import SearchOverlay from "./components/SearchOverlay.vue";
import { UploadFilled } from "@element-plus/icons-vue";

// --- 初始化 Store 和 Hooks ---
const fileStore = useFileStore();
const { handleDrop } = useDirectoryUpload();
const {
  contextMenuTriggerEvent,
  handleContextMenuTrigger,
  onMenuSelect,
  handleContextMenuClosed,
  openBlankMenu
} = useContextMenuHandler();

// 3. 将上传处理函数传递给页面交互 Hook
const {
  isDragging,
  dragHandlers,
  isSearchVisible,
  searchOrigin,
  openSearchFromElement
} = usePageInteractions(handleDrop);

// --- 视图状态 ---
const viewComponents = {
  list: FileListView,
  grid: FileGridView
};
const activeViewComponent = computed(() => viewComponents[fileStore.viewMode]);
</script>

<style>
.file-management-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.file-management-main {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border: var(--style-border);
}
.file-content-area {
  flex: 1;
  overflow: auto;
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
