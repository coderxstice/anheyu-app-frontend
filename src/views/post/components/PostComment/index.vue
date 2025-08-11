<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { getPublicComments } from "@/api/comment";
import type { Comment } from "@/api/comment/type";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { ElSkeleton, ElEmpty, ElButton } from "element-plus";
import CommentItem from "./components/CommentItem.vue";
import CommentForm from "./components/CommentForm.vue";

defineOptions({ name: "PostComment" });

const props = defineProps({
  articleId: { type: String, required: true }
});

const siteConfigStore = useSiteConfigStore();

const commentInfoConfig = computed(() => {
  const config = siteConfigStore.getSiteConfig.comment;
  return {
    blogger_email: config.blogger_email,
    master_tag: config.master_tag,
    page_size: config.page_size,
    placeholder: config.placeholder,
    show_region: config.show_region,
    show_ua: config.show_ua,
    gravatar_url: siteConfigStore.getSiteConfig.GRAVATAR_URL,
    default_gravatar_type: siteConfigStore.getSiteConfig.DEFAULT_GRAVATAR_TYPE
  };
});

const comments = ref<Comment[]>([]);
const isLoading = ref(true);
const isLoadingMore = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const totalComments = ref(0);
const hasMore = computed(() => comments.value.length < totalComments.value);

const fetchComments = async (page = 1) => {
  page === 1 ? (isLoading.value = true) : (isLoadingMore.value = true);
  try {
    const res = await getPublicComments({
      article_id: props.articleId,
      page: page,
      pageSize: pageSize.value
    });
    const data = res.data;
    if (data && data.list) {
      comments.value =
        page === 1 ? data.list : [...comments.value, ...data.list];
      totalComments.value = data.total;
      currentPage.value = data.page;
    }
  } catch (error) {
    console.error("获取评论失败:", error);
  } finally {
    isLoading.value = false;
    isLoadingMore.value = false;
  }
};

const loadMoreComments = () => {
  if (hasMore.value && !isLoadingMore.value) {
    fetchComments(currentPage.value + 1);
  }
};

const handleCommentSubmitted = () => {
  fetchComments(1);
};

onMounted(() => {
  pageSize.value = commentInfoConfig.value.page_size || 10;
  fetchComments(1);
});
</script>

<template>
  <div id="post-comment">
    <div class="main-comment-form-container">
      <h3 class="form-title">
        <i class="anzhiyufont anzhiyu-icon-comments" />
        评论
        <span v-if="!isLoading && totalComments > 0">
          {{ `(${totalComments})` }}
        </span>
      </h3>
      <CommentForm
        :article-id="props.articleId"
        :placeholder="commentInfoConfig.placeholder"
        @submitted="handleCommentSubmitted"
      />
    </div>

    <div class="comment-list-container">
      <el-skeleton v-if="isLoading" :rows="8" animated />
      <el-empty
        v-else-if="comments.length === 0"
        description="暂无评论，快来抢沙发吧！"
      />
      <div v-else class="comments-wrapper">
        <div
          v-for="comment in comments"
          :key="comment.id"
          class="comment-thread-item"
        >
          <hr />
          <CommentItem
            :comment="comment"
            :config="commentInfoConfig"
            @comment-submitted="handleCommentSubmitted"
          />
        </div>
        <div v-if="hasMore" class="load-more-container">
          <el-button
            type="primary"
            plain
            :loading="isLoadingMore"
            @click="loadMoreComments"
            >加载更多</el-button
          >
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* 定义高亮效果的动画 */
@keyframes comment-highlight-animation {
  0% {
    background-color: rgba(0, 123, 255, 0.15);
  }
  100% {
    background-color: transparent;
  }
}

#post-comment {
  border-radius: 8px;
  margin-bottom: 3rem;

  // 定义高亮样式，应用在 comment-thread-item 上
  :deep(.comment--highlight) {
    animation: comment-highlight-animation 2s ease-out;
    border-radius: 8px;
  }
}
.main-comment-form-container {
  .form-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    color: #333;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    i {
      font-size: 1.5rem;
    }
  }
}
.comment-list-container {
  margin-top: 3rem;
  .comments-wrapper {
    display: flex;
    flex-direction: column;
    .comment-thread-item {
      & + .comment-thread-item {
        margin-top: 1.5rem;
      }
      &:first-child hr {
        display: none;
      }
      hr {
        margin-bottom: 1.5rem;
        border: none;
        border-top: 1px solid #eef2f8;
      }
    }
  }
  .load-more-container {
    text-align: center;
    margin-top: 2rem;
  }
}
</style>
