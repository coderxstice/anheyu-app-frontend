<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from "vue";
import { useSnackbar } from "@/composables/useSnackbar";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { useLazyLoading } from "@/composables/useLazyLoading";
import {
  initAllMusicPlayers,
  registerGlobalMusicFunctions,
  unregisterGlobalMusicFunctions
} from "./music-player-global";
import "katex/dist/katex.min.css";

// Mermaid 缩放功能的清理函数
let mermaidCleanup: (() => void) | null = null;

// Mermaid 虚拟渲染（进入视口再注入 SVG）
let mermaidVirtualObserver: IntersectionObserver | null = null;

/**
 * 初始化 Mermaid 图表的缩放功能
 * 模拟 md-editor-v3 的行为，动态添加 action 按钮
 */
const initMermaidZoom = (container: HTMLElement) => {
  const mermaidContainers = container.matches(".md-editor-mermaid")
    ? [container]
    : Array.from(container.querySelectorAll(".md-editor-mermaid"));
  if (mermaidContainers.length === 0) return;

  const removeEventsMap = new Map<
    Element,
    { removeEvent?: () => void; removeClick?: () => void }
  >();

  // Pin 图标 SVG
  const pinOffIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pin-off"><path d="M12 17v5"></path><path d="M15 9.34V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H7.89"></path><path d="m2 2 20 20"></path><path d="M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h11"></path></svg>`;
  const pinIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pin"><path d="M12 17v5"></path><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"></path></svg>`;

  // 添加缩放/平移事件
  const addZoomEvent = (mm: Element) => {
    const el = mm as HTMLElement;
    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    const updateTransform = () => {
      const svg = el.querySelector("svg");
      if (svg) {
        (svg as unknown as HTMLElement).style.transform =
          `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        (svg as unknown as HTMLElement).style.transformOrigin = "center center";
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      scale = Math.max(0.5, Math.min(3, scale + delta));
      updateTransform();
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      isDragging = true;
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
      el.style.cursor = "grabbing";
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      translateX = e.clientX - startX;
      translateY = e.clientY - startY;
      updateTransform();
    };

    const onMouseUp = () => {
      isDragging = false;
      el.style.cursor = "grab";
    };

    const onMouseLeave = () => {
      isDragging = false;
      el.style.cursor = "grab";
    };

    // 触摸事件支持
    let lastTouchDistance = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        lastTouchDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      } else if (e.touches.length === 1) {
        isDragging = true;
        startX = e.touches[0].clientX - translateX;
        startY = e.touches[0].clientY - translateY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 2) {
        const distance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const delta = (distance - lastTouchDistance) * 0.01;
        scale = Math.max(0.5, Math.min(3, scale + delta));
        lastTouchDistance = distance;
        updateTransform();
      } else if (isDragging && e.touches.length === 1) {
        translateX = e.touches[0].clientX - startX;
        translateY = e.touches[0].clientY - startY;
        updateTransform();
      }
    };

    const onTouchEnd = () => {
      isDragging = false;
      lastTouchDistance = 0;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("mousedown", onMouseDown);
    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseup", onMouseUp);
    el.addEventListener("mouseleave", onMouseLeave);
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);

    el.style.cursor = "grab";
    el.style.overflow = "hidden";

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("mouseleave", onMouseLeave);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);

      // 重置变换
      const svg = el.querySelector("svg");
      if (svg) {
        (svg as unknown as HTMLElement).style.transform = "";
      }
      el.style.cursor = "";
      el.removeAttribute("data-grab");
    };
  };

  mermaidContainers.forEach(mm => {
    // 检查是否已有 action div
    let actionDiv = mm.querySelector(".md-editor-mermaid-action");
    if (!actionDiv) {
      // 创建 action div
      const div = document.createElement("div");
      div.className = "md-editor-mermaid-action";
      div.innerHTML = pinOffIcon;
      mm.appendChild(div);
      actionDiv = div;
    }

    const onClick = () => {
      const current = removeEventsMap.get(mm);
      if (current?.removeEvent) {
        // 已启用缩放，点击后禁用
        current.removeEvent();
        mm.removeAttribute("data-grab");
        removeEventsMap.set(mm, { removeClick: current.removeClick });
        actionDiv!.innerHTML = pinOffIcon;
      } else {
        // 未启用缩放，点击后启用
        const removeEvent = addZoomEvent(mm);
        mm.setAttribute("data-grab", "");
        removeEventsMap.set(mm, {
          removeEvent,
          removeClick: current?.removeClick
        });
        actionDiv!.innerHTML = pinIcon;
      }
    };

    (actionDiv as HTMLElement).addEventListener("click", onClick);
    removeEventsMap.set(mm, {
      removeClick: () =>
        (actionDiv as HTMLElement).removeEventListener("click", onClick)
    });
  });

  // 返回清理函数
  return () => {
    removeEventsMap.forEach(({ removeEvent, removeClick }) => {
      removeEvent?.();
      removeClick?.();
    });
    removeEventsMap.clear();
  };
};

