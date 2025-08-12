<script setup lang="ts">
import { computed, ref, onMounted, watch, nextTick } from "vue";
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
import ReplyItem from "./ReplyItem.vue";

const props = defineProps({
  comment: { type: Object as () => Comment, required: true },
  config: { type: Object, required: true }
});

const emit = defineEmits(["comment-submitted"]);

const commentStore = useCommentStore();

const isLiked = computed(() =>
  commentStore.likedCommentIds.has(props.comment.id)
);
const handleLike = () => {
  commentStore.toggleLikeComment(props.comment.id);
};

// --- 博主标签逻辑修改 ---
// 直接根据后端返回的 is_admin_comment 字段进行判断
const isBlogger = computed(() => !!props.comment.is_admin_comment);

const MAX_HEIGHT_THRESHOLD = 280;
const childrenContainerRef = ref<HTMLElement | null>(null);
const isExpanded = ref(false);
const isOverflowing = ref(false);
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

const checkHeight = () => {
  nextTick(() => {
    const container = childrenContainerRef.value;
    if (container) {
      if (container.scrollHeight > MAX_HEIGHT_THRESHOLD) {
        isOverflowing.value = true;
      } else {
        isOverflowing.value = false;
      }
    }
  });
};

onMounted(checkHeight);

watch(
  () => props.comment.children?.length,
  () => {
    isExpanded.value = false;
    checkHeight();
  }
);
</script>

<template>
  <div :id="`comment-${comment.id}`" class="comment-item-container">
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
            <span class="nickname">{{ comment.nickname }}</span>
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

    <div
      v-if="comment.children && comment.children.length > 0"
      :ref="el => (childrenContainerRef = el as HTMLElement)"
      :class="[
        'comment-children',
        { 'is-collapsed': isOverflowing && !isExpanded }
      ]"
    >
      <ReplyItem
        v-for="child in comment.children"
        :key="child.id"
        :comment="child"
        :config="config"
        @comment-submitted="$emit('comment-submitted')"
      />
    </div>

    <div v-if="isOverflowing" class="toggle-wrapper">
      <button
        v-if="!isExpanded"
        class="expand-button"
        @click="isExpanded = true"
      >
        展开
      </button>
      <button v-else class="collapse-button" @click="isExpanded = false">
        收起
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* 样式部分无需改动 */
.comment-item {
  display: flex;
  gap: 1rem;
}
.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid #eee;
  transition: transform 0.3s;
  &:hover {
    transform: scale(1.1) rotate(10deg);
  }
}
.comment-main {
  flex: 1;
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
  color: #333;
}
.timestamp {
  font-size: 0.8rem;
  color: #999;
}
.master-tag {
  background-color: var(--el-color-primary);
  color: #fff;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
}
.comment-actions {
  display: flex;
  gap: 0.5rem;
  height: 30px;
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
.comment-content {
  color: #373a47;
  line-height: 1.6;
  font-size: 0.95rem;
}
.comment-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: #999;
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
.comment-children {
  margin-left: 56px;
  padding-top: 1rem;
  margin-top: 1rem;
  border-top: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  transition: max-height 0.5s ease-in-out;

  &.is-collapsed {
    max-height: 280px;
    overflow: hidden;
    position: relative;
    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 60px;
      background: linear-gradient(to bottom, rgba(255, 255, 255, 0), #fff 80%);
      [data-theme="dark"] & {
        background: linear-gradient(
          to bottom,
          rgba(0, 0, 0, 0),
          var(--anzhiyu-card-bg) 80%
        );
      }
    }
  }
}
.reply-form-wrapper {
  margin-top: 1rem;
  margin-left: 56px;
}

.toggle-wrapper {
  margin-left: 56px;
  margin-top: 1rem;
  .expand-button,
  .collapse-button {
    border: var(--style-border);
    box-shadow: 0 8px 16px -4px rgba(44, 45, 48, 0.047);
    border-radius: 50px;
    letter-spacing: 5px;
    background-color: var(--anzhiyu-card-bg);
    width: 100%;
    cursor: pointer;
    padding: 0.75rem;
    text-align: center;
    transition: all 0.5s;
    font-size: 0.75rem;
    &:hover {
      color: var(--anzhiyu-white);
      background-color: var(--anzhiyu-main);
      border: var(--style-border-none);
    }
  }
}
@media (max-width: 768px) {
  .comment-children,
  .reply-form-wrapper,
  .toggle-wrapper {
    margin-left: 0;
  }
}
</style>
