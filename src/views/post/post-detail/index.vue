<script setup lang="ts">
import { ref, watch, onUnmounted, nextTick, provide, computed } from "vue";
import { useRoute } from "vue-router";
import { getPublicArticle, getPublicArticles } from "@/api/post";
import type { Article } from "@/api/post/type";
import { useLoadingStore } from "@/store/modules/loadingStore";

import PostHeader from "./components/PostHeader/index.vue";
import PostOutdateNotice from "./components/PostOutdateNotice/index.vue";
import AiSummary from "./components/AiSummary/index.vue";
import PostContent from "./components/PostContent/index.vue";
import PostCopyright from "./components/PostCopyright/index.vue";
import PostTools from "./components/PostTools/index.vue";
import PostPagination from "./components/PostPagination/index.vue";
import RelatedPosts from "./components/RelatedPosts/index.vue";
import PostComment from "../components/PostComment/index.vue";
import CommentBarrage from "./components/CommentBarrage/index.vue";
import Sidebar from "../components/Sidebar/index.vue";

defineOptions({
  name: "PostDetail"
});

const route = useRoute();
const article = ref<Article | null>(null);
const recentArticles = ref<Article[]>([]);
const loading = ref(true);
const loadingStore = useLoadingStore();

const originalMainColor = ref<string | null>(null);
const originalMainOpDeepColor = ref<string | null>(null);
const originalMainOpLightColor = ref<string | null>(null);

provide("recentArticles", recentArticles);

provide(
  "articleContentHtml",
  computed(() => article.value?.content_html)
);

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
    if (document) {
      document.title = articleResponse.data.title;
    }

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

    <PostHeader v-else-if="article" :article="article" />

    <div class="layout">
      <main v-loading="loading" class="post-content-inner">
        <div v-if="article" class="post-detail-content">
          <AiSummary
            v-if="article.summaries.length > 0"
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
          <PostComment :article-id="article.id" />
        </div>
      </main>
      <Sidebar />
    </div>
    <CommentBarrage v-if="article" :article-id="article.id" />
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
</style>