const props = defineProps({
  content: {
    type: String,
    default: "PostContent"
  },
  // Mermaid 虚拟渲染：原始 HTML（包含 SVG），用于按需 slice 注入
  rawContent: {
    type: String,
    default: ""
  },
  // Mermaid 虚拟渲染：id -> slice 索引
  mermaidBlocks: {
    type: Object as () => Record<string, { start: number; end: number }>,
    default: () => ({})
  }
});

interface ArticleInfo {
  isReprint: boolean; // 是否为转载文章
  copyrightAuthor?: string; // 原作者
  copyrightUrl?: string; // 原文链接
}

// Fancybox 懒加载，避免影响首屏性能
let Fancybox: any = null;

const setupVirtualMermaid = (container: HTMLElement) => {
  // 清理旧 observer
  if (mermaidVirtualObserver) {
    mermaidVirtualObserver.disconnect();
    mermaidVirtualObserver = null;
  }

  if (!props.rawContent || !props.mermaidBlocks) return;
  const blockIds = Object.keys(props.mermaidBlocks);
  if (blockIds.length === 0) return;

  // 找到所有占位符
  const placeholders = container.querySelectorAll<HTMLElement>(
    '.md-editor-mermaid[data-mermaid-virtual="1"][data-mermaid-vid]'
  );
  if (placeholders.length === 0) return;

  mermaidVirtualObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        const id = el.getAttribute("data-mermaid-vid") || "";
        const meta = props.mermaidBlocks?.[id];
        if (!meta) {
          mermaidVirtualObserver?.unobserve(el);
          return;
        }

        // 注入原始 mermaid 块 HTML（包含 SVG）
        const blockHtml = props.rawContent.slice(meta.start, meta.end);
        try {
          const range = document.createRange();
          range.selectNode(el);
          const frag = range.createContextualFragment(blockHtml);
          const newNode = frag.firstElementChild as HTMLElement | null;
          if (newNode) {
            el.replaceWith(newNode);
            // 为新注入的 mermaid 块补齐缩放 action
            const cleanupFn = initMermaidZoom(newNode);
            if (cleanupFn) {
              // 合并到全局清理
              const prevCleanup = mermaidCleanup;
              mermaidCleanup = () => {
                prevCleanup?.();
                cleanupFn();
              };
            }
          } else {
            // fallback: 清空占位符，避免重复触发
            el.innerHTML = "";
          }
        } catch (e) {
          console.error("[MermaidVirtual] 注入失败:", e);
        } finally {
          mermaidVirtualObserver?.unobserve(el);
        }
      });
    },
    { rootMargin: "800px 0px", threshold: 0.01 }
  );

  placeholders.forEach(el => mermaidVirtualObserver?.observe(el));
};

const { showSnackbar } = useSnackbar();
const siteConfigStore = useSiteConfigStore();

// 当前文章信息（从全局事件获取）
const currentArticleInfo = ref<ArticleInfo | null>(null);

// 是否允许复制
const copyEnabled = computed(() => {
  return siteConfigStore.getSiteConfig?.post?.copy?.enable !== false;
});

// 是否携带版权信息
const copyrightEnabled = computed(() => {
  // 兼容两种格式：驼峰和下划线
  const copyConfig = siteConfigStore.getSiteConfig?.post?.copy;
  const enabled =
    copyConfig?.copyrightEnable === true ||
    copyConfig?.copyright_enable === true ||
    copyConfig?.["copyright_enable"] === true;
  console.log("[PostContent] 版权信息配置:", {
    copyrightEnable: copyConfig?.copyrightEnable,
    copyright_enable: copyConfig?.copyright_enable,
    enabled,
    fullConfig: copyConfig
  });
  return enabled;
});

// 获取站点名称
const siteName = computed(() => {
  return siteConfigStore.getSiteConfig?.APP_NAME || "本站";
});

