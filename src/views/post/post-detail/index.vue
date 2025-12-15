<script setup lang="ts">
import {
  ref,
  watch,
  onMounted,
  onUnmounted,
  nextTick,
  provide,
  computed,
  type Ref
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { getPublicArticle, getPublicArticles } from "@/api/post";
import type { Article, ArticleLink } from "@/api/post/type";
import { useLoadingStore } from "@/store/modules/loadingStore";
import { useCommentStore } from "@/store/modules/commentStore";
import { useArticleStore } from "@/store/modules/articleStore";
import { useAppStore } from "@/store/modules/app";
import {
  saveOriginalThemeColors,
  restoreOriginalThemeColors,
  setArticleTheme,
  resetThemeToDefault
} from "@/utils/themeManager";
import { setArticleMetaTags, clearArticleMetaTags } from "@/utils/metaManager";

import PostHeader from "./components/PostHeader/index.vue";
import PostOutdateNotice from "./components/PostOutdateNotice/index.vue";
import AiSummary from "./components/AiSummary/index.vue";
import PostContent from "./components/PostContent/index.vue";
import PostCopyright from "./components/PostCopyright/index.vue";
import PostTools from "./components/PostTools/index.vue";
import PostPagination from "./components/PostPagination/index.vue";
import RelatedPosts from "./components/RelatedPosts/index.vue";
import CommentBarrage from "./components/CommentBarrage/index.vue";
import PostComment from "../components/PostComment/index.vue";
import Sidebar from "../components/Sidebar/index.vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { useUiStore } from "@/store/modules/uiStore";
import { storeToRefs } from "pinia";
import { usePostCustomHTML } from "@/composables/usePostCustomHTML";
import { virtualizeMermaidBlocks } from "@/utils/virtualizeMermaid";

defineOptions({
  name: "PostDetail"
});

// --- 核心响应式状态 ---
const route = useRoute();
const router = useRouter();
const article = ref<Article | null>(null);
const recentArticles = ref<ArticleLink[]>([]);
const seriesArticles = ref<Article[]>([]);
const loading = ref(true);
const commentRef = ref<InstanceType<typeof PostComment> | null>(null);

// --- Pinia Stores ---
const loadingStore = useLoadingStore();
const commentStore = useCommentStore();
const articleStore = useArticleStore();
const uiStore = useUiStore();
const { isSidebarVisible } = storeToRefs(uiStore);
const appStore = useAppStore();

// --- 计算属性 ---
const seriesCategory = computed(() => {
  if (!article.value) return null;
  return article.value.post_categories.find(cat => cat.is_series) || null;
});

const articleWithCommentCount = computed(() => {
  if (!article.value) return null;
  return {
    ...article.value,
    comment_count: commentStore.totalComments
  };
});

const siteConfigStore = useSiteConfigStore();
const commentBarrageConfig = computed(() => {
  const siteConfig = siteConfigStore.getSiteConfig;
  if (!siteConfig || !siteConfig.GRAVATAR_URL) {
    return null;
  }
  return {
    gravatarUrl: siteConfig.GRAVATAR_URL,
    defaultGravatarType: siteConfig.DEFAULT_GRAVATAR_TYPE
  };
});

const siteConfig = siteConfigStore.getSiteConfig;

const siteName = computed(() => {
  return siteConfig?.APP_NAME || "安和鱼";
});

const authorInfoConfig = computed(() => {
  return {
    ownerName: siteConfig.frontDesk.siteOwner.name
  };
});

const { isConsoleOpen } = storeToRefs(appStore);

const { isCommentBarrageVisible } = storeToRefs(uiStore);

// 检查评论功能是否启用
const isCommentEnabled = computed(() => {
  return siteConfigStore.getSiteConfig?.comment?.enable === true;
});

// 获取文章页面自定义HTML（支持script执行）
usePostCustomHTML();

// Mermaid 虚拟渲染：避免首屏/TOC 解析时一次性解析大量 SVG DOM
const mermaidVirtualized = computed(() =>
  virtualizeMermaidBlocks(article.value?.content_html || "")
);

const headingTocItems = ref<{ id: string }[]>([]);
const commentIds = ref<string[]>([]);
const allSpyIds = computed(() => [
  ...headingTocItems.value.map(item => item.id),
  ...commentIds.value
]);

provide("seriesCategory", seriesCategory);
provide("seriesArticles", seriesArticles);
provide("recentArticles", recentArticles);
provide(
  "articleContentHtml",
  computed(() => mermaidVirtualized.value.virtualHtml)
);
provide("allSpyIds", allSpyIds);
provide("updateHeadingTocItems", (items: { id: string }[]) => {
  headingTocItems.value = items;
});

// --- 方法与逻辑 ---

/**
 * @description 管理文章主色调主题的逻辑（优化版本）
 * @param articleRef - 文章数据的 ref
 */
const useArticleTheme = (articleRef: Ref<Article | null>) => {
  // 记录上一次的颜色，避免重复设置
  let previousColor: string | undefined = undefined;

  watch(
    () => articleRef.value?.primary_color,
    (newColor, oldColor) => {
      // 如果颜色没有变化，跳过处理
      if (newColor === previousColor) {
        return;
      }

      // 更新记录
      previousColor = newColor;

      // 如果新颜色为空，重置到默认主题色
      if (!newColor) {
        resetThemeToDefault();
      } else {
        setArticleTheme(newColor);
      }
    },
    { immediate: true }
  );

  onMounted(() => {
    // 在mounted时保存当前的主题色作为原始颜色
    saveOriginalThemeColors();
  });

  onUnmounted(() => {
    commentStore.resetStore();
    // 离开文章页时，重置到默认主题色
    resetThemeToDefault();
    clearArticleMetaTags();

    // 清空记录
    previousColor = undefined;
  });
};

useArticleTheme(article);

const handleCommentIdsLoaded = (ids: string[]) => {
  commentIds.value = ids;
};

/**
 * @description 更新文章相关的meta标签
 */
const updateArticleMetaTags = () => {
  if (!article.value) {
    clearArticleMetaTags();
    return;
  }

  const metaData = {
    publishedTime: article.value.created_at,
    modifiedTime: article.value.updated_at,
    author: article.value.copyright_author || undefined,
    tags: article.value.post_tags?.map(tag => tag.name) || [],
    keywords: article.value.keywords || undefined
  };

  setArticleMetaTags(metaData);
};

/**
 * @description 获取页面所需的所有数据
 * @param id - 文章ID
 */
const fetchRequiredData = async (id: string) => {
  // 检查是否有SSR数据且数据是新鲜的
  if (window && window.__INITIAL_DATA__) {
    const initialData = window.__INITIAL_DATA__;

    // 检查数据新鲜度（如果数据超过5分钟，重新获取）
    const dataTimestamp = initialData.__timestamp__;
    const isDataFresh =
      dataTimestamp && Date.now() - dataTimestamp < 5 * 60 * 1000;

    if (isDataFresh) {
      article.value = initialData.data || initialData; // 兼容新旧数据格式
      loading.value = false;
      delete window.__INITIAL_DATA__;

      // SSR场景：设置文章标题到store（与非SSR路径保持一致）
      articleStore.setCurrentArticleTitle(article.value.title);

      // 主题色将由 watch 自动处理，无需显式设置

      nextTick(() => {
        loadingStore.stopLoading();
        // 更新meta标签
        updateArticleMetaTags();
      });

      getPublicArticles({ page: 1, pageSize: 5 }).then(res => {
        recentArticles.value = res.data.list.map(p => ({
          id: p.id,
          title: p.title,
          cover_url: p.cover_url,
          abbrlink: p.abbrlink || "",
          created_at: p.created_at
        }));
      });

      // SSR路径也需要获取系列文章
      if (seriesCategory.value) {
        getPublicArticles({
          category: seriesCategory.value.name,
          pageSize: 6
        }).then(res => {
          seriesArticles.value = res.data.list;
        });
      }
      return;
    } else {
      // 数据过期，清除并重新获取
      delete window.__INITIAL_DATA__;
      console.log("SSR数据已过期，重新获取最新数据");
    }
  }

  if (!article.value) {
    loading.value = true;
  }

  try {
    const [articleResponse, recentArticlesResponse] = await Promise.all([
      getPublicArticle(id),
      getPublicArticles({ page: 1, pageSize: 5 })
    ]);

    article.value = articleResponse.data;
    articleStore.setCurrentArticleTitle(articleResponse.data.title);

    // 更新meta标签
    updateArticleMetaTags();

    // 主题色将由 watch 自动处理，无需显式设置

    recentArticles.value = recentArticlesResponse.data.list.map(p => ({
      id: p.id,
      title: p.title,
      cover_url: p.cover_url,
      abbrlink: p.abbrlink || "",
      created_at: p.created_at
    }));

    // 获取系列文章（最多获取6篇）
    if (seriesCategory.value) {
      const seriesResponse = await getPublicArticles({
        category: seriesCategory.value.name,
        pageSize: 6
      });
      seriesArticles.value = seriesResponse.data.list;
    } else {
      seriesArticles.value = [];
    }
  } catch (err: any) {
    console.error("获取页面数据失败:", err);

    // 检查是否为404错误（文章不存在或已删除）
    if (err?.response?.status === 404) {
      // 跳转到404页面
      router.replace({ path: "/404", query: { from: route.fullPath } });
      return;
    }
  } finally {
    loading.value = false;
    nextTick(() => {
      loadingStore.stopLoading();
    });
  }
};

/**
 * @description 处理URL哈希值变化，滚动到对应元素
 * @param hash - URL中的hash值 (例如 #comment-123)
 */
const handleHashChange = (hash: string) => {
  if (!hash) return;

  setTimeout(() => {
    try {
      const id = decodeURIComponent(hash.slice(1));
      const targetElement = document.getElementById(id);

      if (targetElement) {
        if (id.startsWith("comment-")) {
          commentRef.value?.scrollToComment(id);
        } else {
          const top =
            targetElement.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top, behavior: "smooth" });
        }
      }
    } catch (e) {
      console.error("处理URL哈希值失败:", e);
    }
  }, 800);
};

