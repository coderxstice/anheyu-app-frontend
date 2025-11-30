/*
 * @Description: 文章复制保护功能 composable
 * @Author: 安知鱼
 * @Date: 2025-11-27
 */
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { useRoute } from "vue-router";

interface ArticleInfo {
  isReprint: boolean; // 是否为转载文章
  copyrightAuthor?: string; // 原作者
  copyrightUrl?: string; // 原文链接
}

/**
 * 文章复制保护功能
 * 支持禁止复制和复制携带版权信息功能
 */
export function useCopyProtection() {
  const siteConfigStore = useSiteConfigStore();
  const route = useRoute();

  // 当前文章信息（从全局事件获取）
  const currentArticleInfo = ref<ArticleInfo | null>(null);

  // 是否允许复制
  const copyEnabled = computed(() => {
    return siteConfigStore.getSiteConfig?.post?.copy?.enable !== false;
  });

  // 是否携带版权信息
  const copyrightEnabled = computed(() => {
    return siteConfigStore.getSiteConfig?.post?.copy?.copyrightEnable === true;
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
    return (
      siteConfigStore.getSiteConfig?.post?.copy?.copyrightOriginal ||
      "本文来自 {siteName}，作者 {author}，转载请注明出处。\n原文地址：{url}"
    );
  });

  // 转载文章版权模板
  const copyrightReprintTemplate = computed(() => {
    return (
      siteConfigStore.getSiteConfig?.post?.copy?.copyrightReprint ||
      "本文转载自 {originalAuthor}，原文地址：{originalUrl}\n当前页面：{currentUrl}"
    );
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
   * 处理复制事件（仅用于禁止复制，版权信息处理已移至 PostContent 组件）
   */
  const handleCopy = (event: ClipboardEvent) => {
    // 检查是否在文章页面
    const isPostPage = route.name === "PostDetail";

    // 如果不是文章页面，不处理
    if (!isPostPage) return;

    // 如果禁止复制，阻止复制
    if (!copyEnabled.value) {
      event.preventDefault();
      return;
    }

    // 版权信息处理已移至 PostContent 组件，这里不再处理
  };

  /**
   * 处理文章信息更新事件
   */
  const handleArticleInfoUpdate = (event: CustomEvent<ArticleInfo>) => {
    currentArticleInfo.value = event.detail;
  };

  /**
   * 检查目标元素是否在文章内容区域
   */
  const isInArticleContent = (target: HTMLElement): boolean => {
    return !!(
      target.closest(".post-content") || target.closest(".post-detail-content")
    );
  };

  /**
   * 处理选择开始事件（用于禁止复制时阻止选择）
   */
  const handleSelectStart = (event: Event) => {
    // 检查是否在文章页面
    const isPostPage = route.name === "PostDetail";
    if (!isPostPage) return;

    // 如果禁止复制，阻止选择
    if (!copyEnabled.value) {
      const target = event.target as HTMLElement;
      if (isInArticleContent(target)) {
        event.preventDefault();
      }
    }
  };

  /**
   * 处理选择变化事件（清除已选择的文本）
   */
  const handleSelectionChange = () => {
    // 检查是否在文章页面
    const isPostPage = route.name === "PostDetail";
    if (!isPostPage) return;

    // 如果禁止复制，清除选择
    if (!copyEnabled.value) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const target =
          container.nodeType === Node.TEXT_NODE
            ? container.parentElement
            : (container as HTMLElement);

        if (target && isInArticleContent(target)) {
          selection.removeAllRanges();
        }
      }
    }
  };

  /**
   * 处理右键菜单事件（禁止右键菜单）
   */
  const handleContextMenu = (event: MouseEvent) => {
    // 检查是否在文章页面
    const isPostPage = route.name === "PostDetail";
    if (!isPostPage) return;

    // 如果禁止复制，阻止右键菜单
    if (!copyEnabled.value) {
      const target = event.target as HTMLElement;
      if (isInArticleContent(target)) {
        event.preventDefault();
        return false;
      }
    }
  };

  /**
   * 处理键盘事件（禁止复制快捷键）
   */
  const handleKeyDown = (event: KeyboardEvent) => {
    // 检查是否在文章页面
    const isPostPage = route.name === "PostDetail";
    if (!isPostPage) return;

    // 如果禁止复制，阻止复制相关的快捷键
    if (!copyEnabled.value) {
      const target = event.target as HTMLElement;
      if (isInArticleContent(target)) {
        // 阻止 Ctrl+C, Ctrl+A, Ctrl+V, Ctrl+X, Ctrl+S 等快捷键
        if (
          (event.ctrlKey || event.metaKey) &&
          (event.key === "c" ||
            event.key === "C" ||
            event.key === "a" ||
            event.key === "A" ||
            event.key === "v" ||
            event.key === "V" ||
            event.key === "x" ||
            event.key === "X" ||
            event.key === "s" ||
            event.key === "S")
        ) {
          event.preventDefault();
          return false;
        }
        // 阻止 F12 开发者工具（可选，但可能影响用户体验）
        // if (event.key === "F12") {
        //   event.preventDefault();
        //   return false;
        // }
      }
    }
  };

  /**
   * 处理鼠标按下事件（阻止拖拽选择）
   */
  const handleMouseDown = (event: MouseEvent) => {
    // 检查是否在文章页面
    const isPostPage = route.name === "PostDetail";
    if (!isPostPage) return;

    // 如果禁止复制，阻止鼠标选择
    if (!copyEnabled.value) {
      const target = event.target as HTMLElement;
      if (isInArticleContent(target)) {
        // 阻止鼠标拖拽选择
        if (event.button === 0) {
          // 左键
          event.preventDefault();
        }
      }
    }
  };

  /**
   * 应用或移除 CSS 样式来禁止选择
   */
  const applyCopyProtectionStyles = (enable: boolean) => {
    const styleId = "copy-protection-style";
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!enable) {
      // 禁止复制时，添加样式
      if (!styleElement) {
        styleElement = document.createElement("style");
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = `
        .post-content,
        .post-detail-content {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
          -webkit-tap-highlight-color: transparent !important;
        }
      `;
    } else {
      // 允许复制时，移除样式
      if (styleElement) {
        styleElement.remove();
      }
    }
  };

  onMounted(() => {
    // 监听复制事件
    document.addEventListener("copy", handleCopy as EventListener);

    // 监听文章信息更新事件
    window.addEventListener(
      "article-info-update",
      handleArticleInfoUpdate as EventListener
    );

    // 如果禁止复制，添加各种保护措施
    if (!copyEnabled.value) {
      document.addEventListener("selectstart", handleSelectStart);
      document.addEventListener("selectionchange", handleSelectionChange);
      document.addEventListener(
        "contextmenu",
        handleContextMenu as EventListener
      );
      document.addEventListener("keydown", handleKeyDown as EventListener);
      document.addEventListener("mousedown", handleMouseDown as EventListener);
      applyCopyProtectionStyles(false);
    }
  });

  // 监听复制配置变化
  watch(copyEnabled, newValue => {
    if (!newValue) {
      // 禁止复制时，添加所有保护措施
      document.addEventListener("selectstart", handleSelectStart);
      document.addEventListener("selectionchange", handleSelectionChange);
      document.addEventListener(
        "contextmenu",
        handleContextMenu as EventListener
      );
      document.addEventListener("keydown", handleKeyDown as EventListener);
      document.addEventListener("mousedown", handleMouseDown as EventListener);
      applyCopyProtectionStyles(false);
    } else {
      // 允许复制时，移除所有保护措施
      document.removeEventListener("selectstart", handleSelectStart);
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.removeEventListener(
        "contextmenu",
        handleContextMenu as EventListener
      );
      document.removeEventListener("keydown", handleKeyDown as EventListener);
      document.removeEventListener(
        "mousedown",
        handleMouseDown as EventListener
      );
      applyCopyProtectionStyles(true);
    }
  });

  onUnmounted(() => {
    document.removeEventListener("copy", handleCopy as EventListener);
    window.removeEventListener(
      "article-info-update",
      handleArticleInfoUpdate as EventListener
    );
    document.removeEventListener("selectstart", handleSelectStart);
    document.removeEventListener("selectionchange", handleSelectionChange);
    document.removeEventListener(
      "contextmenu",
      handleContextMenu as EventListener
    );
    document.removeEventListener("keydown", handleKeyDown as EventListener);
    document.removeEventListener("mousedown", handleMouseDown as EventListener);
    applyCopyProtectionStyles(true);
  });

  return {
    copyEnabled,
    copyrightEnabled,
    currentArticleInfo,
    generateCopyrightText
  };
}
