// src/store/modules/commentStore.ts

import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { getPublicComments, createPublicComment } from "@/api/comment";
import type { Comment, CreateCommentPayload } from "@/api/comment/type";

export const useCommentStore = defineStore("comment", () => {
  // --- State ---
  const comments = ref<Comment[]>([]);
  const totalComments = ref(0);
  const currentPage = ref(1);
  const pageSize = ref(10);
  const currentArticleId = ref<string | null>(null);

  const isLoading = ref(false);
  const isLoadingMore = ref(false);

  // --- Getters ---
  const hasMore = computed(() => comments.value.length < totalComments.value);

  // --- Actions ---

  /**
   * 初始化并获取评论
   * @param articleId 文章ID
   * @param pSize 每页数量
   */
  async function initComments(articleId: string, pSize = 10) {
    // 如果是同一篇文章，则不重复初始化，防止重复请求
    if (currentArticleId.value === articleId && comments.value.length > 0)
      return;

    resetStore(); // 初始化前先重置状态
    currentArticleId.value = articleId;
    pageSize.value = pSize;
    await fetchComments(1);
  }

  /**
   * 获取评论的核心逻辑
   * @param page 页码
   */
  async function fetchComments(page = 1) {
    if (!currentArticleId.value) return;

    if (page === 1) {
      isLoading.value = true;
    } else {
      isLoadingMore.value = true;
    }

    try {
      const res = await getPublicComments({
        article_id: currentArticleId.value,
        page: page,
        pageSize: pageSize.value
      });
      const data = res.data;
      if (data && data.list) {
        if (page === 1) {
          comments.value = data.list;
        } else {
          comments.value.push(...data.list);
        }
        totalComments.value = data.total;
        currentPage.value = data.page;
      }
    } catch (error) {
      console.error("获取评论失败:", error);
    } finally {
      isLoading.value = false;
      isLoadingMore.value = false;
    }
  }

  /**
   * 加载更多评论
   */
  async function loadMore() {
    if (hasMore.value && !isLoadingMore.value) {
      await fetchComments(currentPage.value + 1);
    }
  }

  /**
   * 提交新评论
   * @param payload 评论内容
   */
  async function postComment(payload: CreateCommentPayload) {
    try {
      await createPublicComment(payload);
      // 成功后，重新获取第一页数据以显示最新评论
      await fetchComments(1);
    } catch (error) {
      console.error("评论发布失败:", error);
      // 抛出错误，以便组件层可以捕获并进行提示
      throw error;
    }
  }

  /**
   * 重置/清空 Store 状态
   * 在用户离开文章页时调用，防止数据污染
   */
  function resetStore() {
    comments.value = [];
    totalComments.value = 0;
    currentPage.value = 1;
    currentArticleId.value = null;
    isLoading.value = false;
    isLoadingMore.value = false;
  }

  return {
    // State
    comments,
    totalComments,
    currentPage,
    pageSize,
    isLoading,
    isLoadingMore,
    currentArticleId,
    // Getters
    hasMore,
    // Actions
    initComments,
    loadMore,
    postComment,
    resetStore
  };
});
