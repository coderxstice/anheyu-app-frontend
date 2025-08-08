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
  loading.value = true;
  article.value = null; // 在开始获取新文章时，清空旧数据，避免短暂显示旧内容
  try {
    const { data } = await getPublicArticle(id);
    article.value = data;
    document.title = data.title;
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

// 监听 article 数据的变化，动态修改主题色
watch(article, newArticle => {
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
});

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
    if (newId) {
      fetchArticleData(newId as string);
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="post-detail-container">
    <!-- 使用本地 loading 状态控制骨架屏的显示 -->
    <div v-if="loading" class="post-header-placeholder" />
    <PostHeader v-else-if="article" :article="article" />

    <div class="layout">
      <!-- 使用本地 loading 状态给用户一个明确的加载反馈 -->
      <main id="content-inner" v-loading="loading">
        <div v-if="article" id="post">
          <PostContent :content="article.content_md" />
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