// 获取站长名称
const siteOwnerName = computed(() => {
  return siteConfigStore.getSiteConfig?.frontDesk?.siteOwner?.name || "博主";
});

// 原创文章版权模板
const copyrightOriginalTemplate = computed(() => {
  const copyConfig = siteConfigStore.getSiteConfig?.post?.copy;
  return (
    copyConfig?.copyrightOriginal ||
    copyConfig?.copyright_original ||
    copyConfig?.["copyright_original"] ||
    "本文来自 {siteName}，作者 {author}，转载请注明出处。\n原文地址：{url}"
  );
});

// 转载文章版权模板
const copyrightReprintTemplate = computed(() => {
  const copyConfig = siteConfigStore.getSiteConfig?.post?.copy;
  return (
    copyConfig?.copyrightReprint ||
    copyConfig?.copyright_reprint ||
    copyConfig?.["copyright_reprint"] ||
    "本文转载自 {originalAuthor}，原文地址：{originalUrl}\n当前页面：{currentUrl}"
  );
});

// 初始化懒加载
const { initLazyLoading, reinitialize, cleanup } = useLazyLoading({
  rootMargin: "100px",
  threshold: 0.1,
  showLoading: true
});

const codeMaxLines = computed(
  () => siteConfigStore.getSiteConfig?.post?.code_block?.code_max_lines || 10
);

const postContentRef = ref<HTMLElement | null>(null);

const collapsedHeight = computed(() => {
  const lines = codeMaxLines.value > 0 ? codeMaxLines.value : 10;
  // 每行高度约 26px (font-size 1rem * line-height 1.6)，加上 padding 20px
  const height = lines * 26 + 20;
  return `${height}px`;
});

/**
 * 生成版权信息文本
 */
const generateCopyrightText = (): string => {
  const currentUrl = window.location.href;
  const articleInfo = currentArticleInfo.value;

  if (articleInfo?.isReprint) {
    // 转载文章的版权信息
    const author = articleInfo.copyrightAuthor || "原作者";
    const originalUrl = articleInfo.copyrightUrl || "";

    return (
      "\n\n---\n" +
      copyrightReprintTemplate.value
        .replace("{originalAuthor}", author)
        .replace("{originalUrl}", originalUrl)
        .replace("{currentUrl}", currentUrl)
    );
  } else {
    // 原创文章的版权信息
    return (
      "\n\n---\n" +
      copyrightOriginalTemplate.value
        .replace("{siteName}", siteName.value)
        .replace("{author}", siteOwnerName.value)
        .replace("{url}", currentUrl)
    );
  }
};

/**
 * 检查目标元素是否在文章内容区域
 */
const isInArticleContent = (target: HTMLElement): boolean => {
  return !!(
    target.closest(".post-content") || target.closest(".post-detail-content")
  );
};

// 全局复制处理函数 - 用于已发布文章中的代码复制
const handleCodeCopy = (codeElement: HTMLElement) => {
  if (codeElement) {
    navigator.clipboard
      .writeText(codeElement.textContent || "")
      .then(() => {
        showSnackbar("复制成功，复制和转载请标注本文地址");
      })
      .catch(() => {
        showSnackbar("复制失败，请手动复制");
      });
  }
};

/**
 * 处理文本复制事件（Ctrl+C 或右键复制）
 */
const handleTextCopy = (event: ClipboardEvent) => {
  console.log("[PostContent] 复制事件触发");

  // 如果禁止复制
  if (!copyEnabled.value) {
    console.log("[PostContent] 复制已禁用");
    event.preventDefault();
    return;
  }

  console.log(
    "[PostContent] 复制已启用，版权信息启用:",
    copyrightEnabled.value
  );

  // 如果需要携带版权信息
  if (copyrightEnabled.value && event.clipboardData) {
    const selection = window.getSelection();
    console.log("[PostContent] 选择的文本:", selection?.toString());

    if (selection && selection.toString().length > 0) {
      // 检查选择的文本是否在文章内容区域内
      const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      console.log("[PostContent] 选择范围:", range);

      if (range) {
        const container = range.commonAncestorContainer;
        const target =
          container.nodeType === Node.TEXT_NODE
            ? container.parentElement
            : (container as HTMLElement);

        console.log("[PostContent] 目标元素:", target);
        const isInContent = target && isInArticleContent(target);
        console.log("[PostContent] 是否在文章内容区域:", isInContent);

        if (isInContent) {
          const originalText = selection.toString();
          const copyrightText = generateCopyrightText();
          const textWithCopyright = originalText + copyrightText;

          console.log("[PostContent] 原始文本长度:", originalText.length);
          console.log("[PostContent] 版权信息:", copyrightText);
          console.log("[PostContent] 完整文本长度:", textWithCopyright.length);

          event.clipboardData.setData("text/plain", textWithCopyright);
          event.preventDefault();

          // 显示复制成功提示
          showSnackbar("复制成功，复制和转载请标注本文地址");
          console.log("[PostContent] 已添加版权信息并显示提示");
        } else {
          console.log(
            "[PostContent] 选择的文本不在文章内容区域内，不添加版权信息"
          );
        }
      } else {
        console.log("[PostContent] 无法获取选择范围");
      }
    } else {
      console.log("[PostContent] 没有选择的文本");
    }
  } else {
    console.log("[PostContent] 版权信息未启用或没有剪贴板数据");
  }
};

