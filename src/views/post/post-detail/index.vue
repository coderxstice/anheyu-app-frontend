<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-07-25 18:10:20
 * @LastEditTime: 2025-08-07 13:38:45
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import { getPublicArticle } from "@/api/post";
import type { Article } from "@/api/post/type";

// 引入我们即将创建的子组件
import PostHeader from "./components/PostHeader/index.vue";
import PostContent from "./components/PostContent/index.vue";
import PostCopyright from "./components/PostCopyright/index.vue";
import PostPagination from "./components/PostPagination/index.vue";

// 引入复用的侧边栏
import Sidebar from "../components/Sidebar/index.vue";

defineOptions({
  name: "PostDetail"
});

const route = useRoute();
const article = ref<Article | null>(null);
const loading = ref(true);

const fetchArticleData = async (id: string) => {
  loading.value = true;
  try {
    const { data } = await getPublicArticle(id);
    article.value = data;
    // 可以在这里根据文章标题设置页面 title
    document.title = data.title;
  } catch (error) {
    console.error("获取文章详情失败:", error);
    // 可以在这里处理加载失败的逻辑，比如跳转到404
  } finally {
    loading.value = false;
  }
};

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
