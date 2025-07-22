<template>
  <Teleport to="body">
    <Transition name="az-fade">
      <div v-if="visible" class="az-text-preview-overlay" @click.self="close">
        <div
          class="editor-modal"
          :class="{ 'light-theme': currentTheme === 'vs' }"
        >
          <div class="editor-header">
            <div class="file-info">
              <component :is="fileIcon" class="file-icon" />
              <span class="file-name">{{ currentFile?.name }}</span>
            </div>
            <div class="actions">
              <el-tooltip content="全屏" placement="bottom">
                <span class="action-btn" @click="toggleFullScreen">
                  <IconifyIconOnline icon="ant-design:fullscreen-outlined" />
                </span>
              </el-tooltip>
              <el-tooltip content="关闭" placement="bottom">
                <span class="action-btn" @click="close">
                  <IconifyIconOnline icon="ant-design:close-outlined" />
                </span>
              </el-tooltip>
            </div>
          </div>

          <div class="editor-content-wrapper">
            <!-- 加载状态覆盖层 -->
            <div v-if="isLoading || isMonacoLoading" class="loading-container">
              <div class="loading-spinner" />
              <span v-if="isMonacoLoading" class="loading-text"
                >编辑器首次加载中...</span
              >
            </div>
            <!-- 编辑器挂载点 -->
            <div
              v-show="!isLoading && !isMonacoLoading"
              ref="editorContainerRef"
              class="editor-container"
            />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onUnmounted, watch, nextTick, computed, shallowRef } from "vue";
import type * as Monaco from "monaco-editor"; // 仅导入类型，用于 TypeScript 检查
import { useFileIcons } from "@/views/system/file-management/hooks/useFileIcons";
import { type FileItem, FileType } from "@/api/sys-file/type";
import { fetchBlobFromUrl } from "@/api/sys-file/sys-file";
import { ElMessage } from "element-plus";

// --- Monaco 相关 ---
// 使用 shallowRef 存储 monaco 对象和编辑器实例，避免不必要的性能开销
const monacoRef = shallowRef<typeof Monaco | null>(null);
const editorInstance = shallowRef<Monaco.editor.IStandaloneCodeEditor | null>(
  null
);
const editorContainerRef = ref<HTMLElement | null>(null);
const isMonacoLoading = ref(false); // 专门用于表示 monaco 库本身的加载状态

// --- 组件状态 ---
const visible = ref(false);
const isLoading = ref(false); // 用于文件内容的加载状态
const currentFile = ref<FileItem | null>(null);
const currentTheme = ref<"vs" | "vs-dark">("vs-dark");

// --- Hooks ---
const { getFileIcon, getLanguageByExtension } = useFileIcons();

const fileIcon = computed(() => {
  if (currentFile.value) return getFileIcon(currentFile.value);
  const fallbackFile: FileItem = {
    id: "",
    name: "unknown",
    type: FileType.File,
    size: 0,
    created_at: "",
    updated_at: "",
    path: "",
    owned: false,
    shared: false,
    permission: null,
    capability: "",
    primary_entity_public_id: ""
  };
  return getFileIcon(fallbackFile);
});

/**
 * 异步加载 Monaco Editor 库。
 * 使用单例模式，确保整个应用生命周期中只加载一次。
 */
const loadMonaco = async () => {
  if (monacoRef.value) {
    return monacoRef.value; // 如果已加载，直接返回
  }
  isMonacoLoading.value = true;
  try {
    const monaco = await import("monaco-editor");
    monacoRef.value = monaco;
    return monaco;
  } catch (error) {
    console.error("Failed to load Monaco Editor:", error);
    ElMessage.error("编辑器核心组件加载失败！");
    return null;
  } finally {
    isMonacoLoading.value = false;
  }
};

/**
 * 打开预览器的方法，由外部调用
 */
