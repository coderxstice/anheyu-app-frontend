<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useSnackbar } from "@/composables/useSnackbar";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { useLazyLoading } from "@/composables/useLazyLoading";
import {
  initAllMusicPlayers,
  registerGlobalMusicFunctions,
  unregisterGlobalMusicFunctions
} from "./music-player-global";
import "katex/dist/katex.min.css";

interface ArticleInfo {
  isReprint: boolean; // 是否为转载文章
  copyrightAuthor?: string; // 原作者
  copyrightUrl?: string; // 原文链接
}

// Fancybox 懒加载，避免影响首屏性能
let Fancybox: any = null;

const props = defineProps({
  content: {
    type: String,
    default: "PostContent"
  }
});

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
  () => siteConfigStore.getSiteConfig?.code_block?.code_max_lines || 10
);

const postContentRef = ref<HTMLElement | null>(null);

const collapsedHeight = computed(() => {
  const lines = codeMaxLines.value > 0 ? codeMaxLines.value : 10;
  const height = lines * 25 + 50;
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
  // 所有交互逻辑已经通过 onclick 内联事件处理器实现
  // 如果未来需要添加额外的全局处理逻辑，可以在这里扩展
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
  // 清理懒加载资源
  cleanup();
  // 清理全局函数
  delete (window as any).__markdownEditorCopyHandler;
});

// 监听内容变化，重新初始化懒加载
watch(
  () => props.content,
  () => {
    if (postContentRef.value) {
      // 等待 DOM 更新完成后重新初始化懒加载
      setTimeout(() => {
        if (postContentRef.value) {
          reinitialize(postContentRef.value);
          // 重新初始化音乐播放器
          initAllMusicPlayers(postContentRef.value);
          // 重新绑定 Fancybox
          if (Fancybox) {
            Fancybox.unbind(postContentRef.value);
            Fancybox.bind(postContentRef.value, "img:not(a img)", {
              groupAll: true
            });
          }
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
