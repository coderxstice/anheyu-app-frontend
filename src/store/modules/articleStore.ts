/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-02 18:31:47
 * @LastEditTime: 2025-08-19 18:16:18
 * @LastEditors: 安知鱼
 */
import { defineStore } from "pinia";
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { router } from "@/router";
import { getRandomArticle, getHomeArticles } from "@/api/post";
import type { Article } from "@/api/post/type";
import defaultCover from "@/assets/img/post/default_cover.jpg";

export const useArticleStore = defineStore("article", () => {
  // state
  const isRandomArticleLoading = ref(false);
  const currentArticleTitle = ref("");

  const homeArticles = ref<Article[]>([]);
  const isHomeArticlesLoading = ref(false);
  const hasFetchedHomeArticles = ref(false);

  // actions
  async function navigateToRandomArticle() {
    if (isRandomArticleLoading.value) return;

    isRandomArticleLoading.value = true;
    try {
      const res = await getRandomArticle();
      if (res.code === 200 && res.data) {
        const articleId = res.data.id;
        router.push({ path: `/posts/${articleId}` });
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

  async function fetchHomeArticles() {
    if (hasFetchedHomeArticles.value) {
      return;
    }

    if (isHomeArticlesLoading.value) return;
    isHomeArticlesLoading.value = true;
    try {
      const res = await getHomeArticles();
      if (res.code === 200 && res.data) {
        homeArticles.value = res.data;
      } else {
        homeArticles.value = [];
      }
    } catch (error) {
      console.error("获取首页推荐文章失败:", error);
      homeArticles.value = [];
    } finally {
      isHomeArticlesLoading.value = false;
      // --- 关键修改：无论请求成功、失败、或返回空数组，都将标志位置为 true ---
      hasFetchedHomeArticles.value = true;
    }
  }

  function setCurrentArticleTitle(title: string) {
    currentArticleTitle.value = title;
  }

  function clearCurrentArticleTitle() {
    currentArticleTitle.value = "";
  }

  return {
    isRandomArticleLoading,
    currentArticleTitle,
    navigateToRandomArticle,
    setCurrentArticleTitle,
    clearCurrentArticleTitle,
    defaultCover,

    homeArticles,
    isHomeArticlesLoading,
    fetchHomeArticles,

    hasFetchedHomeArticles
  };
});
