<script setup lang="ts">
import { ref, watch, onUnmounted, nextTick, provide, computed } from "vue";
import { useRoute } from "vue-router";
import { getPublicArticle } from "@/api/post";
import type { Article } from "@/api/post/type";
import { useLoadingStore } from "@/store/modules/loadingStore";
import { useArticleStore } from "@/store/modules/articleStore";

// 引入所有子组件
import PostHeader from "./components/PostHeader/index.vue";
import PostOutdateNotice from "./components/PostOutdateNotice/index.vue";
import AiSummary from "./components/AiSummary/index.vue";
import PostContent from "./components/PostContent/index.vue";
import PostCopyright from "./components/PostCopyright/index.vue";
import PostTools from "./components/PostTools/index.vue";
import PostPagination from "./components/PostPagination/index.vue";
import RelatedPosts from "./components/RelatedPosts/index.vue";
import PostComment from "./components/PostComment/index.vue";
import CommentBarrage from "./components/CommentBarrage/index.vue";
import Sidebar from "../components/Sidebar/index.vue";

defineOptions({
  name: "PostDetail"
});

const route = useRoute();
const article = ref<Article | null>(null);
const loading = ref(true);
const loadingStore = useLoadingStore();
const articleStore = useArticleStore();

const originalMainColor = ref<string | null>(null);
const originalMainOpDeepColor = ref<string | null>(null);
const originalMainOpLightColor = ref<string | null>(null); // 已存在，现在使用它

provide(
  "articleContentHtml",
  computed(() => article.value?.content_html)
);

// 改造数据获取函数，使其同时获取文章详情和最近文章列表
const fetchRequiredData = async (id: string) => {
  if (!article.value) {
    loading.value = true;
  }
  try {
    // 使用 Promise.all 并行发起请求，提升加载速度
    await Promise.all([
      // 请求一：获取当前文章的详细信息
      getPublicArticle(id).then(res => {
        article.value = res.data;
        if (document) {
          document.title = res.data.title;
        }
      }),
      // 请求二：调用 store 的 action 获取最近文章列表
      // 数据获取后会自动存储在 pinia 中
      articleStore.fetchArticles({ page: 1, pageSize: 6 })
    ]);
  } catch (error) {
    console.error("获取页面数据失败:", error);
  } finally {
    loading.value = false;
    nextTick(() => {
      loadingStore.stopLoading();
    });
  }
};

const hydrate = () => {
  if (window && window.__INITIAL_DATA__) {
    article.value = window.__INITIAL_DATA__;
    loading.value = false;
    nextTick(() => {
      loadingStore.stopLoading();
    });
    // 服务端渲染后，客户端依然需要获取最近文章列表
    articleStore.fetchArticles({ page: 1, pageSize: 5 });
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

    // 首次加载时，保存原始颜色值
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

    // 如果文章有自定义主色，则应用新颜色
    if (newArticle && newArticle.primary_color) {
      const newColor = newArticle.primary_color;
      rootStyle.setProperty("--anzhiyu-main", newColor);

      // 如果是合法的 HEX 颜色，则通过添加两位十六进制数来设置透明度
      if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(newColor)) {
        rootStyle.setProperty("--anzhiyu-main-op-deep", `${newColor}dd`);
        rootStyle.setProperty("--anzhiyu-main-op-light", `${newColor}0d`);
      } else {
        // 如果不是 HEX (可能是 rgba 等)，则直接赋值
        rootStyle.setProperty("--anzhiyu-main-op-deep", newColor);
        rootStyle.setProperty("--anzhiyu-main-op-light", newColor);
      }
    } else {
      // 如果文章没有自定义主色，则恢复为网站的原始颜色
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
  },
  { immediate: true }
);

// 组件卸载时，确保所有颜色都恢复原状
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

// 侦听器调用改造后的函数
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
          <PostPagination :current-id="article.id" />
          <RelatedPosts :tags="article.post_tags" :current-id="article.id" />
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
