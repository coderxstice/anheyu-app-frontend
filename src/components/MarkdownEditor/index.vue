<!--
 * @Description: Markdown编辑器组件（重构版）
 * @Author: 安知鱼
 * @Date: 2025-12-27
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useMusicPlayer } from "./composables/useMusicPlayer";
import { useContentProcessor } from "./composables/useContentProcessor";

// 动态导入类型定义
type MdEditor = any;
type Themes = any;
type ExposeParam = any;
type ToolbarNames = any;

const props = defineProps<{
  modelValue: string;
  onUploadImg: (files: File[], callback: (urls: string[]) => void) => void;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "onSave", markdown: string, html: string): void;
}>();

// === 使用 composables ===
const {
  enrichHtmlMusicPlayers,
  processNewNode,
  createMusicPlayerObserver,
  disconnectMusicPlayerObserver
} = useMusicPlayer();

const { sanitize, registerGlobalCopyHandler, unregisterGlobalCopyHandler } =
  useContentProcessor();

// === 编辑器状态 ===
const MdEditorComponent = ref<any>(null);
const isEditorLoading = ref(true);
const loadError = ref<string>("");
const editorRef = ref<ExposeParam>();
const theme = ref<Themes>("light");
const containerRef = ref<HTMLElement | null>(null);

// 重新加载方法
const reloadPage = () => {
  window.location.reload();
};

// === 工具栏配置 ===
const toolbars: ToolbarNames[] = [
  "bold",
  "underline",
  "italic",
  "strikeThrough",
  "-",
  "title",
  "sub",
  "sup",
  "quote",
  "unorderedList",
  "orderedList",
  "task",
  "-",
  "codeRow",
  "code",
  "link",
  "image",
  "table",
  "mermaid",
  "katex",
  "revoke",
  "next",
  "save",
  "=",
  "pageFullscreen",
  "fullscreen",
  "preview",
  "previewOnly",
  "htmlPreview",
  "catalog"
];

// 预览区域点击事件处理
const handlePreviewClick = (event: MouseEvent) => {
  // 所有交互逻辑已经通过 onclick 内联事件处理器实现
};

// 主题观察器
const themeObserver = new MutationObserver(() => {
  const newTheme = document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
  if (theme.value !== newTheme) {
    theme.value = newTheme;
  }
});

// === 等待 Mermaid 渲染完成 ===
const waitForMermaidRender = async (
  maxWaitMs: number = 5000,
  checkIntervalMs: number = 100
): Promise<boolean> => {
  const previewContainer = containerRef.value?.querySelector(
    ".md-editor-preview-wrapper"
  );
  if (!previewContainer) return true;

  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    // 找到所有 mermaid 块
    const mermaidBlocks =
      previewContainer.querySelectorAll(".md-editor-mermaid");

    if (mermaidBlocks.length === 0) {
      return true; // 没有 mermaid 块，直接返回
    }

    // 检查是否所有 mermaid 块都已渲染完成（包含 SVG）
    let allRendered = true;
    for (const block of Array.from(mermaidBlocks)) {
      const hasSvg = block.querySelector("svg");
      const isProcessed = block.hasAttribute("data-processed");

      if (!hasSvg || !isProcessed) {
        allRendered = false;
        break;
      }
    }

    if (allRendered) {
      console.log(
        `[保存文章] 所有 Mermaid 图表已渲染完成 (${mermaidBlocks.length} 个)`
      );
      return true;
    }

    // 等待一段时间后再检查
    await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
  }

  console.warn(
    `[保存文章] Mermaid 渲染超时 (${maxWaitMs}ms)，部分图表可能未完成渲染`
  );
  return false;
};

// 保存处理
const handleSave = async (markdown: string, htmlPromise: Promise<string>) => {
  console.log("[保存文章] 开始处理...");
  console.log("[保存文章] Markdown长度:", markdown.length);

  // 等待 Mermaid 渲染完成（最多等待5秒）
  await waitForMermaidRender(5000, 100);

  // 获取原始HTML
  const rawHtml = await htmlPromise;
  console.log("[保存文章] 原始HTML长度:", rawHtml.length);

  // 为HTML中的音乐播放器注入完整数据
  const enrichedHtml = await enrichHtmlMusicPlayers(rawHtml);
  console.log("[保存文章] 音乐数据注入后HTML长度:", enrichedHtml.length);

  // 清理HTML
  const sanitizedHtml = sanitize(enrichedHtml);

  // 保存：Markdown保持原样，HTML包含完整的音乐数据
  emit("onSave", markdown, sanitizedHtml);
  console.log("[保存文章] 保存完成");
};

