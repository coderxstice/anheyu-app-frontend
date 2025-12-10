<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import HomeTop from "./components/HomeTop/index.vue";
import CategoryBar from "./components/CategoryBar/index.vue";
import TagBar from "./components/TagBar/index.vue";
import ArticleCard from "./components/ArticleCard/index.vue";
import Archives from "./components/Archives/index.vue";
import Pagination from "./components/Pagination/index.vue";
import Sidebar from "../components/Sidebar/index.vue";
import { getPublicArticles } from "@/api/post";
import type { Article, GetArticleListParams } from "@/api/post/type";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { resetThemeToDefault } from "@/utils/themeManager";

defineOptions({
  name: "PostHome"
});

const route = useRoute();
const siteConfigStore = useSiteConfigStore();
const postConfig = computed(() => siteConfigStore.getSiteConfig?.post?.default);

type PageType = "home" | "tag" | "category" | "archive";

const pageType = computed<PageType>(() => {
  const { path } = route;
  if (path.startsWith("/tags/")) return "tag";
  if (path.startsWith("/categories/")) return "category";
  if (path.startsWith("/archives")) return "archive";
  return "home";
});

const isHomePage = computed(() => pageType.value === "home");
const isFirstPage = computed(() => pagination.page === 1);
const showHomeTop = computed(() => isHomePage.value && isFirstPage.value);
const isDoubleColumn = computed(() => postConfig.value?.double_column ?? true);

const articles = ref<Article[]>([]);
const isLoading = ref(false);
const pagination = reactive({
  page: 1,
  pageSize: postConfig.value?.page_size || 12,
  total: 0
});

// 计算最新文章的ID（只在首页第一页时有效）
const newestArticleId = computed(() => {
  if (!showHomeTop.value || articles.value.length === 0) return null;
  return articles.value.reduce((latest, current) =>
    new Date(current.created_at) > new Date(latest.created_at)
      ? current
      : latest
  ).id;
});

// 是否显示分页
const showPagination = computed(() => pagination.total > pagination.pageSize);

const fetchData = async () => {
  isLoading.value = true;
  try {
    const params: GetArticleListParams = {
      page: pagination.page,
      pageSize: pagination.pageSize
    };

    const { name, year, month } = route.params;
    const type = pageType.value;

    if (type === "category" && name) {
      params.category = name as string;
    } else if (type === "tag" && name) {
      params.tag = name as string;
    } else if (type === "archive") {
      if (year) params.year = Number(year);
      if (month) params.month = Number(month);
    }

    const { data } = await getPublicArticles(params);
    articles.value = data.list;
    pagination.total = data.total;
  } catch (error) {
    console.error("获取文章列表失败:", error);
    articles.value = [];
  } finally {
    isLoading.value = false;
  }
};

const handlePageChange = (newPage: number) => {
  pagination.page = newPage;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

watch(
  () => route.fullPath,
  () => {
    articles.value = [];
    pagination.page = route.params.id ? Number(route.params.id) : 1;
    fetchData();
  },
  { immediate: true }
);

onMounted(() => {
  resetThemeToDefault();
});
</script>

<template>
  <div class="post-home-container">
    <!-- 首页顶部区域 -->
    <div v-if="showHomeTop" class="post-home-top-container">
      <HomeTop />
    </div>

    <div id="content-inner" class="layout">
      <main class="main-content">
        <!-- 分类/标签导航栏 -->
        <CategoryBar v-if="isHomePage || pageType === 'category'" />
        <TagBar v-else-if="pageType === 'tag'" />

        <!-- 文章列表区域 -->
        <div
          id="recent-posts"
          class="recent-posts"
          :class="{
            'double-column-container': isDoubleColumn,
            '!justify-center': !isLoading && articles.length === 0
          }"
        >
          <!-- 文章内容 -->
          <template v-if="articles.length > 0">
            <!-- 归档视图 -->
            <Archives
              v-if="pageType === 'archive'"
              :articles="articles"
              :total="pagination.total"
            />
            <!-- 卡片视图 -->
            <template v-else>
              <ArticleCard
                v-for="article in articles"
                :key="article.id"
                :article="article"
                :is-double-column="isDoubleColumn"
                :is-newest="article.id === newestArticleId"
              />
            </template>
          </template>

          <!-- 空状态 -->
          <el-empty
            v-if="!isLoading && articles.length === 0"
            description="暂无文章"
          />
        </div>

        <!-- 分页 -->
        <Pagination
          v-if="showPagination"
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
.post-home-top-container {
  width: 100%;
  max-width: 1400px;
  padding: 0 1.5rem;
  margin: 0 auto;
  overflow: hidden;
  user-select: none;
  animation: slide-in 0.6s 0.1s backwards;
}

.layout {
  display: flex;
  gap: 0.625rem;
  max-width: 1400px;
  padding: 0.5rem 1.5rem 1rem;
  margin: 0 auto;
  min-height: 600px;
  contain: layout style;
}

.main-content {
  flex: 1;
  min-width: 0;
  contain: layout;
}

.recent-posts {
  position: relative;
  width: 100%;
  min-height: 400px;
  will-change: auto;
  animation: slide-in 0.6s 0.1s backwards;

  &.double-column-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.625rem;
    justify-content: space-between;
  }
}

@media screen and (width > 760px) and (width <= 992px) {
  .recent-post-item {
    flex-direction: row !important;
    width: 100% !important;
    height: 200px !important;
  }

  .recent-posts.double-column-container {
    min-height: auto;
  }
}

@media (width <= 768px) {
  .post-home-top-container {
    padding: 0 1rem;
  }
}
</style>
