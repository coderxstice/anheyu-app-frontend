<template>
  <div v-loading="loading && !files.length" class="file-list-container">
    <div class="file-list-header">
      <div class="column-name">名称</div>
      <div class="column-size">文件大小</div>
      <div class="column-modified">创建时间</div>
    </div>

    <ul class="file-list-body" data-is-file-container="true">
      <li v-if="!files.length && !loading" class="state-view">
        <span>这里什么都没有</span>
      </li>
      <li
        v-for="item in files"
        :key="item.id"
        class="file-item"
        :data-id="item.id"
        :data-type="item.type === FileType.Dir ? 'Dir' : 'File'"
        :class="{
          selected: selectedFileIds.has(item.id),
          'is-uploading': item.metadata?.['sys:upload_session_id'],
          'is-disabled': disabledFileIds?.has(item.id)
        }"
        @click="handleItemClick(item, $event)"
        @dblclick="handleItemDblClick(item)"
        @mouseenter="hoveredFileId = item.id"
        @mouseleave="hoveredFileId = null"
        @mousedown="handleMouseDown"
        @mouseup="handleMouseUp"
      >
        <div class="column-name">
          <Transition
            name="icon-swap"
            mode="out-in"
            @enter="onIconEnter"
            @leave="onIconLeave"
          >
            <IconifyIconOnline
              v-if="selectedFileIds.has(item.id)"
              :key="item.id + '-selected'"
              icon="material-symbols:check-circle-rounded"
              class="file-icon selected-icon"
              @click.stop="emit('toggle-selection', item.id)"
            />
            <IconifyIconOnline
              v-else-if="
                selectedFileIds.size > 0 &&
                hoveredFileId === item.id &&
                !disabledFileIds?.has(item.id)
              "
              :key="item.id + '-hover'"
              icon="charm:circle"
              class="file-icon hover-icon"
              @click.stop="emit('toggle-selection', item.id)"
              @dblclick.stop
            />
            <component
              :is="getFileIcon(item)"
              v-else
              :key="item.id + '-default'"
              class="file-icon"
            />
          </Transition>
          <span>{{ item.name }}</span>

          <el-tooltip
            v-if="item.metadata?.['sys:upload_session_id']"
            content="文件上传中..."
            placement="top"
          >
            <el-icon class="uploading-indicator">
              <Loading />
            </el-icon>
          </el-tooltip>
        </div>
        <div v-if="item.type === FileType.File" class="column-size">
          {{ formatSize(item.size) }}
        </div>
        <div v-else class="column-size">--</div>
        <div class="column-modified">{{ formatDateTime(item.created_at) }}</div>
      </li>
      <li v-if="isMoreLoading" class="state-view load-more-indicator">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </li>

      <li
        v-if="!isMoreLoading && !hasMore && files.length > 0"
        class="state-view no-more-indicator"
      >
        <span>— 没有更多了 —</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, type PropType } from "vue";
import { formatSize, formatDateTime } from "@/utils/format";
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
const hoveredFileId = ref<string | null>(null);

const onIconEnter = (el: Element, done: () => void) => {
  gsap.fromTo(
    el,
    { opacity: 0 },
    {
      opacity: 1,
      duration: 0.125,
      ease: "cubic-bezier(0.4, 0, 0.2, 1)",
      onComplete: done
    }
  );
};
const onIconLeave = (el: Element, done: () => void) => {
  gsap.to(el, {
    opacity: 0,
    duration: 0.105,
    ease: "cubic-bezier(0.4, 0, 0.2, 1)",
    onComplete: done
  });
};
const handleMouseDown = (event: MouseEvent) => {
  gsap.to(event.currentTarget as HTMLElement, {
    scale: 0.995,
    duration: 0.15,
    ease: "power2.out"
  });
};
const handleMouseUp = (event: MouseEvent) => {
  gsap.to(event.currentTarget as HTMLElement, {
    scale: 1,
    duration: 0.4,
    ease: "elastic.out(1, 0.5)"
  });
};

const handleItemClick = (item: FileItem, event: MouseEvent) => {
  if (props.disabledFileIds?.has(item.id)) return;
  if (item.metadata?.["sys:upload_session_id"]) return;

  if (event.shiftKey) {
    emit("select-range", item.id);
  } else if (event.metaKey || event.ctrlKey) {
    emit("toggle-selection", item.id);
  } else {
    emit("select-single", item.id);
  }
};

const handleItemDblClick = (item: FileItem) => {
  if (props.disabledFileIds?.has(item.id)) {
    ElMessage.warning("不能进入正在移动的文件夹。");
    return;
  }
  if (item.metadata?.["sys:upload_session_id"]) return;

  if (item.type === FileType.Dir) {
    const logicalPath = extractLogicalPathFromUri(item.path);
    emit("navigate-to", logicalPath);
  }
};

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

<style scoped lang="scss">
.file-list-container {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  background-color: white;
  display: flex;
  flex-direction: column;
  position: relative;
}
.file-list-body {
  padding: 6px 8px;
  flex: 1;
}

.file-list-header,
.file-item {
  display: flex;
  align-items: center;
  padding: 12px 8px;
  font-size: 14px;
}

.file-item {
  margin: 1px 0;
  cursor: pointer;
  border-radius: 6px;
  user-select: none;
  transition:
    opacity 0.3s ease,
    background-color 0.2s ease;
}

.file-list-header {
  margin: 0;
  color: #64748b;
  font-weight: 500;
  border-bottom: 1px solid #e5e7eb;
  background-color: white;
  position: sticky;
  top: 0;
}

.file-item:last-child {
  border-bottom: none;
}
.file-item:hover {
  background-color: #f8fafc;
}
.file-item.selected {
  color: #fff;
  background-color: var(--anzhiyu-theme, #007bff) !important;
  .column-size,
  .column-modified {
    color: #fff;
  }
}

.file-item.is-uploading {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.file-item.is-disabled {
  cursor: not-allowed;
  color: #a8abb2;
  &:hover {
    background-color: transparent;
  }
  .file-icon {
    color: #c0c4cc;
  }
}

.column-name {
  flex: 5;
  display: flex;
  align-items: center;
  gap: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-left: 12px;
}
.file-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.selected-icon,
.hover-icon {
  cursor: pointer;
}

.selected-icon {
  color: gold;
}
.hover-icon {
  color: #a0a0a0;
}

.uploading-indicator {
  animation: spin 1.5s linear infinite;
  color: var(--el-color-primary);
  font-size: 16px;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.column-size {
  flex: 1.5;
  text-align: left;
  color: #64748b;
}
.column-modified {
  flex: 2.5;
  color: #64748b;
}

.state-view {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
  color: #909399;
  font-size: 14px;
}

.load-more-indicator {
  padding: 15px 0;
  .el-icon {
    margin-right: 8px;
  }
}

.load-more-indicator,
.no-more-indicator {
  padding: 0 0 20px;
}

.load-more-indicator {
  .el-icon {
    margin-right: 8px;
  }
}

.no-more-indicator {
  color: #c0c4cc;
  font-size: 13px;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.is-loading {
  animation: spin 1.5s linear infinite;
}
</style>
