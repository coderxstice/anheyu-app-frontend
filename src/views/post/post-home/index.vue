<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-07-25 18:13:11
 * @LastEditTime: 2025-08-04 10:12:02
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import HomeTop from "./components/HomeTop/index.vue";
import CategoryBar from "./components/CategoryBar/index.vue";
import ArticleCard from "./components/ArticleCard/index.vue";
import Pagination from "./components/Pagination/index.vue";
import Sidebar from "./components/Sidebar/index.vue";
import { getArticleList } from "@/api/post";
import type { Article, GetArticleListParams } from "@/api/post/type";

defineOptions({
  name: "PostHome"
});

const articles = ref<Article[]>([]);
const loading = ref(true);
const pagination = reactive({
  page: 1,
  pageSize: 10,
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
    const { data } = await getArticleList(params);
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

watch([() => pagination.page, currentCategoryId], fetchData, {
  immediate: true
});
</script>

<template>
  <div class="post-home-container">
    <div class="post-home-top-container">
      <HomeTop />
    </div>

    <div id="content-inner" class="layout">
      <main class="main-content">
        <CategoryBar @category-change="handleCategoryChange" />
        <div id="recent-posts" v-loading="loading" class="recent-posts">
          <template v-if="!loading && articles.length > 0">
            <ArticleCard
              v-for="article in articles"
              :key="article.id"
              :article="article"
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
  padding: 1rem 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  gap: 1rem;
}

.main-content {
  flex: 1;
  min-width: 0; /* 防止flex项目在内容过多时撑开布局 */
}

.aside-content {
  width: 320px; /* 典型的侧边栏宽度 */
  transition: all 0.3s;
}

.recent-posts {
  min-height: 400px;
  width: 100%;
}

@media (max-width: 992px) {
  .aside-content {
    display: none; /* 在较小屏幕上隐藏侧边栏 */
  }
}
</style>
