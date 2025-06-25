<template>
  <div class="file-heard-actions w-full flex items-center">
    <el-button
      v-ripple
      :icon="useRenderIcon(UploadIcon)"
      type="primary"
      class="mr-2 new-btn"
      @click="handleNewButtonClick"
    >
      新建
    </el-button>

    <div class="actions-container">
      <Transition
        name="toolbar-swap"
        mode="out-in"
        :css="false"
        @enter="onToolbarEnter"
        @leave="onToolbarLeave"
      >
        <div
          v-if="hasSelection"
          key="selection-toolbar"
          class="selection-toolbar"
        >
          <el-button-group class="action-group">
            <el-button
              :icon="Close"
              title="取消选择"
              @click="fileStore.clearSelection()"
            />
            <el-button class="selection-count" disabled>{{
              selectionCountLabel
            }}</el-button>
          </el-button-group>

          <el-button-group class="ml-2 action-group">
            <el-tooltip content="下载" placement="bottom"
              ><el-button :icon="Download" @click="handleDownload"
            /></el-tooltip>
            <el-tooltip content="复制" placement="bottom"
              ><el-button :icon="CopyDocument" @click="handleCopy"
            /></el-tooltip>
            <el-tooltip content="移动" placement="bottom"
              ><el-button :icon="Folder" @click="handleMove"
            /></el-tooltip>

            <template v-if="isSingleSelection">
              <el-tooltip content="重命名" placement="bottom"
                ><el-button :icon="EditPen" @click="handleRename"
              /></el-tooltip>
              <el-tooltip content="分享" placement="bottom"
                ><el-button :icon="Share" @click="handleShare"
              /></el-tooltip>
            </template>

            <el-tooltip content="删除" placement="bottom"
              ><el-button type="danger" :icon="Delete" @click="handleDelete"
            /></el-tooltip>
          </el-button-group>
        </div>

        <div
          v-else
          key="search-wrapper"
          class="search-wrapper"
          @click="openSearchOverlay"
        >
          <el-input placeholder="搜索文件" class="search-input" readonly>
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </Transition>
    </div>

    <SearchOverlay
      :visible="isSearchVisible"
      :origin="searchOrigin"
      @close="isSearchVisible = false"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { useFileStore } from "@/store/modules/fileStore";
import { storeToRefs } from "pinia";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import SearchOverlay from "./SearchOverlay.vue";
import gsap from "gsap";

// 引入所有需要的图标
import UploadIcon from "@iconify-icons/ep/upload";
import {
  Search,
  Close,
  Download,
  CopyDocument,
  Folder,
  Share,
  Delete,
  EditPen // 新增“重命名”图标
} from "@element-plus/icons-vue";

// --- 初始化 Store 和 Hooks ---
const fileStore = useFileStore();
const { selectedFiles } = storeToRefs(fileStore);

// --- 状态驱动 ---
const hasSelection = computed(() => selectedFiles.value.size > 0);
const selectionCountLabel = computed(
  () => `${selectedFiles.value.size} 个对象`
);
// [!新增] 判断是否为单选
const isSingleSelection = computed(() => selectedFiles.value.size === 1);

// --- “新建”和“搜索”按钮逻辑 ---
const emit = defineEmits<{
  (e: "open-new-menu", event: MouseEvent): void;
  (e: "trigger-search", event: MouseEvent): void;
}>();

const handleNewButtonClick = (event: MouseEvent) => {
  emit("open-new-menu", event);
};

const isSearchVisible = ref(false);
const searchOrigin = ref({ x: 0, y: 0 });

const openSearchOverlay = (event: MouseEvent) => {
  emit("trigger-search", event);
};

// --- 选择工具栏按钮处理函数 ---
const handleDownload = () => {
  console.log("下载选中的文件:", selectedFiles.value);
};
const handleCopy = () => {
  console.log("复制选中的文件:", selectedFiles.value);
};
const handleMove = () => {
  console.log("移动选中的文件:", selectedFiles.value);
};
const handleShare = () => {
  console.log("分享选中的文件:", selectedFiles.value);
};
const handleDelete = () => {
  console.log("删除选中的文件:", selectedFiles.value);
};
// [!新增] 重命名处理函数
const handleRename = () => {
  // 因为是单选，所以可以安全地获取第一个元素
  const fileId = selectedFiles.value.values().next().value;
  console.log("重命名文件:", fileId);
};

// --- GSAP 动画钩子 ---
const onToolbarEnter = (el: HTMLElement, done: () => void) => {
  gsap.fromTo(
    el,
    { opacity: 0, y: -15 },
    { opacity: 1, y: 0, duration: 0.3, ease: "power2.out", onComplete: done }
  );
};
const onToolbarLeave = (el: HTMLElement, done: () => void) => {
  gsap.to(el, {
    opacity: 0,
    y: 15,
    duration: 0.2,
    ease: "power2.in",
    onComplete: done
  });
};
</script>

<style scoped lang="scss">
.file-heard-actions {
  display: flex;
  height: 40px; /* 调整为与 Element Plus 按钮默认高度一致 */
  align-items: center; /* 垂直居中 */
  .new-btn {
    border: var(--style-border);
  }
}
.actions-container {
  flex-grow: 1;
  position: relative;
  /* 确保容器和按钮一样高 */
  height: 100%;
}

.search-wrapper,
.selection-toolbar {
  width: 100%;
  height: 100%;
}

.selection-toolbar {
  display: flex;
  align-items: center;
  .action-group {
    display: flex;
    align-items: center;
    border-radius: var(--el-border-radius-base);
    overflow: hidden;
    border: 1px solid var(--el-border-color);

    .el-button {
      border-radius: 0;
      border-left: 1px solid var(--el-border-color-lighter);
      border-right: none;
      border-top: none;
      border-bottom: none;
      &:first-child {
        border-left: none;
      }
    }
  }
}
.selection-count {
  cursor: default !important;
  color: var(--el-text-color-primary) !important;
  background-color: transparent !important;
  border-left: 1px solid var(--el-border-color-lighter) !important;
}

.search-wrapper {
  cursor: pointer;
  height: 100%;
  :deep(.el-input) {
    height: 100%;
  }
}
:deep(.el-input.is-readonly .el-input__wrapper) {
  cursor: pointer !important;
  &:hover {
    box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
  }
}
:deep(.el-input.is-readonly .el-input__inner) {
  cursor: pointer !important;
}
</style>
