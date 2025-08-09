import { defineStore, storeToRefs } from "pinia";
import { ref, reactive } from "vue";
import { ElMessage } from "element-plus";
import { router } from "@/router";
import { getRandomArticle, getPublicArticles } from "@/api/post";
import type { Article, GetArticleListParams } from "@/api/post/type";
import { useSiteConfigStore } from "./siteConfig";
import defaultCover from "@/assets/img/post/default_cover.jpg";

export const useArticleStore = defineStore("article", () => {
  // === State (状态) ===
  const isRandomArticleLoading = ref(false);

  // 文章列表相关的状态
  const articles = ref<Article[]>([]);
  const loading = ref(true);
  const siteConfigStore = useSiteConfigStore();
  const { getSiteConfig } = storeToRefs(siteConfigStore);

  const pagination = reactive({
    page: 1,
    pageSize: getSiteConfig.value?.post?.default.page_size || 12,
    total: 0
  });

  // === Actions (方法) ===

  /**
   * @description 根据查询参数，从后端获取文章列表
   * @param params - 文章列表的查询参数
   */
  async function fetchArticles(params: GetArticleListParams) {
    loading.value = true;
    try {
      // 如果没有传入页大小，则使用配置中的默认值
      const finalParams = {
        pageSize: pagination.pageSize,
        ...params
      };
      const { data } = await getPublicArticles(finalParams);
      articles.value = data.list;
      pagination.total = data.total;
      pagination.page = finalParams.page || 1; // 更新当前页码
    } catch (error) {
      console.error("获取文章列表失败:", error);
      ElMessage.error("获取文章列表失败，请稍后重试");
    } finally {
      loading.value = false;
    }
  }

  /**
   * @description 跳转到一个随机文章的详情页
   */
  async function navigateToRandomArticle() {
    if (isRandomArticleLoading.value) return; // 防止重复点击

    isRandomArticleLoading.value = true;
    try {
      const res = await getRandomArticle();
      if (res.code === 200 && res.data) {
        router.push({ path: `/posts/${res.data.id}` });
      } else {
        ElMessage.warning(res.message || "暂时没有可供浏览的文章");
      }
    } catch (error) {
      console.error("获取随机文章失败:", error);
      ElMessage.error("获取随机文章失败，请稍后再试");
    } finally {
      isRandomArticleLoading.value = false;
    }
  }

  // 返回 state 和 actions
  return {
    articles,
    loading,
    pagination,
    isRandomArticleLoading,
    defaultCover,
    fetchArticles,
    navigateToRandomArticle
  };
});
