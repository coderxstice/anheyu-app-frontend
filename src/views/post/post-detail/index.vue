<script setup lang="ts">
import { ref, watch, onUnmounted, nextTick } from "vue";
import { useRoute } from "vue-router";
import { getPublicArticle } from "@/api/post";
import type { Article } from "@/api/post/type";
import { useLoadingStore } from "@/store/modules/loadingStore";

// 引入子组件和侧边栏
import PostHeader from "./components/PostHeader/index.vue";
import PostContent from "./components/PostContent/index.vue";
import PostCopyright from "./components/PostCopyright/index.vue";
import PostPagination from "./components/PostPagination/index.vue";
import Sidebar from "../components/Sidebar/index.vue";

defineOptions({
  name: "PostDetail"
});

const route = useRoute();
const article = ref<Article | null>(null);
const loading = ref(true); // 本地加载状态，用于控制骨架屏和 v-loading
const loadingStore = useLoadingStore(); // 全局加载状态

// 分别存储两个颜色变量的原始值
const originalMainColor = ref<string | null>(null);
const originalMainOpDeepColor = ref<string | null>(null);

const fetchArticleData = async (id: string) => {
  // 仅在非水合（客户端导航）时显示加载状态并清空旧数据
  if (!article.value) {
    loading.value = true;
  }
  try {
    const { data } = await getPublicArticle(id);
    article.value = data;
    // 仅在客户端导航时更新 document.title，SSR 时标题已由后端渲染
    if (document) {
      document.title = data.title;
    }
  } catch (error) {
    console.error("获取文章详情失败:", error);
  } finally {
    loading.value = false;
    // 确保 DOM 更新（骨架屏消失，文章内容渲染）完成后，再结束全局加载动画
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
    // 使用后立即删除，避免影响后续的客户端导航
    delete window.__INITIAL_DATA__;
    return true; // 表示已水合
  }
  return false; // 表示未水合
};

// 监听 article 数据的变化，动态修改主题色
watch(
  article,
  newArticle => {
    const rootStyle = document.documentElement.style;
    const rootComputedStyle = getComputedStyle(document.documentElement);

    // 首次进入时，保存原始颜色
    if (originalMainColor.value === null) {
      originalMainColor.value = rootComputedStyle
        .getPropertyValue("--anzhiyu-main")
        .trim();
      originalMainOpDeepColor.value = rootComputedStyle
        .getPropertyValue("--anzhiyu-main-op-deep")
        .trim();
    }

    // 如果新文章存在且有主色调
    if (newArticle && newArticle.primary_color) {
      const newColor = newArticle.primary_color;
      rootStyle.setProperty("--anzhiyu-main", newColor);
      if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(newColor)) {
        rootStyle.setProperty("--anzhiyu-main-op-deep", `${newColor}dd`);
      } else {
        rootStyle.setProperty("--anzhiyu-main-op-deep", newColor);
      }
    } else {
      // 如果文章没有主色调，则恢复原始颜色
      if (originalMainColor.value) {
        rootStyle.setProperty("--anzhiyu-main", originalMainColor.value);
      }
      if (originalMainOpDeepColor.value) {
        rootStyle.setProperty(
          "--anzhiyu-main-op-deep",
          originalMainOpDeepColor.value
        );
      }
    }
  },
  { immediate: true }
);

// 在组件卸载（离开页面）时，确保恢复原始主题色
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
});

// 监听路由参数变化，以便在文章间跳转时重新加载数据
watch(
  () => route.params.id,
  newId => {
    // 首次进入时，先尝试水合
    if (hydrate()) {
      return; // 如果水合成功，则不执行 fetch
    }
    // 如果没有水合数据（说明是客户端路由跳转），则发起 API 请求
    if (newId) {
      fetchArticleData(newId as string);
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
      <main id="content-inner" v-loading="loading">
        <div v-if="article" id="post">
          <PostContent :content="article.content_html" />
          <PostCopyright :article="article" />
          <PostPagination />
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
  background-color: #f2f3f5;
  [data-theme="dark"] & {
    background-color: #18171d;
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
</style>
