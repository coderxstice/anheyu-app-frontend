<script setup lang="ts">
import { ref, reactive, watch, computed } from "vue";
import { useRoute } from "vue-router";
import HomeTop from "./components/HomeTop/index.vue";
import CategoryBar from "./components/CategoryBar/index.vue";
import TagBar from "./components/TagBar/index.vue";
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

// 2. 计算当前页面类型
const pageType = computed(() => {
  if (route.path.startsWith("/tags/")) return "tag";
  if (route.path.startsWith("/categories/")) return "category";
  return "home";
});

const showHomeTop = computed(() => {
  return pageType.value === "home" && pagination.page === 1;
});

const isDoubleColumn = computed(() => {
  return siteConfigStore.getSiteConfig?.post?.default.double_column || true;
});

const articles = ref<Article[]>([]);
const loading = ref(true);
const pagination = reactive({
  page: 1,
  pageSize: siteConfigStore.getSiteConfig?.post?.default.page_size || 12,
  total: 0
});

// 3. 同时维护分类名和标签名
const currentCategoryName = ref<string | null>(null);
const currentTagName = ref<string | null>(null);

// 4. 修改 fetchData，使其能处理标签和分类两种情况
const fetchData = async () => {
  loading.value = true;
  try {
    const params: GetArticleListParams = {
      page: pagination.page,
      pageSize: pagination.pageSize
    };
    if (pageType.value === "category" && currentCategoryName.value) {
      params.category = currentCategoryName.value;
    } else if (pageType.value === "tag" && currentTagName.value) {
      params.tag = currentTagName.value;
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
  pagination.page = newPage;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// 5. 监听路由，更新分类/标签名和页码
watch(
  () => route.params,
  newParams => {
    if (pageType.value === "category") {
      currentCategoryName.value = (newParams.name as string) || null;
      currentTagName.value = null;
    } else if (pageType.value === "tag") {
      currentTagName.value = (newParams.name as string) || null;
      currentCategoryName.value = null;
    } else {
      currentCategoryName.value = null;
      currentTagName.value = null;
    }
    pagination.page = newParams.id ? Number(newParams.id) : 1;
  },
  { immediate: true, deep: true }
);

// 6. 监听所有可能影响数据获取的变量
watch([() => pagination.page, currentCategoryName, currentTagName], fetchData, {
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
