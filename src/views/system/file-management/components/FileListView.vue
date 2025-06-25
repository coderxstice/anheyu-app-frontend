<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useFileStore } from "@/store/modules/fileStore";
import { formatSize } from "@/utils/format";
import { useFileIcons } from "../hooks/useFileIcons";
import gsap from "gsap";
import { FileItem, FileType } from "@/api/sys-file/type"; // 确保 FileType 已正确导入

// --- 初始化 ---
const fileStore = useFileStore();
const { getFileIcon } = useFileIcons(); // useFileIcons 钩子需要被修改
const { files, loading, selectedFiles } = storeToRefs(fileStore);

const hoveredFileId = ref<string | null>(null);

// --- GSAP 动画钩子 ---
const onIconEnter = (el: HTMLElement, done: () => void) => {
  // 添加类型注解
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

const onIconLeave = (el: HTMLElement, done: () => void) => {
  // 添加类型注解
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

// --- 事件处理函数 ---
const handleItemClick = (item: FileItem, event: MouseEvent) => {
  if (event.shiftKey) {
    fileStore.selectRange(item.id);
  } else if (event.metaKey || event.ctrlKey) {
    fileStore.toggleSelection(item.id);
  } else {
    fileStore.selectSingle(item.id);
  }
};

const handlePathChange = (newPath: string) => {
  if (loading.value) return;
  console.log("调用 fileStore.loadFiles，传入路径:", newPath);
  fileStore.loadFiles(newPath);
};

const handleKeyDown = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement;
  if (["INPUT", "TEXTAREA"].includes(target.tagName)) return;

  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a") {
    event.preventDefault();
    fileStore.selectAll();
  }
};

// --- 生命周期 ---
onMounted(() => {
  handlePathChange("anzhiyu://my/"); // 首次加载文件列表，使用后端定义的根路径 URI
  window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
});
</script>

<template>
  <div class="file-list-container">
    <div class="file-list-header">
      <div class="column-name">名称</div>
      <div class="column-size">文件大小</div>
      <div class="column-modified">更改时间</div>
    </div>

    <div v-if="loading" class="state-view">
      <span>正在努力加载中...</span>
    </div>

    <ul v-else class="file-list-body">
      <li v-if="!files.length" class="state-view">
        <span>这里什么都没有</span>
      </li>
      <li
        v-for="item in files"
        :key="item.id"
        class="file-item deselect-safe-zone"
        :data-id="item.id"
        :class="{ selected: selectedFiles.has(item.id) }"
        @click="handleItemClick(item, $event)"
        @dblclick="
          item.type === FileType.Dir && // 这里已正确使用 FileType.Dir
          (_ => {
            console.log('双击了目录项:', item);
            return true;
          })() &&
          handlePathChange(item.path) // 直接使用 item.path 进行导航
        "
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
              v-if="selectedFiles.has(item.id)"
              :key="item.id + '-selected'"
              icon="material-symbols:check-circle-rounded"
              class="file-icon selected-icon"
              @click.stop="fileStore.toggleSelection(item.id)"
            />

            <IconifyIconOnline
              v-else-if="selectedFiles.size > 0 && hoveredFileId === item.id"
              :key="item.id + '-hover'"
              icon="charm:circle"
              class="file-icon hover-icon"
              @click.stop="fileStore.toggleSelection(item.id)"
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
        </div>
        <div class="column-size">{{ formatSize(item.size) }}</div>
        <div class="column-modified">{{ item.updated_at }}</div>
      </li>
    </ul>
  </div>
</template>

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
  /* border-bottom: 1px solid #f1f5f9; */
  margin: 1px 0;
}

.file-item {
  cursor: pointer;
  border-radius: 6px;
  user-select: none;
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

/* 使图标本身也可点击 */
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
