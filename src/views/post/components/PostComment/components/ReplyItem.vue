<script setup lang="ts">
import { computed, ref } from "vue";
import { useCommentStore } from "@/store/modules/commentStore";
import type { Comment } from "@/api/comment/type";
import { UAParser } from "ua-parser-js";
import md5 from "blueimp-md5";
import IconLike from "../icon/IconLike.vue";
import IconReply from "../icon/IconReply.vue";
import IconLocation from "../icon/IconLocation.vue";
import IconOS from "../icon/IconOS.vue";
import IconBrowser from "../icon/IconBrowser.vue";
import CommentForm from "./CommentForm.vue";

const props = defineProps({
  comment: { type: Object as () => Comment, required: true },
  config: { type: Object, required: true }
});

const emit = defineEmits(["comment-submitted"]);

const commentStore = useCommentStore();

// --- 点赞功能 ---
const isLiked = computed(() =>
  commentStore.likedCommentIds.has(props.comment.id)
);
const handleLike = () => {
  commentStore.toggleLikeComment(props.comment.id);
};

const isReplyFormVisible = ref(false);

const gravatarSrc = computed(() => {
  const url = new URL(props.config.gravatar_url);
  url.pathname += `avatar/${props.comment.email_md5}`;
  url.searchParams.set("d", props.config.default_gravatar_type);
  url.searchParams.set("s", "140");
  return url.toString();
});

const avatarSrc = computed(() => {
  const isQQ = /^[1-9]\d{4,10}$/.test(props.comment.nickname?.trim() || "");
  const qqEmailMd5 = md5(
    `${props.comment.nickname?.trim()}@qq.com`
  ).toLowerCase();
  if (isQQ && props.comment.email_md5?.toLowerCase() === qqEmailMd5) {
    return `https://thirdqq.qlogo.cn/g?b=sdk&nk=${props.comment.nickname.trim()}&s=140`;
  }
  return gravatarSrc.value;
});

const isBlogger = computed(() => !!props.comment.is_admin_comment);

const formattedDate = computed(() => {
  const now = new Date();
  const past = new Date(props.comment.created_at);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} 天前`;
  if (days < 30) return `${Math.floor(days / 7)} 周前`;
  if (days < 365) return `${Math.floor(days / 30)} 个月前`;
  return `${Math.floor(days / 365)} 年前`;
});

const deviceInfo = computed(() => {
  if (!props.comment.user_agent) return { os: null, browser: null };
  const parser = new UAParser(props.comment.user_agent);
  const result = parser.getResult();
  return {
    os: result.os.name
      ? `${result.os.name} ${result.os.version || ""}`.trim()
      : null,
    browser: result.browser.name
      ? `${result.browser.name} ${result.browser.version || ""}`.trim()
      : null
  };
});

const onAvatarError = (e: Event) => {
  (e.target as HTMLImageElement).src = gravatarSrc.value;
};

const handleReplyClick = () => {
  isReplyFormVisible.value = !isReplyFormVisible.value;
};
const handleReplySubmitted = () => {
  isReplyFormVisible.value = false;
  emit("comment-submitted");
};
const handleCancelReply = () => {
  isReplyFormVisible.value = false;
};

const scrollToParent = () => {
  if (!props.comment.parent_id) return;
  const parentElement = document.querySelector(
    `#comment-${props.comment.parent_id}`
  );
  if (parentElement) {
    parentElement.scrollIntoView({ behavior: "smooth", block: "center" });
    parentElement.classList.add("comment--highlight");
    setTimeout(() => {
      parentElement.classList.remove("comment--highlight");
    }, 2000);
  }
};
</script>