onMounted(() => {
  handleHashChange(route.hash);
});

watch(
  () => route.hash,
  newHash => {
    handleHashChange(newHash);
  }
);

watch(
  () => route.params.id,
  newId => {
    if (newId) {
      fetchRequiredData(newId as string);
    }
  },
  { immediate: true }
);

// 监听文章变化，发送文章信息更新事件（用于复制版权功能）
watch(
  () => article.value,
  newArticle => {
    if (newArticle) {
      const siteOwnerName = siteConfig.frontDesk?.siteOwner?.name;
      const isReprint =
        newArticle.copyright_author &&
        newArticle.copyright_author !== siteOwnerName;

      window.dispatchEvent(
        new CustomEvent("article-info-update", {
          detail: {
            isReprint,
            copyrightAuthor: newArticle.copyright_author,
            copyrightUrl: newArticle.copyright_url
          }
        })
      );
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="post-detail-container">
    <div v-if="loading" class="post-header-placeholder" />

    <PostHeader
      v-else-if="articleWithCommentCount"
      :article="articleWithCommentCount"
    />

    <div class="layout">
      <main
        class="post-content-inner"
        :class="{ 'full-width': !isSidebarVisible }"
      >
        <div v-if="article" class="post-detail-content">
          <!-- 自定义文章顶部HTML（支持script执行） -->
          <div id="post-custom-top" class="custom-post-top" />

          <AiSummary
            v-if="article.summaries && article.summaries.length > 0"
            :summary="article.summaries"
          />
          <PostOutdateNotice :update-date="article.updated_at" />
          <PostContent
            :content="mermaidVirtualized.virtualHtml"
            :raw-content="mermaidVirtualized.rawHtml"
            :mermaid-blocks="mermaidVirtualized.blocks"
          />
          <PostCopyright :article="article" />
          <PostTools :article="article" />
          <PostPagination
            :prev-article="article.prev_article"
            :next-article="article.next_article"
          />
          <!-- 相关文章可以直接在文章详情中获取，最近文章才需要从文章列表获取，这里是相关文章，最近文章数据才通过provide传递 -->
          <RelatedPosts :posts="article.related_articles" />

          <!-- 自定义文章底部HTML（支持script执行） -->
          <div id="post-custom-bottom" class="custom-post-bottom" />

          <PostComment
            ref="commentRef"
            :target-path="route.path"
            @comment-ids-loaded="handleCommentIdsLoaded"
          />
        </div>
      </main>
      <Sidebar v-if="!loading && !loadingStore.isLoading" />
    </div>

    <div id="anzhiyu-footer-bar">
      <div class="footer-logo">{{ siteName }}</div>
      <div class="footer-bar-description">
        来自 {{ authorInfoConfig?.ownerName }} 最新设计与科技的文章
      </div>
      <router-link to="/archives" class="footer-bar-link">
        查看全部
      </router-link>
    </div>

    <CommentBarrage
      v-if="article && commentBarrageConfig && isCommentEnabled"
      v-show="isCommentBarrageVisible && !isConsoleOpen"
      :gravatar-url="commentBarrageConfig.gravatarUrl"
      :default-gravatar-type="commentBarrageConfig.defaultGravatarType"
    />
  </div>
</template>

<style lang="scss" scoped>
.post-header-placeholder {
  width: 100%;
  height: 30rem;
  min-height: 300px;
  [data-theme="dark"] & {
    background-color: #18171d;
  }
}

div#anzhiyu-footer-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 16px;
  height: 140px;
  justify-content: center;
  @media screen and (width <= 768px) {
    position: relative;
    z-index: 2;
    background: var(--anzhiyu-card-bg);
    margin-top: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .footer-logo {
    padding: 0 5px;
    font-size: 1.6rem;
    font-weight: 900;
    line-height: 3rem;
    letter-spacing: normal;
    transition:
      all 0.3s,
      color 0s,
      opacity 0.3s;
  }
  .footer-bar-description {
    color: var(--anzhiyu-secondtext);
    font-weight: 700;
  }
  .footer-bar-link {
    padding: 4px 16px;
    background: var(--anzhiyu-secondbg);
    border-radius: 20px;
    margin-top: 8px;
    font-size: 14px;
    cursor: pointer;
    border: var(--style-border-always);
    transition: all 0.3s ease-out 0s;
    &:hover {
      background: var(--anzhiyu-main);
      color: var(--anzhiyu-white);
      transform: scale(1.1);
      border-color: var(--anzhiyu-main);
    }
  }
}

.post-content-inner {
  width: calc(100% - 300px);
  transition: width 0.3s ease;
  &::selection {
    background-color: var(--anzhiyu-main);
    color: var(--anzhiyu-white);
  }
  &.full-width {
    width: 100%;
  }
}
.post-detail-content {
  box-shadow: var(--anzhiyu-shadow-border);
  padding: 1.25rem 2.5rem;
  border-radius: 12px;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  width: 100%;
  align-self: flex-start;
  animation: slide-in 0.6s 0.1s backwards;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  transition: all 0.3s ease 0s;
  @media screen and (width <= 768px) {
    box-shadow: none;
  }
}

.layout {
  padding: 1rem 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  gap: 0.625rem;
  #content-inner {
    width: 75%;
    flex: 1;
    min-width: 0;
  }
}

@media (max-width: 992px) {
  .post-content-inner {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .layout {
    padding: 0;
    background-color: var(--anzhiyu-main);
    position: relative;
    z-index: 3;
  }
  .post-detail-content {
    border: none;
    border-radius: 12px 12px 0 0;
    padding: 1rem 1rem;
    z-index: 1;
  }

  .post-content-inner {
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    touch-action: pan-y;
  }

  div#anzhiyu-footer-bar {
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    touch-action: pan-y;
  }
}
</style>
