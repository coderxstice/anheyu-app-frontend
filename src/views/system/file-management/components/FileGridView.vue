<template>
  <div v-loading="loading" class="file-grid-view" data-is-file-container="true">
    <div
      v-for="file in files"
      :key="file.id"
      class="grid-item"
      :data-id="file.id"
      :data-type="file.type === FileType.Dir ? 'Dir' : 'File'"
      :class="{
        selected: selectedFileIds.has(file.id),
        'is-uploading': file.metadata?.['sys:upload_session_id'],
        'is-disabled': disabledFileIds?.has(file.id)
      }"
      @click="handleItemClick(file, $event)"
      @dblclick="handleItemDblClick(file)"
      @mousedown="handleMouseDown"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseLeave"
    >
      <div class="item-icon">
        <component :is="getFileIcon(file)" class="file-icon" />
        <div
          v-if="file.metadata?.['sys:upload_session_id']"
          class="uploading-overlay"
        >
          <el-tooltip content="文件上传中..." placement="top">
            <el-icon class="uploading-indicator">
              <Loading />
            </el-icon>
          </el-tooltip>
        </div>
      </div>
      <div class="item-name">{{ file.name }}</div>
    </div>

    <div v-if="isMoreLoading" class="grid-item-full-width">
      <div class="load-more-indicator">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </div>
    </div>

    <div
      v-if="!isMoreLoading && !hasMore && files.length > 0"
      class="grid-item-full-width"
    >
      <div class="no-more-indicator">
        <span>— 没有更多了 —</span>
      </div>
    </div>

    <el-empty
      v-if="files.length === 0 && !loading"
      description="这里什么都没有"
      class="grid-empty"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, type PropType } from "vue";
import { useFileIcons } from "../hooks/useFileIcons";
import gsap from "gsap";
import { FileItem, FileType } from "@/api/sys-file/type";
import { Loading } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { extractLogicalPathFromUri } from "@/utils/fileUtils";

const props = defineProps({
  files: {
    type: Array as PropType<FileItem[]>,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  selectedFileIds: {
    type: Set as PropType<Set<string>>,
    required: true
  },
  disabledFileIds: {
    type: Set as PropType<Set<string>>,
    default: () => new Set()
  },
  isMoreLoading: {
    type: Boolean,
    default: false
  },
  // [新增] 接收 hasMore prop，用于判断是否已加载所有数据
  hasMore: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits<{
  (e: "select-single", fileId: string): void;
  (e: "select-range", fileId: string): void;
  (e: "toggle-selection", fileId: string): void;
  (e: "select-all"): void;
  (e: "navigate-to", path: string): void;
}>();

const { getFileIcon } = useFileIcons();

/**
 * @description 鼠标按下时的动画效果
 * @param {MouseEvent} event - 鼠标事件
 */
const handleMouseDown = (event: MouseEvent) => {
  gsap.to(event.currentTarget as HTMLElement, {
    scale: 0.95,
    duration: 0.15,
    ease: "power2.out"
  });
};

/**
 * @description 鼠标松开时的动画效果
 * @param {MouseEvent} event - 鼠标事件
 */
const handleMouseUp = (event: MouseEvent) => {
  gsap.to(event.currentTarget as HTMLElement, {
    scale: 1,
    duration: 0.4,
    ease: "elastic.out(1, 0.5)"
  });
};

/**
 * @description 鼠标移出时的动画效果
 * @param {MouseEvent} event - 鼠标事件
 */
const handleMouseLeave = (event: MouseEvent) => {
  gsap.to(event.currentTarget as HTMLElement, {
    scale: 1,
    duration: 0.4,
    ease: "elastic.out(1, 0.5)"
  });
};

/**
 * @description 处理文件项的点击事件，用于选择文件
 * @param {FileItem} file - 被点击的文件项
 * @param {MouseEvent} event - 鼠标事件
 */
const handleItemClick = (file: FileItem, event: MouseEvent) => {
  if (props.disabledFileIds?.has(file.id)) return;
  if (file.metadata?.["sys:upload_session_id"]) return;

  if (event.shiftKey) {
    emit("select-range", file.id);
  } else if (event.metaKey || event.ctrlKey) {
    emit("toggle-selection", file.id);
  } else {
    emit("select-single", file.id);
  }
};

/**
 * @description 处理文件项的双击事件，用于导航到文件夹
 * @param {FileItem} file - 被双击的文件项
 */
const handleItemDblClick = (file: FileItem) => {
  if (props.disabledFileIds?.has(file.id)) {
    ElMessage.warning("不能进入正在移动的文件夹。");
    return;
  }
  if (file.metadata?.["sys:upload_session_id"]) return;

  if (file.type === FileType.Dir) {
    const logicalPath = extractLogicalPathFromUri(file.path);
    emit("navigate-to", logicalPath);
  }
};

/**
 * @description 处理全局键盘按下事件，用于全选
 * @param {KeyboardEvent} event - 键盘事件
 */
const handleKeyDown = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement;
  if (["INPUT", "TEXTAREA"].includes(target.tagName)) return;

  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a") {
    event.preventDefault();
    emit("select-all");
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
});
</script>

<style scoped>
.file-grid-view {
  padding: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 20px;
}
.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 16px 8px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid transparent;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    opacity 0.3s ease;
  text-align: center;
  user-select: none;
  position: relative;
}
.grid-item:hover {
  background-color: #f5f7fa;
}
.grid-item.selected {
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
}

.grid-item.is-uploading {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.grid-item.is-disabled {
  cursor: not-allowed;
  color: #a8abb2;
  opacity: 0.6;
}
.grid-item.is-disabled:hover {
  background-color: transparent;
}
.grid-item.is-disabled .file-icon {
  color: #c0c4cc;
}

.item-icon {
  width: 50px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 12px;
  position: relative;
}

.uploading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}
.uploading-indicator {
  font-size: 24px;
  animation: spin 1.5s linear infinite;
  color: var(--el-color-primary);
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.file-icon {
  font-size: 50px;
  width: 50px;
  height: 50px;
}
.item-name {
  width: 100%;
  min-width: 0;
  font-size: 14px;
  word-break: break-all;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
  height: calc(1.4 * 2 * 1em);
}
.grid-empty {
  grid-column: 1 / -1;
}

.grid-item-full-width {
  grid-column: 1 / -1;
}
.load-more-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 15px 0;
  color: #909399;
  font-size: 14px;
}
.load-more-indicator .el-icon {
  margin-right: 8px;
}

.no-more-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 0 20px;
  color: #c0c4cc;
  font-size: 13px;
}
</style>