/**
 * 处理文章信息更新事件
 */
const handleArticleInfoUpdate = (event: CustomEvent<ArticleInfo>) => {
  currentArticleInfo.value = event.detail;
  console.log("[PostContent] 文章信息已更新:", event.detail);
};

// 文章内容点击事件处理 - 现在大部分逻辑已内置到 HTML 中
// 这里保留是为了未来可能需要的额外处理
const handleContentClick = (event: Event) => {
  const target = event.target as HTMLElement;

  // ========== Tip插件点击事件处理（v-html不执行内联事件） ==========
  const tipWrapper = target.closest(".anzhiyu-tip-wrapper") as HTMLElement;
  if (tipWrapper) {
    const tipElement = tipWrapper.querySelector(".anzhiyu-tip") as HTMLElement;
    if (
      (tipElement && tipWrapper.classList.contains("tip-click")) ||
      tipElement?.getAttribute("data-trigger") === "click"
    ) {
      event.preventDefault();
      event.stopPropagation();
      // 切换tip的显示/隐藏状态
      if (tipElement.style.visibility === "visible") {
        tipElement.style.visibility = "hidden";
        tipElement.style.opacity = "0";
      } else {
        tipElement.style.visibility = "visible";
        tipElement.style.opacity = "1";
      }
    }
    return;
  }
};

// ========== Tip插件hover事件委托处理 ==========
// 由于v-html不执行内联事件处理器（onmouseenter/onmouseleave），需要通过事件委托实现
let tipCleanupFns: (() => void)[] = [];

const initTipHoverEvents = (container: HTMLElement) => {
  // 清理之前的事件监听
  tipCleanupFns.forEach(fn => fn());
  tipCleanupFns = [];

  // 查找所有tip wrapper元素
  const tipWrappers = container.querySelectorAll(".anzhiyu-tip-wrapper");

  tipWrappers.forEach(wrapper => {
    const wrapperEl = wrapper as HTMLElement;
    const tipElement = wrapperEl.querySelector(".anzhiyu-tip") as HTMLElement;
    if (!tipElement) return;

    // 检查触发方式，只为hover触发的tip添加事件
    const trigger = tipElement.getAttribute("data-trigger");
    if (trigger === "click") return; // click触发的tip由handleContentClick处理

    // 获取延迟时间（毫秒），默认无延迟
    const delay = parseInt(tipElement.getAttribute("data-delay") || "0", 10);

    // 存储定时器
    let showTimer: ReturnType<typeof setTimeout> | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const showTip = () => {
      // 清除隐藏定时器
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      // 设置延迟显示
      showTimer = setTimeout(() => {
        tipElement.style.visibility = "visible";
        tipElement.style.opacity = "1";
        tipElement.dataset.visible = "true";
      }, delay);
    };

    const hideTip = () => {
      // 清除显示定时器
      if (showTimer) {
        clearTimeout(showTimer);
        showTimer = null;
      }
      // 设置延迟隐藏（100ms）
      hideTimer = setTimeout(() => {
        tipElement.style.visibility = "hidden";
        tipElement.style.opacity = "0";
        tipElement.dataset.visible = "false";
      }, 100);
    };

    wrapperEl.addEventListener("mouseenter", showTip);
    wrapperEl.addEventListener("mouseleave", hideTip);

    // 添加清理函数
    tipCleanupFns.push(() => {
      if (showTimer) clearTimeout(showTimer);
      if (hideTimer) clearTimeout(hideTimer);
      wrapperEl.removeEventListener("mouseenter", showTip);
      wrapperEl.removeEventListener("mouseleave", hideTip);
    });
  });
};

