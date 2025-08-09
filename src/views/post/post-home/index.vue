<script setup lang="ts">
import { watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useArticleStore } from "@/store/modules/articleStore";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { storeToRefs } from "pinia";
import type { GetArticleListParams } from "@/api/post/type";

import HomeTop from "./components/HomeTop/index.vue";
import CategoryBar from "./components/CategoryBar/index.vue";
import TagBar from "./components/TagBar/index.vue";
import ArticleCard from "./components/ArticleCard/index.vue";
import Archives from "./components/Archives/index.vue";
import Pagination from "./components/Pagination/index.vue";
import Sidebar from "../components/Sidebar/index.vue";

defineOptions({
  name: "PostHome"
});

const route = useRoute();
const router = useRouter();

// --- 步骤 1: 引入并使用 Pinia Store ---
const articleStore = useArticleStore();
const siteConfigStore = useSiteConfigStore();

// --- 步骤 2: 从 Store 中解构出响应式的状态和方法 ---
const { articles, loading, pagination } = storeToRefs(articleStore);
const { fetchArticles } = articleStore;

// --- 计算属性 ---
const pageType = computed(() => {
  if (route.path.startsWith("/tags/")) return "tag";
  if (route.path.startsWith("/categories/")) return "category";
  if (route.path.startsWith("/archives")) return "archive";
  return "home";
});

const showHomeTop = computed(() => {
  return pageType.value === "home" && pagination.value.page === 1;
});

const isDoubleColumn = computed(() => {
  return siteConfigStore.getSiteConfig?.post?.default.double_column ?? true;
});

// --- 事件处理方法 ---
const handlePageChange = (newPage: number) => {
  // 推荐通过更新URL来触发数据加载，而不是直接修改状态
  // 这样能保证URL和页面内容的一致性
  const newPath = route.path.replace(/\/page\/\d+$/, "") + `/page/${newPage}`;
  router.push(newPath);
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// --- 侦听器 ---
// 侦听路由的完整路径，当 URL 变化时，调用 store 的 action 来获取新数据
watch(
  () => route.fullPath,
  () => {
    // 准备API请求参数
    const params: GetArticleListParams = {
      page: Number(route.params.page) || 1,
      pageSize: pagination.value.pageSize
    };

    if (pageType.value === "category") {
      params.category = route.params.name as string;
    } else if (pageType.value === "tag") {
      params.tag = route.params.name as string;
    }

    // 调用 store 中的 action 来获取数据
    fetchArticles(params);
  },
  { immediate: true } // 立即执行一次，以保证组件初次加载时有数据
);
</script>

<template>
  <div class="post-home-container">
    <div v-if="showHomeTop" class="post-home-top-container">
      <HomeTop />
    </div>

    <div id="content-inner" class="layout">
      <main class="main-content">
        <CategoryBar v-if="pageType === 'home' || pageType === 'category'" />
        <TagBar v-else-if="pageType === 'tag'" />

        <div
          id="recent-posts"
          v-loading="loading"
          class="recent-posts"
          :class="{
            'double-column-container': isDoubleColumn,
            '!justify-center': articles.length === 0
          }"
        >
          <template v-if="!loading && articles.length > 0">
            <Archives
              v-if="pageType === 'archive'"
              :articles="articles"
              :total="pagination.total"
            />
            <template v-else>
              <ArticleCard
                v-for="article in articles"
                :key="article.id"
                :article="article"
                :is-double-column="isDoubleColumn"
              />
            </template>
          </template>
          <el-empty
            v-if="!loading && articles.length === 0"
            description="暂无文章"
          />
        </div>

        <Pagination
          v-if="!loading && pagination.total > pagination.pageSize"
          :page="pagination.page"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          @current-change="handlePageChange"
        />
      </main>

      <Sidebar />
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* 样式部分保持不变 */
.post-home-top-container {
  margin: 0 auto;
  padding: 0 1.5rem;
  max-width: 1400px;
  width: 100%;
  animation: slide-in 0.6s 0.1s backwards;
  overflow: hidden;
  user-select: none;
}

.layout {
  padding: 0.5rem 1.5rem 1rem;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  gap: 0.625rem;
}

.main-content {
  flex: 1;
  min-width: 0;
}

.recent-posts {
  min-height: 400px;
  width: 100%;
  &.double-column-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.625rem;
  }
}
</style>