<template>
  <div :id="`comment-${comment.id}`" class="reply-item-container">
    <div class="comment-item">
      <a
        v-if="comment.website"
        :href="comment.website"
        target="_blank"
        rel="noopener noreferrer nofollow"
      >
        <img
          :src="avatarSrc"
          alt="avatar"
          class="comment-avatar"
          @error="onAvatarError"
        />
      </a>
      <img
        v-else
        :src="avatarSrc"
        alt="avatar"
        class="comment-avatar"
        @error="onAvatarError"
      />

      <div class="comment-main">
        <div class="comment-header">
          <div class="user-info">
            <a href="#" class="nickname" @click.prevent="scrollToParent">{{
              comment.nickname
            }}</a>
            <span v-if="isBlogger" class="master-tag">{{
              config.master_tag
            }}</span>
            <span class="timestamp">{{ formattedDate }}</span>
          </div>
          <div class="comment-actions">
            <button
              class="action-btn"
              :class="{ 'is-liked': isLiked }"
              title="点赞"
              @click="handleLike"
            >
              <IconLike />
              <span v-if="comment.like_count > 0" class="like-count">{{
                comment.like_count
              }}</span>
            </button>
            <button class="action-btn" title="回复" @click="handleReplyClick">
              <IconReply />
            </button>
          </div>
        </div>

        <div v-if="comment.reply_to_nick" class="reply-to-block">
          回复
          <a href="#" @click.prevent="scrollToParent">{{
            "@" + comment.reply_to_nick
          }}</a>
          :
        </div>

        <div class="comment-content" v-html="comment.content_html" />

        <div class="comment-meta">
          <span
            v-if="config.show_region && comment.ip_location"
            class="meta-item"
          >
            <IconLocation /> {{ comment.ip_location }}
          </span>
          <template v-if="config.show_ua">
            <span v-if="deviceInfo.os" class="meta-item"
              ><IconOS /> {{ deviceInfo.os }}</span
            >
            <span v-if="deviceInfo.browser" class="meta-item"
              ><IconBrowser /> {{ deviceInfo.browser }}</span
            >
          </template>
        </div>
      </div>
    </div>

    <div v-if="isReplyFormVisible" class="reply-form-wrapper">
      <CommentForm
        :article-id="comment.article_id"
        :parent-id="comment.id"
        :placeholder="`回复 @${comment.nickname}`"
        show-cancel-button
        @submitted="handleReplySubmitted"
        @cancel="handleCancelReply"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.comment-item {
  display: flex;
  gap: 1rem;
}
.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid #eee;
  transition: transform 0.3s;
  &:hover {
    transform: scale(1.1) rotate(10deg);
  }
}
.comment-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.nickname {
  font-weight: 600;
  font-size: 0.9rem;
  color: #333;
  text-decoration: none;
  &:hover {
    color: var(--el-color-primary);
  }
}
.master-tag {
  background-color: var(--el-color-primary);
  color: #fff;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
}
.timestamp {
  font-size: 0.8rem;
  color: #999;
}
.comment-actions {
  display: flex;
  gap: 0.5rem;
}
.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #8a919f;
  padding: 4px;
  display: flex;
  align-items: center;
  border-radius: 4px;
  transition:
    color 0.3s,
    background-color 0.3s;
  &:hover {
    color: #333;
    background-color: #f1f3f4;
  }
  &.is-liked {
    color: var(--el-color-primary);
  }
  &.is-liked:hover {
    background-color: #f1f3f4;
  }
  .like-count {
    margin-left: 6px;
    font-size: 0.8rem;
  }
}
.reply-to-block {
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  color: var(--anzhiyu-secondtext);
  a {
    font-weight: 500;
    padding: 0 0.2em;
    text-decoration: none;
    &:hover {
      color: var(--anzhiyu-white);
      background-color: var(--anzhiyu-theme);
      border-radius: 4px;
    }
  }
}
.comment-content {
  color: #373a47;
  line-height: 1.6;
  font-size: 0.95rem;
}
:deep(.comment-content p) {
  margin: 0;
}
.comment-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: #999;
  flex-wrap: wrap;
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
:deep(.meta-item svg) {
  width: 14px;
  height: 14px;
}
.reply-form-wrapper {
  margin-top: 1rem;
  margin-left: 48px;
}
@media (max-width: 768px) {
  .reply-form-wrapper {
    margin-left: 0;
  }
}
</style>
