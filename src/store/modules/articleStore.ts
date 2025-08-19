/*
 * @Description: 文章相关的状态管理
 * @Author: 安知鱼
 * @Date: 2025-08-02 18:31:47
 * @LastEditTime: 2025-08-19 20:33:42
 * @LastEditors: 安知鱼
 */
import { defineStore } from "pinia";
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { router } from "@/router";
import {
  getRandomArticle,
  getHomeArticles,
  getCategoryList,
  getTagList,
  getArticleArchives
} from "@/api/post";
import type {
  Article,
  PostCategory,
  PostTag,
  ArchiveItem
} from "@/api/post/type";
import defaultCover from "@/assets/img/post/default_cover.jpg";

export const useArticleStore = defineStore("article", () => {
  // --- 通用 State ---
  const isRandomArticleLoading = ref(false);
  const currentArticleTitle = ref("");

  // --- 首页推荐文章 State ---
  const homeArticles = ref<Article[]>([]);
  const isHomeArticlesLoading = ref(false);
  const hasFetchedHomeArticles = ref(false);

  // --- 分类列表 State ---
  const categories = ref<PostCategory[]>([]);
  const areCategoriesLoading = ref(false);
  const hasFetchedCategories = ref(false);

  // --- 标签列表 State ---
  const tags = ref<PostTag[]>([]);
  const areTagsLoading = ref(false);
  const hasFetchedTags = ref(false);

  // --- 归档列表 State ---
  const archives = ref<ArchiveItem[]>([]);
  const areArchivesLoading = ref(false);
  const hasFetchedArchives = ref(false);

  // --- Actions ---

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
    if (hasFetchedHomeArticles.value || isHomeArticlesLoading.value) {
      return;
    }
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
      hasFetchedHomeArticles.value = true;
    }
  }

  async function fetchCategories() {
    if (hasFetchedCategories.value || areCategoriesLoading.value) {
      return;
    }
    areCategoriesLoading.value = true;
    try {
      const { data } = await getCategoryList();
      categories.value = data || [];
    } catch (error) {
      console.error("获取分类列表失败:", error);
      categories.value = [];
    } finally {
      areCategoriesLoading.value = false;
      hasFetchedCategories.value = true;
    }
  }

  async function fetchTags() {
    if (hasFetchedTags.value || areTagsLoading.value) {
      return;
    }
    areTagsLoading.value = true;
    try {
      const { data } = await getTagList();
      tags.value = data || [];
    } catch (error) {
      console.error("获取标签列表失败:", error);
      tags.value = [];
    } finally {
      areTagsLoading.value = false;
      hasFetchedTags.value = true;
    }
  }

  async function fetchArchives() {
    if (hasFetchedArchives.value || areArchivesLoading.value) {
      return;
    }
    areArchivesLoading.value = true;
    try {
      const res = await getArticleArchives();
      if (res.code === 200 && res.data) {
        archives.value = res.data.list || [];
      }
    } catch (error) {
      console.error("获取归档列表失败:", error);
      archives.value = [];
    } finally {
      areArchivesLoading.value = false;
      hasFetchedArchives.value = true;
    }
  }

  function setCurrentArticleTitle(title: string) {
    currentArticleTitle.value = title;
  }

  function clearCurrentArticleTitle() {
    currentArticleTitle.value = "";
  }

  return {
    // 通用
    isRandomArticleLoading,
    currentArticleTitle,
    defaultCover,
    navigateToRandomArticle,
    setCurrentArticleTitle,
    clearCurrentArticleTitle,

    // 首页推荐文章
    homeArticles,
    isHomeArticlesLoading,
    hasFetchedHomeArticles,
    fetchHomeArticles,

    // 分类列表
    categories,
    areCategoriesLoading,
    hasFetchedCategories,
    fetchCategories,

    // 标签列表
    tags,
    areTagsLoading,
    hasFetchedTags,
    fetchTags,

    // 归档列表
    archives,
    areArchivesLoading,
    hasFetchedArchives,
    fetchArchives
  };
});
