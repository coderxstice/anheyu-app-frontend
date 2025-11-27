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
   * 处理复制事件
   */
  const handleCopy = (event: ClipboardEvent) => {
    // 检查是否在文章页面
    const isPostPage = route.name === "PostDetail";

    // 如果不是文章页面，不处理
    if (!isPostPage) return;

    // 如果禁止复制
    if (!copyEnabled.value) {
      event.preventDefault();
      return;
    }

    // 如果需要携带版权信息
    if (copyrightEnabled.value && event.clipboardData) {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) {
        const originalText = selection.toString();
        const copyrightText = generateCopyrightText();
        const textWithCopyright = originalText + copyrightText;

        event.clipboardData.setData("text/plain", textWithCopyright);
        event.preventDefault();
      }
    }
  };

  /**
   * 处理文章信息更新事件
   */
  const handleArticleInfoUpdate = (event: CustomEvent<ArticleInfo>) => {
    currentArticleInfo.value = event.detail;
  };

  /**
   * 处理选择事件（用于禁止复制时阻止选择）
   */
  const handleSelectStart = (event: Event) => {
    // 检查是否在文章页面
    const isPostPage = route.name === "PostDetail";

    // 如果不是文章页面，不处理
    if (!isPostPage) return;

    // 如果禁止复制，阻止选择
    if (!copyEnabled.value) {
      const target = event.target as HTMLElement;
      // 只在文章内容区域阻止选择
      if (
        target.closest(".post-content") ||
        target.closest(".post-detail-content")
      ) {
        event.preventDefault();
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

    // 如果禁止复制，添加选择阻止
    if (!copyEnabled.value) {
      document.addEventListener("selectstart", handleSelectStart);
    }
  });

  // 监听复制配置变化
  watch(copyEnabled, newValue => {
    if (!newValue) {
      document.addEventListener("selectstart", handleSelectStart);
    } else {
      document.removeEventListener("selectstart", handleSelectStart);
    }
  });

  onUnmounted(() => {
    document.removeEventListener("copy", handleCopy as EventListener);
    window.removeEventListener(
      "article-info-update",
      handleArticleInfoUpdate as EventListener
    );
    document.removeEventListener("selectstart", handleSelectStart);
  });

  return {
    copyEnabled,
    copyrightEnabled,
    currentArticleInfo,
    generateCopyrightText
  };
}
