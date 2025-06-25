<template>
  <div
    class="file-management-container"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
    @contextmenu.prevent="handleContextMenuTrigger"
  >
    <FileHeard class="mb-2" />
    <div class="flex w-full">
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
        <p>拖拽文件至此</p>
      </div>
    </div>

    <ContextMenu
      :trigger-event="contextMenuTriggerEvent"
      @select="onMenuSelect"
      @closed="handleContextMenuClosed"
    />

    <UploadProgress />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, computed, ref, onUnmounted } from "vue";
import { useFileStore } from "@/store/modules/fileStore";
import ContextMenu from "./components/ContextMenu.vue";
import FileHeard from "./components/FileHeard.vue";
import FileBreadcrumb from "./components/FileBreadcrumb.vue";
import FileToolbar from "./components/FileToolbar.vue";
import FileListView from "./components/FileListView.vue";
import FileGridView from "./components/FileGridView.vue";
import UploadProgress from "./components/UploadProgress.vue";
import { UploadFilled } from "@element-plus/icons-vue";

import { useFileActions } from "./hooks/useFileActions";

const fileStore = useFileStore();

// 动态切换视图组件
const viewComponents = {
  list: FileListView,
  grid: FileGridView
};
const activeViewComponent = computed(() => viewComponents[fileStore.viewMode]);

const {
  handleUploadFile,
  handleUploadDir,
  handleCreateFile,
  handleCreateFolder
} = useFileActions();

// --- 右键菜单触发事件状态 ---
const contextMenuTriggerEvent = ref<MouseEvent | null>(null);

// 初始加载文件
onMounted(() => {
  fileStore.loadFiles("/");
  // 保持这个监听器，它用于清空文件选择，与右键菜单的逻辑独立
  document.addEventListener("mousedown", handleDocumentMouseDown);
});

onUnmounted(() => {
  document.removeEventListener("mousedown", handleDocumentMouseDown);
});

// --- 拖拽上传逻辑 ---
const isDragging = ref(false);
let dragCounter = 0;

const onDragEnter = (e: DragEvent) => {
  e.preventDefault();
  dragCounter++;
  if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
    isDragging.value = true;
  }
};

const onDragOver = (e: DragEvent) => {
  e.preventDefault();
};

const onDragLeave = (e: DragEvent) => {
  e.preventDefault();
  dragCounter--;
  if (dragCounter === 0) {
    isDragging.value = false;
  }
};

const onDrop = (e: DragEvent) => {
  e.preventDefault();
  isDragging.value = false;
  dragCounter = 0;
  if (e.dataTransfer?.files) {
    fileStore.addFilesToUpload(Array.from(e.dataTransfer.files));
  }
};

// --- 点击外部/空白区域取消选择 ---
const handleDocumentMouseDown = (event: MouseEvent) => {
  if (!(event.target as HTMLElement).closest(".deselect-safe-zone")) {
    fileStore.clearSelection();
  }
};

// --- 右键菜单相关处理函数 ---
const handleContextMenuTrigger = (event: MouseEvent) => {
  console.log("【父组件】捕获右键事件，传递给 ContextMenu。");
  // 将事件对象存储起来，传递给 ContextMenu 组件
  contextMenuTriggerEvent.value = event;
};

const handleContextMenuClosed = () => {
  // 当 ContextMenu 通知它已关闭时，清空触发事件，准备下一次打开
  console.log("【父组件】ContextMenu 通知已关闭，清空触发事件。");
  contextMenuTriggerEvent.value = null;
};

// 右键菜单项被选中时的处理，现在 ContextMenu 会把 context 传回来
const onMenuSelect = (action: string, context?: any) => {
  console.log("Menu action:", action, "Context:", context);
  switch (action) {
    case "upload-file":
      handleUploadFile();
      break;
    case "upload-dir":
      handleUploadDir();
      break;
    case "create-folder":
      handleCreateFolder();
      break;
    case "create-md":
      handleCreateFile("md");
      break;
    case "create-txt":
      handleCreateFile("txt");
      break;
    case "refresh":
      fileStore.loadFiles(fileStore.path);
      break;
    // 对于需要选中文件上下文的操作，可以从 context 中获取 selectedIds
    case "rename":
    case "delete":
      if (context?.selectedIds && context.selectedIds.length > 0) {
        console.log(`执行操作 ${action}，选中文件 ID:`, context.selectedIds);
        // 调用相应的处理函数，例如：
        // fileStore.deleteFiles(context.selectedIds);
      } else {
        console.warn(`执行操作 ${action}，但没有选中文件。`);
      }
      break;
  }
};
</script>

<style>
/* 样式保持不变 */
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