// 音乐播放器观察器
let musicPlayerObserver: MutationObserver | null = null;

onMounted(async () => {
  // 动态导入 md-editor-v3
  try {
    const [{ MdEditor }, { installMarkdownEditorExtensions }] =
      await Promise.all([import("md-editor-v3"), import("./config")]);

    // 动态导入样式
    await import("md-editor-v3/lib/style.css");

    // 初始化编辑器扩展
    installMarkdownEditorExtensions();

    MdEditorComponent.value = MdEditor;
    isEditorLoading.value = false;

    // 注册全局复制处理函数
    registerGlobalCopyHandler();

    // 初始化主题和监听器
    theme.value = document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
    themeObserver.observe(document.documentElement, { attributes: true });

    // 监听编辑器预览区域的DOM变化以初始化音乐播放器
    if (containerRef.value) {
      containerRef.value.addEventListener("click", handlePreviewClick);

      // 延迟启动音乐播放器观察器，确保编辑器已完全渲染
      setTimeout(() => {
        const previewContainer = containerRef.value?.querySelector(
          ".md-editor-preview-wrapper"
        );
        if (previewContainer) {
          musicPlayerObserver = createMusicPlayerObserver();
          musicPlayerObserver.observe(previewContainer, {
            childList: true,
            subtree: true
          });

          // 初始化已存在的音乐播放器
          if (previewContainer.children.length > 0) {
            processNewNode(previewContainer as HTMLElement);
          }
        }
      }, 300);
    }
  } catch (error) {
    console.error("Failed to load markdown editor:", error);
    loadError.value = "Markdown编辑器加载失败";
    isEditorLoading.value = false;
  }
});

onUnmounted(() => {
  themeObserver.disconnect();
  disconnectMusicPlayerObserver();
  if (containerRef.value) {
    containerRef.value.removeEventListener("click", handlePreviewClick);
  }
  // 清理全局函数
  unregisterGlobalCopyHandler();
});

defineExpose({
  triggerSave: () => editorRef.value?.triggerSave()
});
</script>

<template>
  <div ref="containerRef" class="md-editor-container">
    <!-- 加载中状态 -->
    <div v-if="isEditorLoading" class="editor-loading">
      <div class="loading-spinner" />
      <span>正在加载Markdown编辑器...</span>
    </div>

    <!-- 加载失败状态 -->
    <div v-else-if="loadError" class="editor-error">
      <div class="error-icon">⚠️</div>
      <span>{{ loadError }}</span>
      <button class="retry-btn" @click="reloadPage">重新加载</button>
    </div>

    <!-- 动态渲染的编辑器 -->
    <component
      :is="MdEditorComponent"
      v-else-if="MdEditorComponent"
      ref="editorRef"
      style="height: 100%; max-height: 100%"
      :model-value="modelValue"
      :theme="theme"
      :toolbars="toolbars"
      :showCodeRowNumber="true"
      :sanitize="sanitize"
      :auto-fold-threshold="99999999"
      :showToolbarName="true"
      @update:model-value="val => emit('update:modelValue', val)"
      @onUploadImg="onUploadImg"
      @onSave="handleSave"
    />
  </div>
</template>

<style scoped lang="scss">
.md-editor-container {
  height: 100%;
}

.editor-loading,
.editor-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--anzhiyu-fontcolor);
  text-align: center;
  gap: 16px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--anzhiyu-gray-op);
  border-top: 3px solid var(--anzhiyu-main);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-icon {
  font-size: 32px;
}

.retry-btn {
  padding: 8px 16px;
  background: var(--anzhiyu-main);
  color: var(--anzhiyu-white);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: var(--anzhiyu-main-op-deep);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