const open = async (
  file: FileItem,
  url: string,
  theme: "light" | "dark" = "dark"
) => {
  // 1. 立即显示 UI 外壳和加载状态
  currentTheme.value = theme === "light" ? "vs" : "vs-dark";
  currentFile.value = file;
  visible.value = true;
  isLoading.value = true;

  try {
    // 2. 并行加载 Monaco 库和文件内容，提高效率
    const [monaco, blob] = await Promise.all([
      loadMonaco(),
      fetchBlobFromUrl(url)
    ]);

    // 如果 monaco 加载失败，则退出
    if (!monaco) {
      close();
      return;
    }

    const content = await blob.text();

    await nextTick();
    if (visible.value) {
      initEditor(monaco, content);
    }
  } catch (error) {
    console.error("Failed to fetch and preview text content:", error);
    ElMessage.error("文件内容加载失败。");
    close();
  } finally {
    // 无论成功与否，都结束文件内容的加载状态
    isLoading.value = false;
  }
};

/**
 * 初始化 Monaco Editor 实例
 */
const initEditor = (monaco: typeof Monaco, content: string) => {
  if (!editorContainerRef.value || !currentFile.value) return;
  const language = getLanguageByExtension(
    currentFile.value.name.split(".").pop() || ""
  );

  if (editorInstance.value) editorInstance.value.dispose();

  editorInstance.value = monaco.editor.create(editorContainerRef.value, {
    value: content,
    language: language,
    theme: currentTheme.value,
    readOnly: true,
    automaticLayout: true,
    minimap: { enabled: true },
    wordWrap: "on",
    scrollBeyondLastLine: false,
    fontSize: 14
  });
};

/**
 * 动态设置主题
 */
const setTheme = (theme: "light" | "dark") => {
  const monaco = monacoRef.value;
  // 确保 monaco 库和编辑器实例都已存在
  if (!monaco || !editorInstance.value) return;

  const newMonacoTheme = theme === "light" ? "vs" : "vs-dark";
  currentTheme.value = newMonacoTheme;
  monaco.editor.setTheme(newMonacoTheme);
};

const close = () => {
  visible.value = false;
};

const toggleFullScreen = () => {
  /* ... */
};

watch(visible, newVal => {
  if (!newVal && editorInstance.value) {
    editorInstance.value.dispose();
    editorInstance.value = null;
    currentFile.value = null;
  }
});

onUnmounted(() => {
  if (editorInstance.value) editorInstance.value.dispose();
});

defineExpose({ open, setTheme });
</script>

<style scoped lang="scss">
.az-fade-enter-active,
.az-fade-leave-active {
  transition: opacity 0.3s ease;
}
.az-fade-enter-from,
.az-fade-leave-to {
  opacity: 0;
}

.az-text-preview-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.editor-modal {
  width: 80vw;
  height: 85vh;
  max-width: 1400px;
  background-color: #1e1e1e;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition:
    width 0.3s,
    height 0.3s,
    background-color 0.3s;
}

.editor-modal:fullscreen {
  width: 100vw;
  height: 100vh;
  border-radius: 0;
}

/* Light Theme Styles */
.editor-modal.light-theme {
  background-color: #fff;
  border: 1px solid #e0e0e0;
}
.editor-modal.light-theme .editor-header {
  background-color: #f5f7fa;
  color: #303133;
  border-bottom: 1px solid #e0e0e0;
}
.editor-modal.light-theme .action-btn {
  color: #606266;
  &:hover {
    color: #303133;
  }
}
.editor-modal.light-theme .loading-container {
  background-color: #fff;
}
.editor-modal.light-theme .loading-spinner {
  border-color: rgba(0, 0, 0, 0.1);
  border-top-color: #409eff;
}
.editor-modal.light-theme .loading-text {
  color: #606266;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background-color: #333;
  color: #ccc;
  flex-shrink: 0;
  user-select: none;
  transition:
    background-color 0.3s,
    color 0.3s;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}
.file-icon {
  width: 18px;
  height: 18px;
}
.actions {
  display: flex;
  gap: 16px;
}
.action-btn {
  cursor: pointer;
  font-size: 16px;
  color: #ccc;
  transition: color 0.2s;
  &:hover {
    color: #fff;
  }
}

.editor-content-wrapper {
  flex-grow: 1;
  position: relative;
  width: 100%;
  height: 100%;
}

.loading-container {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  background-color: #1e1e1e;
  z-index: 10;
  transition: background-color 0.3s;
}
.loading-text {
  color: #ccc;
  font-size: 14px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  transition: border-color 0.3s;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.editor-container {
  width: 100%;
  height: 100%;
}
</style>