const cleanupTipHoverEvents = () => {
  tipCleanupFns.forEach(fn => fn());
  tipCleanupFns = [];
};

onMounted(async () => {
  // 注册全局音乐播放器函数
  registerGlobalMusicFunctions();

  // 将复制处理函数暴露到全局作用域，供已发布文章中的内联事件使用
  (window as any).__markdownEditorCopyHandler = handleCodeCopy;

  // 监听复制事件
  document.addEventListener("copy", handleTextCopy as EventListener);

  // 监听文章信息更新事件
  window.addEventListener(
    "article-info-update",
    handleArticleInfoUpdate as EventListener
  );

  if (postContentRef.value) {
    postContentRef.value.addEventListener("click", handleContentClick);

    // 初始化懒加载
    initLazyLoading(postContentRef.value);

    // 初始化音乐播放器（仅绑定audio事件，点击事件由HTML的onclick处理）
    initAllMusicPlayers(postContentRef.value);

    // 初始化 Mermaid 缩放功能
    mermaidCleanup = initMermaidZoom(postContentRef.value);

    // 初始化 Mermaid 虚拟渲染（进入视口再注入 SVG）
    setupVirtualMermaid(postContentRef.value);

    // 懒加载 Fancybox
    if (!Fancybox) {
      const fancyboxModule = await import("@fancyapps/ui");
      await import("@fancyapps/ui/dist/fancybox/fancybox.css");
      Fancybox = fancyboxModule.Fancybox;
    }

    Fancybox.bind(postContentRef.value, "img:not(a img)", {
      groupAll: true
    });
  }

  // 初始化Tip插件的hover事件委托（v-html不执行内联事件处理器）
  // 必须在nextTick之后，确保v-html内容已渲染到DOM
  await nextTick();
  if (postContentRef.value) {
    initTipHoverEvents(postContentRef.value);
  }
});

onUnmounted(() => {
  // 清理全局音乐播放器函数
  unregisterGlobalMusicFunctions();

  // 移除复制事件监听
  document.removeEventListener("copy", handleTextCopy as EventListener);
  window.removeEventListener(
    "article-info-update",
    handleArticleInfoUpdate as EventListener
  );

  if (postContentRef.value) {
    postContentRef.value.removeEventListener("click", handleContentClick);
    if (Fancybox) {
      Fancybox.unbind(postContentRef.value);
      Fancybox.close(true);
    }
  }
  // 清理 Mermaid 缩放功能
  if (mermaidCleanup) {
    mermaidCleanup();
    mermaidCleanup = null;
  }
  // 清理 Mermaid 虚拟渲染 observer
  if (mermaidVirtualObserver) {
    mermaidVirtualObserver.disconnect();
    mermaidVirtualObserver = null;
  }
  // 清理懒加载资源
  cleanup();
  // 清理Tip插件hover事件
  cleanupTipHoverEvents();
  // 清理全局函数
  delete (window as any).__markdownEditorCopyHandler;
});

// 监听内容变化，重新初始化懒加载
watch(
  () => props.content,
  () => {
    if (postContentRef.value) {
      // 等待 DOM 更新完成后重新初始化懒加载
      setTimeout(async () => {
        if (postContentRef.value) {
          reinitialize(postContentRef.value);
          // 重新初始化音乐播放器
          initAllMusicPlayers(postContentRef.value);
          // 重新初始化 Mermaid 缩放功能
          if (mermaidCleanup) {
            mermaidCleanup();
          }
          mermaidCleanup = initMermaidZoom(postContentRef.value);
          // 重新初始化 Mermaid 虚拟渲染
          await nextTick();
          setupVirtualMermaid(postContentRef.value);
          // 重新绑定 Fancybox
          if (Fancybox) {
            Fancybox.unbind(postContentRef.value);
            Fancybox.bind(postContentRef.value, "img:not(a img)", {
              groupAll: true
            });
          }
          // 重新初始化Tip插件hover事件
          initTipHoverEvents(postContentRef.value);
        }
      }, 100);
    }
  }
);
</script>

<template>
  <article
    id="article-container"
    ref="postContentRef"
    class="post-content"
    v-html="content"
  />
</template>

<style lang="scss">
// 使用公共的文章内容样式（包含懒加载等前台特有样式）
@use "@/style/post-content.scss";
@use "./editor-code.scss";

// PostContent 组件特有的样式覆盖
// 大部分样式已经通过 @use 导入
// 这里只保留组件级别的特殊处理（如果需要的话）
</style>
