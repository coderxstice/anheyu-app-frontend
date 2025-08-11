// src/store/modules/commentStore.ts

import { ref, computed } from "vue";
import { defineStore } from "pinia";
import {
  getPublicComments,
  createPublicComment,
  likePublicComment,
  unlikePublicComment
} from "@/api/comment";
import type { Comment, CreateCommentPayload } from "@/api/comment/type";

const LIKED_COMMENTS_KEY = "liked_comment_ids";

export const useCommentStore = defineStore("comment", () => {
  // --- State and Getters 保持不变 ---
  const comments = ref<Comment[]>([]);
  const totalComments = ref(0);
  const currentPage = ref(1);
  const pageSize = ref(10);
  const currentArticleId = ref<string | null>(null);
  const isLoading = ref(false);
  const isLoadingMore = ref(false);
  const likedCommentIds = ref<Set<string>>(new Set());

  const hasMore = computed(() => comments.value.length < totalComments.value);

  function loadLikedIdsFromStorage() {
    try {
      const liked = JSON.parse(
        localStorage.getItem(LIKED_COMMENTS_KEY) || "[]"
      );
      likedCommentIds.value = new Set(liked);
    } catch (e) {
      console.error("Failed to parse liked comments from localStorage", e);
      likedCommentIds.value = new Set();
    }
  }

  function findAndUpdateComment(
    commentList: Comment[],
    commentId: string,
    updateFn: (comment: Comment) => void
  ): boolean {
    for (const comment of commentList) {
      if (comment.id === commentId) {
        updateFn(comment);
        return true;
      }
      if (comment.children && comment.children.length > 0) {
        if (findAndUpdateComment(comment.children, commentId, updateFn)) {
          return true;
        }
      }
    }
    return false;
  }

  async function initComments(articleId: string, pSize = 10) {
    loadLikedIdsFromStorage();
    if (currentArticleId.value === articleId && comments.value.length > 0)
      return;
    resetStore(true);
    currentArticleId.value = articleId;
    pageSize.value = pSize;
    await fetchComments(1);
  }

  /**
   * 1. 为 fetchComments 添加 isSilent 参数
   * @param page 页码
   * @param isSilent 是否静默刷新，默认为 false
   */
  async function fetchComments(page = 1, isSilent = false) {
    if (!currentArticleId.value) return;

    // 只有在非静默模式下才显示加载状态
    if (!isSilent) {
      if (page === 1) {
        isLoading.value = true;
      } else {
        isLoadingMore.value = true;
      }
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
      // 只有在非静默模式下才隐藏加载状态
      if (!isSilent) {
        isLoading.value = false;
        isLoadingMore.value = false;
      }
    }
  }

  async function loadMore() {
    if (hasMore.value && !isLoadingMore.value) {
      await fetchComments(currentPage.value + 1);
    }
  }

  /**
   * 2. 在 postComment 中调用 fetchComments 时，传入 isSilent = true
   */
  async function postComment(payload: CreateCommentPayload) {
    try {
      await createPublicComment(payload);
      // 以静默模式重新获取第一页数据
      await fetchComments(1, true);
    } catch (error) {
      console.error("评论发布失败:", error);
      throw error;
    }
  }

  async function toggleLikeComment(commentId: string) {
    const isCurrentlyLiked = likedCommentIds.value.has(commentId);
    try {
      const apiCall = isCurrentlyLiked
        ? unlikePublicComment(commentId)
        : likePublicComment(commentId);
      const res = await apiCall;
      const newLikeCount = res.data;
      findAndUpdateComment(comments.value, commentId, comment => {
        comment.like_count = newLikeCount;
      });
      if (isCurrentlyLiked) {
        likedCommentIds.value.delete(commentId);
      } else {
        likedCommentIds.value.add(commentId);
      }
      localStorage.setItem(
        LIKED_COMMENTS_KEY,
        JSON.stringify(Array.from(likedCommentIds.value))
      );
    } catch (error) {
      console.error("操作失败:", error);
    }
  }

  function resetStore(soft = false) {
    comments.value = [];
    totalComments.value = 0;
    currentPage.value = 1;
    currentArticleId.value = null;
    isLoading.value = false;
    isLoadingMore.value = false;
    if (!soft) {
      likedCommentIds.value.clear();
    }
  }

  return {
    comments,
    totalComments,
    currentPage,
    pageSize,
    isLoading,
    isLoadingMore,
    currentArticleId,
    likedCommentIds,
    hasMore,
    initComments,
    loadMore,
    postComment,
    toggleLikeComment,
    resetStore
  };
});
