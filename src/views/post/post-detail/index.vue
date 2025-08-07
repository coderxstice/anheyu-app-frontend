<script setup lang="ts">
import { ref, watch, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { getPublicArticle } from "@/api/post";
import type { Article } from "@/api/post/type";

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
const loading = ref(true);

// 分别存储两个颜色变量的原始值
const originalMainColor = ref<string | null>(null);
const originalMainOpDeepColor = ref<string | null>(null);

const fetchArticleData = async (id: string) => {
  loading.value = true;
  try {
    const { data } = await getPublicArticle(id);
    article.value = data;
    document.title = data.title;
  } catch (error) {
    console.error("获取文章详情失败:", error);
  } finally {
    loading.value = false;
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

    // 1. 设置 --anzhiyu-main
    rootStyle.setProperty("--anzhiyu-main", newColor);

    // 2. 设置 --anzhiyu-main-op-deep
    // 校验是否为 3 位或 6 位十六进制颜色
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(newColor)) {
      rootStyle.setProperty("--anzhiyu-main-op-deep", `${newColor}dd`);
    } else {
      // 如果不是标准 Hex 格式，无法添加透明度，则直接使用原色
      rootStyle.setProperty("--anzhiyu-main-op-deep", newColor);
    }
  } else {
    // 如果文章没有主色调，或者正在离开页面，则恢复原始颜色
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
    <PostHeader v-if="article" :article="article" />

    <div class="layout">
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
.layout {
  padding: 1rem 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  gap: 0.625rem;
  // 文章页通常主内容区更宽
  #content-inner {
    width: 75%;
    flex: 1;
    min-width: 0;
  }
}
</style>
