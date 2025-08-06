<script setup lang="ts">
import { ref, reactive, watch, computed } from "vue";
import { useRoute } from "vue-router";
import HomeTop from "./components/HomeTop/index.vue";
import CategoryBar from "./components/CategoryBar/index.vue";
import ArticleCard from "./components/ArticleCard/index.vue";
import Pagination from "./components/Pagination/index.vue";
import Sidebar from "./components/Sidebar/index.vue";
import { getPublicArticles } from "@/api/post";
import type { Article, GetArticleListParams } from "@/api/post/type";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

defineOptions({
  name: "PostHome"
});

const route = useRoute();
const siteConfigStore = useSiteConfigStore();

const articles = ref<Article[]>([]);
const loading = ref(true);
const pagination = reactive({
  page: 1,
  pageSize: siteConfigStore.getSiteConfig?.post?.default.page_size || 12,
  total: 0
});
const currentCategoryName = ref<string | null>(null);

const showHomeTop = computed(() => {
  // 仅在首页（非分类、非分页）时显示顶部
  return !currentCategoryName.value && pagination.page === 1;
});

const isDoubleColumn = computed(() => {
  return siteConfigStore.getSiteConfig?.post?.default.double_column || true;
});

const fetchData = async () => {
  loading.value = true;
  try {
    const params: GetArticleListParams = {
      page: pagination.page,
      pageSize: pagination.pageSize
    };
    // 如果 URL 中有分类名，则加入请求参数
    if (currentCategoryName.value) {
      params.category = currentCategoryName.value;
    }
    const { data } = await getPublicArticles(params);
    articles.value = data.list;
    pagination.total = data.total;
  } catch (error) {
    console.error("获取文章列表失败:", error);
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (newPage: number) => {
  // 分页组件已经处理了路由跳转，这里只需更新页码并滚动
  pagination.page = newPage;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// 监听路由参数变化，统一处理分类和分页
watch(
  () => route.params,
  newParams => {
    // 从路由中获取分类名称 (:name)
    currentCategoryName.value = (newParams.name as string) || null;
    // 从路由中获取页码 (:id)
    pagination.page = newParams.id ? Number(newParams.id) : 1;
  },
  {
    immediate: true
  }
);

// 监听页码和分类名的变化，自动获取数据
watch([() => pagination.page, currentCategoryName], fetchData, {
  immediate: true
});
</script>

<template>
  <div class="post-home-container">
    <div v-if="showHomeTop" class="post-home-top-container">
      <HomeTop />
    </div>

    <div id="content-inner" class="layout">
      <main class="main-content">
        <CategoryBar />
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
            <ArticleCard
              v-for="article in articles"
              :key="article.id"
              :article="article"
              :is-double-column="isDoubleColumn"
            />
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
/* 样式部分无需改动 */
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
