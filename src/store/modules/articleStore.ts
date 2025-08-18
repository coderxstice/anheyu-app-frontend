/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-02 18:31:47
 * @LastEditTime: 2025-08-18 14:15:13
 * @LastEditors: 安知鱼
 */
import { defineStore } from "pinia";
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { router } from "@/router";
import { getRandomArticle } from "@/api/post";
import defaultCover from "@/assets/img/post/default_cover.jpg";

export const useArticleStore = defineStore("article", () => {
  // state
  const isRandomArticleLoading = ref(false);
  /**
   * @description 用于存储当前正在查看的文章的动态标题
   */
  const currentArticleTitle = ref("");

  // actions
  /**
   * @description 跳转到一篇随机文章的详情页
   */
  async function navigateToRandomArticle() {
    if (isRandomArticleLoading.value) return; // 防止重复点击

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

  /**
   * @description 设置当前文章的标题
   * @param title - 文章的真实标题
   */
  function setCurrentArticleTitle(title: string) {
    currentArticleTitle.value = title;
  }

  /**
   * @description 清除当前文章的标题（离开文章页时调用）
   */
  function clearCurrentArticleTitle() {
    currentArticleTitle.value = "";
  }

  return {
    isRandomArticleLoading,
    currentArticleTitle,
    navigateToRandomArticle,
    setCurrentArticleTitle,
    clearCurrentArticleTitle,
    defaultCover
  };
});
