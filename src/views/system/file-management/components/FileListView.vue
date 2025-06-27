<template>
  <div v-loading="loading" class="file-list-container">
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
        :class="{
          selected: selectedFileIds.has(item.id),
          'is-uploading': item.metadata?.['sys:upload_session_id']
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
              v-else-if="selectedFileIds.size > 0 && hoveredFileId === item.id"
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
        <div class="column-size">{{ formatSize(item.size) }}</div>
        <div class="column-modified">{{ item.created_at }}</div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { formatSize } from "@/utils/format";
import { useFileIcons } from "../hooks/useFileIcons";
import gsap from "gsap";
import { FileItem, FileType } from "@/api/sys-file/type";
import { Loading } from "@element-plus/icons-vue"; // **核心新增**: 引入 Loading 图标

// --- 1. 定义 Props 和 Emits ---
const props = defineProps<{
  files: FileItem[];
  loading: boolean;
  selectedFileIds: Set<string>;
}>();

const emit = defineEmits<{
  (e: "select-single", fileId: string): void;
  (e: "select-range", fileId: string): void;
  (e: "toggle-selection", fileId: string): void;
  (e: "select-all"): void;
  (e: "navigate-to", path: string): void;
  (e: "load-initial"): void;
}>();

// --- 2. 初始化独立的 Hooks 和本地状态 ---
const { getFileIcon } = useFileIcons();
const hoveredFileId = ref<string | null>(null);

// --- 3. 动画处理 (保持不变) ---
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

// --- 4. 修改事件处理器，通过 emit 发出意图 ---
const handleItemClick = (item: FileItem, event: MouseEvent) => {
  // **核心修改**: 如果文件正在上传中，则禁止所有点击交互
  if (item.metadata?.["sys:upload_session_id"]) {
    return;
  }

  if (event.shiftKey) {
    emit("select-range", item.id);
  } else if (event.metaKey || event.ctrlKey) {
    emit("toggle-selection", item.id);
  } else {
    emit("select-single", item.id);
  }
};

const handleItemDblClick = (item: FileItem) => {
  // **核心修改**: 如果文件正在上传中，则禁止双击导航
  if (item.metadata?.["sys:upload_session_id"]) {
    return;
  }

  if (item.type === FileType.Dir) {
    emit("navigate-to", item.path);
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

// --- 5. 生命周期钩子 ---
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
}
.file-list-body {
  padding: 6px 8px;
}

.file-list-header,
.file-item {
  display: flex;
  align-items: center;
  padding: 12px 8px;
  font-size: 14px;
  margin: 1px 0;
}

.file-item {
  cursor: pointer;
  border-radius: 6px;
  user-select: none;
  transition:
    opacity 0.3s ease,
    background-color 0.2s ease; /* 平滑过渡 */
}

.file-list-header {
  color: #64748b;
  font-weight: 500;
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

/* **核心新增**: 上传中状态的样式 */
.file-item.is-uploading {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none; /* 彻底禁用所有鼠标事件 */
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

/* **核心新增**: 上传中标志的样式 */
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
</style>
