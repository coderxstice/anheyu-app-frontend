<script setup lang="ts">
import { onMounted, computed, watch, nextTick, ref } from "vue";
import type { Comment } from "@/api/comment/type";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { useCommentStore } from "@/store/modules/commentStore";
import { storeToRefs } from "pinia";
import { ElSkeleton, ElEmpty, ElButton } from "element-plus";
import CommentItem from "./components/CommentItem.vue";
import CommentForm from "./components/CommentForm.vue";
import Fancybox from "@/components/Fancybox/index.vue";

defineOptions({ name: "PostComment" });

const props = defineProps({
  targetPath: { type: String, required: true }
});

const emit = defineEmits(["comment-ids-loaded"]);

const siteConfigStore = useSiteConfigStore();
const commentStore = useCommentStore();
const { comments, totalComments, isLoading, isLoadingMore, hasMore } =
  storeToRefs(commentStore);

const quoteText = ref("");

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

const fancyboxOptions = {
  groupAll: true,
  Hash: false,
  Thumbs: {
    autoStart: true
  }
};

onMounted(() => {
  const pageSize = commentInfoConfig.value.page_size || 10;
  // 更新: 调用 initComments 时传入 targetPath
  commentStore.initComments(props.targetPath, pageSize);
});

watch(
  comments,
  newComments => {
    if (newComments && newComments.length > 0) {
      nextTick(() => {
        const commentIds: string[] = [];
        const collectIds = (commentList: Comment[]) => {
          for (const comment of commentList) {
            commentIds.push(`comment-${comment.id}`);
            if (comment.children && comment.children.length > 0) {
              collectIds(comment.children);
            }
          }
        };
        collectIds(newComments);
        emit("comment-ids-loaded", commentIds);
      });
    }
  },
  { deep: true }
);

const scrollToComment = (id: string) => {
  const commentElement = document.getElementById(id);
  if (commentElement) {
    commentElement.classList.add("comment--highlight");
    setTimeout(() => {
      commentElement.classList.remove("comment--highlight");
    }, 2000);

    const rect = commentElement.getBoundingClientRect();
    const absoluteTop = rect.top + window.scrollY;
    const top = absoluteTop - 80;
    window.scrollTo({
      top: top,
      behavior: "smooth"
    });
  }
};

const setQuoteText = (text: string) => {
  quoteText.value = text;
};

const handleCommentSubmitted = () => {
  quoteText.value = "";
};

const handleCancelQuote = () => {
  quoteText.value = "";
};

defineExpose({
  scrollToComment,
  setQuoteText
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
        :target-path="props.targetPath"
        :placeholder="commentInfoConfig.placeholder"
        :quote-text="quoteText"
        @submitted="handleCommentSubmitted"
        @cancel-quote="handleCancelQuote"
      />
    </div>

    <div class="comment-list-container">
      <el-skeleton v-if="isLoading" :rows="8" animated />
      <el-empty
        v-else-if="comments.length === 0"
        description="暂无评论，快来抢沙发吧！"
      />
      <Fancybox v-else class="comments-wrapper" :options="fancyboxOptions">
        <div
          v-for="comment in comments"
          :key="comment.id"
          class="comment-thread-item"
        >
          <CommentItem
            :id="`comment-${comment.id}`"
            :comment="comment"
            :config="commentInfoConfig"
          />
        </div>
        <div v-if="hasMore" class="load-more-container">
          <el-button :loading="isLoadingMore" @click="commentStore.loadMore"
            >加载更多</el-button
          >
        </div>
      </Fancybox>
    </div>
  </div>
</template>

<style lang="scss" scoped>
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
  overflow: hidden;
  width: 100%;
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
    width: 70%;
    cursor: pointer;
    text-align: center;
    transition: all 0.5s;
    font-size: 0.75rem;
    box-shadow: 0 8px 16px -4px rgba(44, 45, 48, 0.047);
    border-radius: 50px;
    letter-spacing: 5px;
    background-color: var(--anzhiyu-card-bg);
    border: var(--style-border);
    margin: 2rem auto 0;
    button {
      height: 100%;
      width: 100%;
      border: none;
      box-shadow: none;
      background: transparent;
      padding: 15px;
    }
    &:hover {
      color: var(--anzhiyu-white);
      background-color: var(--anzhiyu-main);
      border: var(--style-border-none);
      button {
        color: var(--anzhiyu-white);
      }
    }
  }
}
</style>
