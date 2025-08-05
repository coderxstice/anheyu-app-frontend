<script setup lang="ts">
import { ref, reactive, watch, computed } from "vue";
import { useRoute } from "vue-router"; // 1. 引入 useRoute
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

const route = useRoute(); // 2. 获取路由实例
const siteConfigStore = useSiteConfigStore();

// 3. 计算属性，判断是否显示 HomeTop 组件
const showHomeTop = computed(() => {
  // 当页码为 1 时显示，否则隐藏
  return pagination.page === 1;
});

const isDoubleColumn = computed(() => {
  return siteConfigStore.getSiteConfig?.post?.default.double_column || true;
});
const articles = ref<Article[]>([]);
const loading = ref(true);
const pagination = reactive({
  page: 1, // 默认页码为 1
  pageSize: siteConfigStore.getSiteConfig?.post?.default.page_size || 12,
  total: 0
});
const currentCategoryId = ref<string | null>(null);

const fetchData = async () => {
  loading.value = true;
  try {
    const params: GetArticleListParams = {
      page: pagination.page,
      pageSize: pagination.pageSize
    };
    const { data } = await getPublicArticles(params);
    articles.value = data.list;
    pagination.total = data.total;
  } catch (error) {
    console.error("获取文章列表失败:", error);
  } finally {
    loading.value = false;
  }
};

const handleCategoryChange = (categoryId: string | null) => {
  currentCategoryId.value = categoryId;
  pagination.page = 1;
};

const handlePageChange = (newPage: number) => {
  pagination.page = newPage;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// 4. 监听路由参数变化，以更新当前页码
//    这能确保用户通过浏览器前进/后退或直接访问 /page/2 这样的链接时，组件状态正确
watch(
  () => route.params.id,
  newId => {
    pagination.page = newId ? Number(newId) : 1;
  },
  {
    immediate: true
  }
);

// 监听页码和分类ID的变化，自动获取文章数据
watch([() => pagination.page, currentCategoryId], fetchData, {
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
        <CategoryBar @category-change="handleCategoryChange" />
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

      <aside id="aside-content" class="aside-content">
        <Sidebar />
      </aside>
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
  gap: 1rem;
}

.main-content {
  flex: 1;
  min-width: 0;
}

.aside-content {
  width: 280px;
  transition: all 0.3s;
}

.recent-posts {
  min-height: 400px;
  width: 100%;
  &.double-column-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
  }
}

@media (max-width: 992px) {
  .aside-content {
    display: none;
  }
}
</style>
