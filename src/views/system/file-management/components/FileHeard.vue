<template>
  <div class="file-heard-actions w-full flex items-center">
    <!-- “新建”按钮的逻辑保持不变，因为它已经通过 emit 与父组件通信 -->
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
        <!-- 使用从 props 传入的 hasSelection -->
        <div
          v-if="hasSelection"
          key="selection-toolbar"
          class="selection-toolbar"
        >
          <el-button-group class="action-group">
            <!-- 通过 emit 发出清空选择的意图 -->
            <el-button
              :icon="Close"
              title="取消选择"
              @click="emit('clear-selection')"
            />
            <!-- 使用从 props 传入的 selectionCountLabel -->
            <el-button class="selection-count" disabled>{{
              selectionCountLabel
            }}</el-button>
          </el-button-group>

          <el-button-group class="ml-2 action-group">
            <!-- 所有的操作都通过 emit 发出 -->
            <el-tooltip content="下载" placement="bottom">
              <el-button :icon="Download" @click="emit('download')" />
            </el-tooltip>
            <el-tooltip content="复制" placement="bottom">
              <el-button :icon="CopyDocument" @click="emit('copy')" />
            </el-tooltip>
            <el-tooltip content="移动" placement="bottom">
              <el-button :icon="Folder" @click="emit('move')" />
            </el-tooltip>

            <!-- 使用从 props 传入的 isSingleSelection -->
            <template v-if="isSingleSelection">
              <el-tooltip content="重命名" placement="bottom">
                <el-button :icon="EditPen" @click="emit('rename')" />
              </el-tooltip>
              <el-tooltip content="分享" placement="bottom">
                <el-button :icon="Share" @click="emit('share')" />
              </el-tooltip>
            </template>

            <el-tooltip content="删除" placement="bottom">
              <el-button type="danger" :icon="Delete" @click="emit('delete')" />
            </el-tooltip>
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

    <!-- 搜索浮层逻辑保持不变 -->
    <SearchOverlay
      :visible="isSearchVisible"
      :origin="searchOrigin"
      @close="isSearchVisible = false"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import SearchOverlay from "./SearchOverlay.vue"; // 假设这是正确的路径
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
  EditPen
} from "@element-plus/icons-vue";

// --- 1. 定义 Props 和 Emits ---
const props = defineProps<{
  hasSelection: boolean;
  isSingleSelection: boolean;
  selectionCountLabel: string;
}>();

const emit = defineEmits<{
  // 已有的 emits
  (e: "open-new-menu", event: MouseEvent): void;
  (e: "trigger-search", event: MouseEvent): void;
  // 新增的 emits，用于文件操作
  (e: "clear-selection"): void;
  (e: "download"): void;
  (e: "copy"): void;
  (e: "move"): void;
  (e: "rename"): void;
  (e: "share"): void;
  (e: "delete"): void;
}>();

// --- “新建”和“搜索”按钮逻辑 (大部分保持不变) ---
const handleNewButtonClick = (event: MouseEvent) => {
  emit("open-new-menu", event);
};

const isSearchVisible = ref(false); // Note: 这个状态可能也应该由父组件管理
const searchOrigin = ref({ x: 0, y: 0 });

const openSearchOverlay = (event: MouseEvent) => {
  emit("trigger-search", event);
};

// --- 选择工具栏按钮处理函数 (现在都通过 emit 实现，所以不再需要本地函数) ---

// --- GSAP 动画钩子 (保持不变) ---
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
/* 样式保持不变 */
.file-heard-actions {
  display: flex;
  height: 40px;
  align-items: center;
  .new-btn {
    border: var(--style-border);
  }
}
.actions-container {
  flex-grow: 1;
  position: relative;
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
