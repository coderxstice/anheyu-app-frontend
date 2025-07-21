<template>
  <Teleport to="body">
    <Transition name="az-fade">
      <div v-if="visible" class="az-text-preview-overlay" @click.self="close">
        <div class="editor-modal">
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

          <!-- 内容区域：根据加载状态显示 spinner 或编辑器 -->
          <div class="editor-content-wrapper">
            <div v-if="isLoading" class="loading-container">
              <div class="loading-spinner" />
            </div>
            <!-- 使用 v-show 可以在加载完成后平滑显示，避免编辑器重新渲染 -->
            <div
              v-show="!isLoading"
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
import { ref, onUnmounted, watch, nextTick, computed } from "vue";
import * as monaco from "monaco-editor";
import { useFileIcons } from "@/views/system/file-management/hooks/useFileIcons";
import { type FileItem, FileType } from "@/api/sys-file/type";
import { fetchBlobFromUrl } from "@/api/sys-file/sys-file";
import { ElMessage } from "element-plus";

// 编辑器实例
let editorInstance: monaco.editor.IStandaloneCodeEditor | null = null;
const editorContainerRef = ref<HTMLElement | null>(null);

// 组件状态
const visible = ref(false);
const isLoading = ref(false);
const currentFile = ref<FileItem | null>(null);

// Hooks
const { getFileIcon, getLanguageByExtension } = useFileIcons();

/**
 * 计算文件图标
 */
const fileIcon = computed(() => {
  if (currentFile.value) {
    return getFileIcon(currentFile.value);
  }
  // 提供一个符合 FileItem 结构的最小默认对象，以避免类型错误
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
 * 打开预览器的方法 (由外部调用)
 * @param file - 完整的文件对象
 * @param url - 文件的带签名访问 URL
 */
const open = async (file: FileItem, url: string) => {
  // 1. 重置状态并显示外壳
  currentFile.value = file;
  visible.value = true;
  isLoading.value = true;

  try {
    // 2. 组件内部异步获取文件内容
    const blob = await fetchBlobFromUrl(url);
    const content = await blob.text();

    // 3. 等待 DOM 更新，确保编辑器容器 <div ref="editorContainerRef"> 已被渲染
    await nextTick();

    // 4. 再次检查 visible 状态，防止用户在内容加载时就关闭了窗口
    if (visible.value) {
      initEditor(content);
    }
  } catch (error) {
    console.error("Failed to fetch and preview text content:", error);
    ElMessage.error("文件内容加载失败。");
    close(); // 加载失败时直接关闭窗口
  } finally {
    // 5. 无论成功与否，都结束加载状态
    isLoading.value = false;
  }
};

/**
 * 初始化 Monaco Editor
 * @param content - 要显示的文件内容字符串
 */
const initEditor = (content: string) => {
  if (!editorContainerRef.value || !currentFile.value) return;

  const language = getLanguageByExtension(
    currentFile.value.name.split(".").pop() || ""
  );

  // 销毁可能存在的旧实例
  if (editorInstance) {
    editorInstance.dispose();
  }

  // 创建新实例
  editorInstance = monaco.editor.create(editorContainerRef.value, {
    value: content,
    language: language,
    theme: "vs-dark",
    readOnly: true,
    automaticLayout: true,
    minimap: { enabled: true },
    wordWrap: "on",
    scrollBeyondLastLine: false,
    fontSize: 14
  });
};

/**
 * 关闭预览器
 */
const close = () => {
  visible.value = false;
};

/**
 * 切换全屏
 */
const toggleFullScreen = () => {
  const modal = document.querySelector(".editor-modal");
  if (modal) {
    if (!document.fullscreenElement) {
      modal.requestFullscreen().catch(err => {
        console.error(
          `Error attempting to enable full-screen mode: ${err.message} (${err.name})`
        );
      });
    } else {
      document.exitFullscreen();
    }
  }
};

// 监听 visible 状态，在关闭时清理资源
watch(visible, newVal => {
  if (!newVal) {
    if (editorInstance) {
      editorInstance.dispose();
      editorInstance = null;
    }
    currentFile.value = null; // 清理状态
  }
});

// 组件卸载时确保销毁编辑器实例
onUnmounted(() => {
  if (editorInstance) {
    editorInstance.dispose();
  }
});

// 暴露 open 方法给父组件
defineExpose({ open });
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
    height 0.3s;
}

.editor-modal:fullscreen {
  width: 100vw;
  height: 100vh;
  border-radius: 0;
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
  justify-content: center;
  align-items: center;
  background-color: #1e1e1e;
  z-index: 10;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
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
