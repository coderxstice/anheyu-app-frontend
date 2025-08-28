<script setup lang="ts">
import {
  ref,
  watch,
  onMounted,
  onUnmounted,
  nextTick,
  provide,
  computed
} from "vue";
import { useRoute } from "vue-router";
import { getPublicArticle, getPublicArticles } from "@/api/post";
import type { Article } from "@/api/post/type";
import { useLoadingStore } from "@/store/modules/loadingStore";
import { useCommentStore } from "@/store/modules/commentStore";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { useArticleStore } from "@/store/modules/articleStore";

import PostHeader from "./components/PostHeader/index.vue";
import PostOutdateNotice from "./components/PostOutdateNotice/index.vue";
import AiSummary from "./components/AiSummary/index.vue";
import PostContent from "./components/PostContent/index.vue";
import PostCopyright from "./components/PostCopyright/index.vue";
import PostTools from "./components/PostTools/index.vue";
import PostPagination from "./components/PostPagination/index.vue";
import RelatedPosts from "./components/RelatedPosts/index.vue";
import PostComment from "../components/PostComment/index.vue";
import Sidebar from "../components/Sidebar/index.vue";

defineOptions({
  name: "PostDetail"
});

const route = useRoute();
const article = ref<Article | null>(null);
const recentArticles = ref<Article[]>([]);
const loading = ref(true);
const loadingStore = useLoadingStore();
const commentStore = useCommentStore();
const siteConfigStore = useSiteConfigStore();

const originalMainColor = ref<string | null>(null);
const originalMainOpDeepColor = ref<string | null>(null);
const originalMainOpLightColor = ref<string | null>(null);

provide("recentArticles", recentArticles);

// [核心修改] 恢复 snake_case
provide(
  "articleContentHtml",
  computed(() => article.value?.content_html)
);

const headingTocItems = ref<{ id: string }[]>([]);
const commentIds = ref<string[]>([]);
const allSpyIds = computed(() => {
  const headingIds = headingTocItems.value.map(item => item.id);
  return [...headingIds, ...commentIds.value];
});
provide("allSpyIds", allSpyIds);

provide("updateHeadingTocItems", (items: { id: string }[]) => {
  headingTocItems.value = items;
});
const handleCommentIdsLoaded = (ids: string[]) => {
  commentIds.value = ids;
};

const commentRef = ref<InstanceType<typeof PostComment> | null>(null);
const articleStore = useArticleStore();

const articleWithCommentCount = computed(() => {
  if (!article.value) return null;
  return {
    ...article.value,
    commentCount: commentStore.totalComments
  };
});

const fetchRequiredData = async (id: string) => {
  if (!article.value) {
    loading.value = true;
  }
  try {
    const [articleResponse, recentArticlesResponse] = await Promise.all([
      getPublicArticle(id),
      getPublicArticles({ page: 1, pageSize: 6 })
    ]);

    article.value = articleResponse.data;
    articleStore.setCurrentArticleTitle(articleResponse.data.title);

    recentArticles.value = recentArticlesResponse.data.list;
  } catch (error) {
    console.error("获取页面数据失败:", error);
  } finally {
    loading.value = false;
  }
};

const hydrate = () => {
  if (window && window.__INITIAL_DATA__) {
    article.value = window.__INITIAL_DATA__;
    loading.value = false;
    getPublicArticles({ page: 1, pageSize: 5 }).then(res => {
      recentArticles.value = res.data.list;
    });
    delete window.__INITIAL_DATA__;
    return true;
  }
  return false;
};

watch(
  article,
  newArticle => {
    const rootStyle = document.documentElement.style;
    const rootComputedStyle = getComputedStyle(document.documentElement);

    if (originalMainColor.value === null) {
      originalMainColor.value = rootComputedStyle
        .getPropertyValue("--anzhiyu-main")
        .trim();
      originalMainOpDeepColor.value = rootComputedStyle
        .getPropertyValue("--anzhiyu-main-op-deep")
        .trim();
      originalMainOpLightColor.value = rootComputedStyle
        .getPropertyValue("--anzhiyu-main-op-light")
        .trim();
    }

    if (newArticle && newArticle.primary_color) {
      const newColor = newArticle.primary_color;
      rootStyle.setProperty("--anzhiyu-main", newColor);

      if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(newColor)) {
        rootStyle.setProperty("--anzhiyu-main-op-deep", `${newColor}dd`);
        rootStyle.setProperty("--anzhiyu-main-op-light", `${newColor}0d`);
      } else {
        rootStyle.setProperty("--anzhiyu-main-op-deep", newColor);
        rootStyle.setProperty("--anzhiyu-main-op-light", newColor);
      }
    } else {
      if (originalMainColor.value) {
        rootStyle.setProperty("--anzhiyu-main", originalMainColor.value);
      }
      if (originalMainOpDeepColor.value) {
        rootStyle.setProperty(
          "--anzhiyu-main-op-deep",
          originalMainOpDeepColor.value
        );
      }
      if (originalMainOpLightColor.value) {
        rootStyle.setProperty(
          "--anzhiyu-main-op-light",
          originalMainOpLightColor.value
        );
      }
    }

    if (newArticle) {
      nextTick(() => {
        loadingStore.stopLoading();
      });
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  commentStore.resetStore();

  const rootStyle = document.documentElement.style;
  if (originalMainColor.value) {
    rootStyle.setProperty("--anzhiyu-main", originalMainColor.value);
  }
  if (originalMainOpDeepColor.value) {
    rootStyle.setProperty(
      "--anzhiyu-main-op-deep",
      originalMainOpDeepColor.value
    );
  }
  if (originalMainOpLightColor.value) {
    rootStyle.setProperty(
      "--anzhiyu-main-op-light",
      originalMainOpLightColor.value
    );
  }
});

onMounted(() => {
  const handleInitialHash = () => {
    const hash = window.location.hash;
    if (!hash) return;

    const id = decodeURIComponent(hash.slice(1));
    const targetElement = document.getElementById(id);

    if (targetElement) {
      if (id.startsWith("comment-")) {
        commentRef.value?.scrollToComment(id);
      } else {
        const rect = targetElement.getBoundingClientRect();
        const absoluteTop = rect.top + window.scrollY;
        const top = absoluteTop - 80;
        window.scrollTo({ top: top, behavior: "smooth" });
      }
    }
  };

  setTimeout(handleInitialHash, 800);
});

watch(
  () => route.params.id,
  newId => {
    if (hydrate()) {
      return;
    }
    if (newId) {
      fetchRequiredData(newId as string);
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
      <main class="post-content-inner">
        <div v-if="article" class="post-detail-content">
          <AiSummary
            v-if="article.summaries && article.summaries.length > 0"
            :summary="article.summaries"
          />
          <PostOutdateNotice :update-date="article.updated_at" />
          <PostContent :content="article.content_html" />
          <PostCopyright :article="article" />
          <PostTools :article="article" />
          <PostPagination
            :prev-article="article.prev_article"
            :next-article="article.next_article"
          />
          <RelatedPosts :posts="article.related_articles" />
          <PostComment
            ref="commentRef"
            :target-path="route.path"
            @comment-ids-loaded="handleCommentIdsLoaded"
          />
        </div>
      </main>
      <Sidebar />
    </div>
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
.post-content-inner {
  width: calc(100% - 300px);
  &::selection {
    background-color: var(--anzhiyu-main);
    color: var(--anzhiyu-white);
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
  }
  .post-detail-content {
    border: none;
    border-radius: 12px 12px 0 0;
    padding: 1rem 1rem;
    z-index: 1;
  }
}
</style>
