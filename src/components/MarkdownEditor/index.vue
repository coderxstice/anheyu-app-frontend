<!--
 * @Description: Markdown编辑器组件（重构版）
 * @Author: 安知鱼
 * @Date: 2025-12-27
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useMusicPlayer } from "./composables/useMusicPlayer";
import { useContentProcessor } from "./composables/useContentProcessor";
import { initTipEvents } from "./plugins/markdown-it-tip-plugin";

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

// === Mermaid 渲染状态 ===
const mermaidRenderStatus = ref<{
  isRendering: boolean;
  total: number;
  rendered: number;
}>({
  isRendering: false,
  total: 0,
  rendered: 0
});

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

// === Mermaid 重渲染防抖定时器 ===
let mermaidRenderTimer: ReturnType<typeof setTimeout> | null = null;
// 当前正在渲染的批次（用于中断）
let currentRenderAborted = false;

// === Mermaid 分批渲染配置 ===
const MERMAID_BATCH_SIZE = 3; // 每批渲染的图表数量
const MERMAID_BATCH_DELAY = 50; // 批次之间的延迟（毫秒）

// === 分批渲染 Mermaid 图表（性能优化） ===
const renderMermaidInBatches = async (
  blocks: Element[],
  updateProgress = true
): Promise<void> => {
  const mermaid = (window as any).mermaid;
  if (!mermaid || blocks.length === 0) return;

  currentRenderAborted = false;
  const totalBlocks = blocks.length;
  let renderedCount = 0;

  // 更新渲染状态（仅在图表数量较多时显示）
  if (updateProgress && totalBlocks >= 3) {
    mermaidRenderStatus.value = {
      isRendering: true,
      total: mermaidRenderStatus.value.total + totalBlocks,
      rendered: mermaidRenderStatus.value.rendered
    };
  }

  console.log(
    `[Mermaid] 开始分批渲染 ${totalBlocks} 个图表，每批 ${MERMAID_BATCH_SIZE} 个`
  );

  // 按批次处理
  for (let i = 0; i < blocks.length; i += MERMAID_BATCH_SIZE) {
    // 检查是否被中断
    if (currentRenderAborted) {
      console.log(
        `[Mermaid] 渲染被中断，已完成 ${renderedCount}/${totalBlocks}`
      );
      if (updateProgress) {
        mermaidRenderStatus.value.isRendering = false;
      }
      return;
    }

    const batch = blocks.slice(i, i + MERMAID_BATCH_SIZE);

    try {
      // 渲染当前批次
      await Promise.all(
        batch.map(async block => {
          if (currentRenderAborted) return;
          try {
            // 为单个块生成唯一 ID 并渲染
            const id = `mermaid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            block.setAttribute("id", id);
            await mermaid.run({
              nodes: [block],
              suppressErrors: true
            });
            // 更新渲染进度
            if (updateProgress && totalBlocks >= 3) {
              mermaidRenderStatus.value.rendered++;
            }
          } catch (e) {
            console.warn("[Mermaid] 单个图表渲染失败:", e);
          }
        })
      );

      renderedCount += batch.length;

      // 批次间延迟，让出主线程
      if (i + MERMAID_BATCH_SIZE < blocks.length) {
        await new Promise(resolve => setTimeout(resolve, MERMAID_BATCH_DELAY));
      }
    } catch (error) {
      console.warn(`[Mermaid] 批次渲染出错:`, error);
    }
  }

  console.log(`[Mermaid] 分批渲染完成，共 ${renderedCount} 个图表`);

  // 完成渲染
  if (updateProgress && totalBlocks >= 3) {
    // 延迟隐藏状态，让用户看到完成
    setTimeout(() => {
      mermaidRenderStatus.value = {
        isRendering: false,
        total: 0,
        rendered: 0
      };
    }, 500);
  }
};

// === 检查并重新渲染未完成的 Mermaid 图表 ===
const checkAndRerenderMermaid = async () => {
  const previewContainer = containerRef.value?.querySelector(
    ".md-editor-preview-wrapper"
  );
  if (!previewContainer) return;

  // 中断之前的渲染任务
  currentRenderAborted = true;
  await new Promise(resolve => setTimeout(resolve, 10));

  // 查找所有未渲染的 mermaid 块（没有 SVG 或没有 data-processed 属性）
  const mermaidBlocks = Array.from(
    previewContainer.querySelectorAll(".md-editor-mermaid")
  );
  const unrenderedBlocks: Element[] = [];

  for (const block of mermaidBlocks) {
    const hasSvg = block.querySelector("svg");
    const isProcessed = block.hasAttribute("data-processed");
    if (!hasSvg || !isProcessed) {
      unrenderedBlocks.push(block);
    }
  }

  if (unrenderedBlocks.length === 0) return;

  const mermaid = (window as any).mermaid;
  if (!mermaid) {
    console.warn("[Mermaid] 全局 mermaid 对象不存在，跳过重渲染");
    return;
  }

  // 使用 IntersectionObserver 优先渲染可见区域的图表
  const visibleBlocks: Element[] = [];
  const hiddenBlocks: Element[] = [];

  unrenderedBlocks.forEach(block => {
    const rect = block.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight + 200 && rect.bottom > -200;
    if (isVisible) {
      visibleBlocks.push(block);
    } else {
      hiddenBlocks.push(block);
    }
  });

  console.log(
    `[Mermaid] 检测到 ${unrenderedBlocks.length} 个未渲染图表（可见: ${visibleBlocks.length}, 隐藏: ${hiddenBlocks.length}）`
  );

  // 先渲染可见区域的图表
  if (visibleBlocks.length > 0) {
    await renderMermaidInBatches(visibleBlocks);
  }

  // 然后渲染隐藏区域的图表
  if (hiddenBlocks.length > 0 && !currentRenderAborted) {
    await renderMermaidInBatches(hiddenBlocks);
  }
};

// === 处理HTML变化事件 ===
const handleHtmlChanged = () => {
  // 使用防抖机制检查并重渲染 mermaid 图表
  // 根据内容大小动态调整防抖时间
  if (mermaidRenderTimer) {
    clearTimeout(mermaidRenderTimer);
  }

  // 根据 modelValue 长度动态计算防抖时间
  // 大文章需要更长的防抖时间，避免频繁触发渲染
  const contentLength = props.modelValue?.length || 0;
  let debounceTime = 300; // 默认 300ms

  if (contentLength > 100000) {
    // 超过 10 万字，使用 800ms 防抖
    debounceTime = 800;
  } else if (contentLength > 50000) {
    // 超过 5 万字，使用 500ms 防抖
    debounceTime = 500;
  } else if (contentLength > 20000) {
    // 超过 2 万字，使用 400ms 防抖
    debounceTime = 400;
  }

  mermaidRenderTimer = setTimeout(() => {
    checkAndRerenderMermaid();
    // 初始化 tip 组件的事件监听器
    const previewContainer = containerRef.value?.querySelector(
      ".md-editor-preview-wrapper"
    );
    if (previewContainer) {
      initTipEvents(previewContainer as HTMLElement);
    }
  }, debounceTime);
};

// === 等待 Mermaid 渲染完成 ===
const waitForMermaidRender = async (
  checkIntervalMs: number = 100
): Promise<{ success: boolean; total: number; rendered: number }> => {
  const previewContainer = containerRef.value?.querySelector(
    ".md-editor-preview-wrapper"
  );
  if (!previewContainer) return { success: true, total: 0, rendered: 0 };

  // 找到所有 mermaid 块
  const mermaidBlocks = Array.from(
    previewContainer.querySelectorAll(".md-editor-mermaid")
  );

  if (mermaidBlocks.length === 0) {
    return { success: true, total: 0, rendered: 0 };
  }

  // 根据 Mermaid 数量动态计算最大等待时间
  // 基础 2 秒 + 每个图表额外 1 秒，最多 15 秒
  // 注意：这只是上限，一旦渲染完成会立即返回
  const maxWaitMs = Math.min(2000 + mermaidBlocks.length * 1000, 15000);
  const startTime = Date.now();

  console.log(
    `[保存文章] 检测到 ${mermaidBlocks.length} 个 Mermaid 图表，最大等待时间: ${maxWaitMs}ms`
  );

  while (Date.now() - startTime < maxWaitMs) {
    // 统计已渲染和未渲染的数量
    let renderedCount = 0;
    for (const block of mermaidBlocks) {
      const hasSvg = block.querySelector("svg");
      const isProcessed = block.hasAttribute("data-processed");
      if (hasSvg && isProcessed) {
        renderedCount++;
      }
    }

    // 检查是否全部完成
    if (renderedCount === mermaidBlocks.length) {
      console.log(
        `[保存文章] 所有 Mermaid 图表已渲染完成 (${mermaidBlocks.length} 个)，耗时: ${Date.now() - startTime}ms`
      );
      return {
        success: true,
        total: mermaidBlocks.length,
        rendered: renderedCount
      };
    }

    // 等待一段时间后再检查
    await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
  }

  // 超时，统计最终状态
  let finalRendered = 0;
  for (const block of mermaidBlocks) {
    const hasSvg = block.querySelector("svg");
    const isProcessed = block.hasAttribute("data-processed");
    if (hasSvg && isProcessed) {
      finalRendered++;
    }
  }

  console.warn(
    `[保存文章] Mermaid 渲染超时 (${maxWaitMs}ms)，已完成: ${finalRendered}/${mermaidBlocks.length}`
  );
  return {
    success: false,
    total: mermaidBlocks.length,
    rendered: finalRendered
  };
};

// 保存处理
const handleSave = async (markdown: string, htmlPromise: Promise<string>) => {
  console.log("[保存文章] 开始处理...");
  console.log("[保存文章] Markdown长度:", markdown.length);

  // 等待 Mermaid 渲染完成（动态等待时间）
  const renderResult = await waitForMermaidRender(100);

  if (!renderResult.success && renderResult.total > 0) {
    // 渲染超时，询问用户是否继续
    const unrenderedCount = renderResult.total - renderResult.rendered;
    const confirmMsg =
      `有 ${unrenderedCount} 个 Mermaid 图表尚未渲染完成。\n\n` +
      `继续保存可能导致这些图表在前台显示为源代码。\n\n` +
      `建议：点击"取消"后，等待所有图表渲染完成再保存。\n\n` +
      `是否仍要继续保存？`;

    if (!confirm(confirmMsg)) {
      console.log("[保存文章] 用户取消保存");
      return;
    }
  }

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

    // 初始化编辑器扩展（包含 mermaid 动态加载）
    await installMarkdownEditorExtensions();

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
  // 清理 Mermaid 渲染相关
  if (mermaidRenderTimer) {
    clearTimeout(mermaidRenderTimer);
    mermaidRenderTimer = null;
  }
  currentRenderAborted = true; // 中断正在进行的渲染
  mermaidRenderStatus.value = { isRendering: false, total: 0, rendered: 0 };

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
    <template v-else-if="MdEditorComponent">
      <component
        :is="MdEditorComponent"
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
        @onHtmlChanged="handleHtmlChanged"
      />
      <!-- Mermaid 渲染进度提示 -->
      <Transition name="fade">
        <div
          v-if="
            mermaidRenderStatus.isRendering && mermaidRenderStatus.total > 0
          "
          class="mermaid-render-status"
        >
          <div class="mermaid-render-progress">
            <div class="loading-spinner small" />
            <span>
              正在渲染图表 {{ mermaidRenderStatus.rendered }}/{{
                mermaidRenderStatus.total
              }}
            </span>
          </div>
        </div>
      </Transition>
    </template>
  </div>
</template>

<style scoped lang="scss">
.md-editor-container {
  height: 100%;
  position: relative;
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

  &.small {
    width: 16px;
    height: 16px;
    border-width: 2px;
  }
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

// Mermaid 渲染进度提示
.mermaid-render-status {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 100;
}

.mermaid-render-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--anzhiyu-card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  font-size: 13px;
  color: var(--anzhiyu-fontcolor);
}

// 过渡动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
