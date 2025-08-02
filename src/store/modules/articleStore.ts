/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-02 18:31:47
 * @LastEditTime: 2025-08-02 18:31:53
 * @LastEditors: 安知鱼
 */
import { defineStore } from "pinia";
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { router } from "@/router"; // 导入Vue Router实例
import { getRandomArticle } from "@/api/post";

export const useArticleStore = defineStore("article", () => {
  // state
  const isRandomArticleLoading = ref(false);

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
        // 使用 router 实例进行跳转
        router.push({ path: `/p/${articleId}` });
      } else {
        // 处理文章不存在的情况
        ElMessage.warning(res.message || "暂时没有可供浏览的文章");
      }
    } catch (error) {
      console.error("获取随机文章失败:", error);
      ElMessage.error("获取随机文章失败，请稍后再试");
    } finally {
      isRandomArticleLoading.value = false;
    }
  }

  return {
    isRandomArticleLoading,
    navigateToRandomArticle
  };
});
