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
            <el-tooltip content="下载" placement="bottom" :show-arrow="false">
              <el-button :icon="Download" @click="emit('download')" />
            </el-tooltip>
            <el-tooltip content="复制" placement="bottom" :show-arrow="false">
              <el-button :icon="CopyDocument" @click="emit('copy')" />
            </el-tooltip>
            <el-tooltip content="移动" placement="bottom" :show-arrow="false">
              <el-button :icon="Folder" @click="emit('move')" />
            </el-tooltip>

            <!-- 使用从 props 传入的 isSingleSelection -->
            <template v-if="isSingleSelection">
              <el-tooltip
                content="重命名"
                placement="bottom"
                :show-arrow="false"
              >
                <el-button :icon="EditPen" @click="emit('rename')" />
              </el-tooltip>
              <el-tooltip content="分享" placement="bottom" :show-arrow="false">
                <el-button :icon="Share" @click="emit('share')" />
              </el-tooltip>
            </template>

            <el-tooltip content="删除" placement="bottom" :show-arrow="false">
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
  EditPen
} from "@element-plus/icons-vue";

// 1. 定义 Props 和 Emits
const props = defineProps<{
  hasSelection: boolean;
  isSingleSelection: boolean;
  selectionCountLabel: string;
}>();

const emit = defineEmits<{
  // 已有的 emits
  (e: "open-new-menu", event: MouseEvent): void;
  (e: "trigger-search", event: MouseEvent): void;
  (e: "clear-selection"): void;
  (e: "download"): void;
  (e: "copy"): void;
  (e: "move"): void;
  (e: "rename"): void;
  (e: "share"): void;
  (e: "delete"): void;
}>();

const handleNewButtonClick = (event: MouseEvent) => {
  emit("open-new-menu", event);
};

const isSearchVisible = ref(false);
const searchOrigin = ref({ x: 0, y: 0 });

const openSearchOverlay = (event: MouseEvent) => {
  emit("trigger-search", event);
};

// GSAP 动画钩子
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
  align-items: center;
  height: 40px;

  .new-btn {
    height: 40px;
    border: var(--style-border);
  }
}

.actions-container {
  position: relative;
  flex-grow: 1;
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
    overflow: hidden;
    border: 1px solid var(--el-border-color);
    border-radius: var(--el-border-radius-base);

    .el-button {
      border-top: none;
      border-right: none;
      border-bottom: none;
      border-left: 1px solid var(--el-border-color-lighter);
      border-radius: 0;

      &:first-child {
        border-left: none;
      }
    }
  }
}

.selection-count {
  color: var(--el-text-color-primary) !important;
  cursor: default !important;
  background-color: transparent !important;
  border-left: 1px solid var(--el-border-color-lighter) !important;
}

.search-wrapper {
  height: 100%;
  cursor: pointer;

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
