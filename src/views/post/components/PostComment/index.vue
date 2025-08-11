<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
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
const activeReplyId = ref<string | null>(null);

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

const handleReply = (comment: Comment) => {
  activeReplyId.value = activeReplyId.value === comment.id ? null : comment.id;
};

const cancelReply = () => {
  activeReplyId.value = null;
};

const handleCommentSubmitted = () => {
  fetchComments(1);
  cancelReply();
};

const initialize = () => {
  pageSize.value = commentInfoConfig.value.page_size || 10;
  fetchComments(1);
};

onMounted(initialize);
</script>

<template>
  <div id="post-comment">
    <div class="main-comment-form-container">
      <h3 class="form-title">
        <i class="anzhiyufont anzhiyu-icon-comments" />
        评论
        <span v-if="!isLoading && comments.length > 0">
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
            @reply="handleReply(comment)"
          />

          <div v-if="activeReplyId === comment.id" class="reply-form-wrapper">
            <CommentForm
              :article-id="props.articleId"
              :parent-id="comment.id"
              :placeholder="`回复 @${comment.nickname}`"
              show-cancel-button
              @submitted="handleCommentSubmitted"
              @cancel="cancelReply"
            />
          </div>
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
#post-comment {
  border-radius: 8px;
  margin-bottom: 3rem;
}
.main-comment-form-container {
  .form-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    color: #333;
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
    .comment-thread-item:first-child {
      hr {
        display: none;
      }
    }
  }
  .load-more-container {
    text-align: center;
    margin-top: 2rem;
  }
}
.reply-form-wrapper {
  margin-top: 1rem;
  margin-left: 56px;
  @media (max-width: 768px) {
    margin-left: 0;
  }
}
</style>
