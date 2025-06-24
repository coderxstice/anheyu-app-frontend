<template>
  <div
    class="file-management-container"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
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

    <UploadProgress />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, computed, ref } from "vue";
import { useFileStore } from "@/store/modules/fileStore";
import FileHeard from "./components/FileHeard.vue";
import FileBreadcrumb from "./components/FileBreadcrumb.vue";
import FileToolbar from "./components/FileToolbar.vue";
import FileListView from "./components/FileListView.vue";
import FileGridView from "./components/FileGridView.vue";
import UploadProgress from "./components/UploadProgress.vue";
import { UploadFilled } from "@element-plus/icons-vue";

const fileStore = useFileStore();

// 动态切换视图组件
const viewComponents = {
  list: FileListView,
  grid: FileGridView
};
const activeViewComponent = computed(() => viewComponents[fileStore.viewMode]);

// 初始加载文件
onMounted(() => {
  fileStore.loadFiles("/");
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
