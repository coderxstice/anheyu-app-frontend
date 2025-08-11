<script setup lang="ts">
import { computed } from "vue";
import type { Comment } from "@/api/comment/type";
import { UAParser } from "ua-parser-js";
import IconLike from "../icon/IconLike.vue";
import IconReply from "../icon/IconReply.vue";
import IconLocation from "../icon/IconLocation.vue";
import IconOS from "../icon/IconOS.vue";
import IconBrowser from "../icon/IconBrowser.vue";
import md5 from "blueimp-md5";

const props = defineProps({
  comment: {
    type: Object as () => Comment,
    required: true
  },
  config: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(["reply"]);

const isQQNumber = (val: string) => /^[1-9]\d{4,10}$/.test((val || "").trim());

const qqNumber = computed(() => {
  const nick = props.comment.nickname?.trim() || "";
  return isQQNumber(nick) ? nick : null;
});

const useQQAvatar = computed(() => {
  if (!qqNumber.value || !props.comment.email_md5) return false;
  const qqEmailMd5 = md5(`${qqNumber.value}@qq.com`).toLowerCase();
  return props.comment.email_md5.toLowerCase() === qqEmailMd5;
});

const gravatarSrc = computed(() => {
  const url = new URL(props.config.gravatar_url);
  url.pathname += `avatar/${props.comment.email_md5}`;
  url.searchParams.set("d", props.config.default_gravatar_type);
  url.searchParams.set("s", "140");
  return url.toString();
});

const avatarSrc = computed(() => {
  if (useQQAvatar.value) {
    return `https://thirdqq.qlogo.cn/g?b=sdk&nk=${qqNumber.value}&s=140`;
  }
  return gravatarSrc.value;
});

const onAvatarError = (e: Event) => {
  (e.target as HTMLImageElement).src = gravatarSrc.value;
};

const isBlogger = computed(() => !!props.comment.is_admin_comment);

const formattedDate = computed(() => {
  const now = new Date();
  const past = new Date(props.comment.created_at);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  const minutes = Math.floor(diffInSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  if (years > 0) return `${years} 年前`;
  if (months > 0) return `${months} 个月前`;
  if (weeks > 0) return `${weeks} 周前`;
  if (days > 0) return `${days} 天前`;
  if (hours > 0) return `${hours} 小时前`;
  if (minutes > 0) return `${minutes} 分钟前`;
  return "刚刚";
});

const deviceInfo = computed(() => {
  if (!props.comment.user_agent) return { os: null, browser: null };
  const parser = new UAParser(props.comment.user_agent);
  const result = parser.getResult();
  return {
    os: result.os.name ? `${result.os.name} ${result.os.version || ""}` : null,
    browser: result.browser.name
      ? `${result.browser.name} ${result.browser.version || ""}`
      : null
  };
});

const handleReplyClick = () => {
  emit("reply", props.comment);
};
</script>

<template>
  <div class="comment-item">
    <img
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
          <button class="action-btn"><IconLike /></button>
          <button class="action-btn" @click="handleReplyClick">
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
          <IconLocation />
          {{ comment.ip_location }}
        </span>
        <template v-if="config.show_ua">
          <span v-if="deviceInfo.os" class="meta-item">
            <IconOS />
            {{ deviceInfo.os }}
          </span>
          <span v-if="deviceInfo.browser" class="meta-item">
            <IconBrowser />
            {{ deviceInfo.browser }}
          </span>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.comment-item {
  display: flex;
  gap: 1rem;
}
.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid #eee;
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
  .user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    .nickname {
      font-weight: 600;
      color: #333;
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
  }
  .comment-actions {
    display: flex;
    gap: 0.5rem;
    .action-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #8a919f;
      padding: 4px;
      display: flex;
      border-radius: 4px;
      &:hover {
        color: #333;
        background-color: #f1f3f4;
      }
    }
  }
}
.comment-content {
  color: #373a47;
  line-height: 1.6;
  font-size: 0.95rem;
  :deep(p) {
    margin: 0;
  }
  :deep(a) {
    color: #409eff;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}
.comment-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: #999;
  flex-wrap: wrap;
  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    :deep(svg) {
      width: 14px;
      height: 14px;
    }
  }
}
</style>
