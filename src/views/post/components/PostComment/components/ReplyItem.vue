<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from "vue";
import { useCommentStore } from "@/store/modules/commentStore";
import type { Comment } from "@/api/comment/type";
import { UAParser } from "ua-parser-js";
import md5 from "blueimp-md5";
import hljs from "highlight.js";
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

const contentWithFancybox = computed(() => {
  const content = props.comment.content_html;
  if (!content) return "";

  const imgTagRegex =
    /<img(?![^>]*class="[^"]*anzhiyu-owo-emotion[^"]*")[^>]+>/g;

  return content.replace(imgTagRegex, imgTag => {
    const srcMatch = /src=(["'])(.*?)\1/.exec(imgTag);
    const altMatch = /alt=(["'])(.*?)\1/.exec(imgTag);

    if (!srcMatch) {
      return imgTag;
    }

    const src = srcMatch[2];
    const caption = altMatch ? altMatch[2] : "";
    const galleryName = `gallery-comment-${props.comment.parent_id || props.comment.id}`;

    return `<a href="${src}" data-fancybox="${galleryName}" data-caption="${caption}">${imgTag}</a>`;
  });
});

const isLiked = computed(() =>
  commentStore.likedCommentIds.has(props.comment.id)
);
const handleLike = () => {
  commentStore.toggleLikeComment(props.comment.id);
};

const isBlogger = computed(() => !!props.comment.is_admin_comment);

const isReplyFormVisible = computed(
  () => commentStore.activeReplyCommentId === props.comment.id
);

// 展开回复的状态
const isRepliesExpanded = ref(false);

// 已显示的回复数量（用于分页）
const displayedRepliesCount = ref(5); // 初始显示5条
const repliesPageSize = 10; // 每次加载更多显示10条

// 是否有回复
const hasReplies = computed(() => {
  return !!props.comment._hasReplies;
});

// 回复总数量
const repliesCount = computed(() => {
  return props.comment._repliesCount || 0;
});

// 当前显示的回复列表
const displayedReplies = computed(() => {
  if (!props.comment._replies) return [];
  return props.comment._replies.slice(0, displayedRepliesCount.value);
});

// 是否还有更多回复
const hasMoreReplies = computed(() => {
  return displayedRepliesCount.value < repliesCount.value;
});

// 展开回复（只展开，不收起）
const expandReplies = () => {
  isRepliesExpanded.value = true;
};

// 加载更多回复
const loadMoreReplies = () => {
  displayedRepliesCount.value += repliesPageSize;
};

const gravatarSrc = computed(() => {
  const url = new URL(props.config.gravatar_url);
  url.pathname += `avatar/${props.comment.email_md5}`;
  url.searchParams.set("d", props.config.default_gravatar_type);
  url.searchParams.set("s", "140");
  return url.toString();
});

const avatarSrc = computed(() => {
  // 如果是匿名评论，使用匿名头像
  if (props.comment.is_anonymous) {
    const url = new URL(props.config.gravatar_url);
    url.pathname += `avatar/anonymous`;
    url.searchParams.set("d", "mp"); // Mystery Person - 匿名剪影头像
    url.searchParams.set("s", "140");
    url.searchParams.set("f", "y"); // 强制使用默认头像
    return url.toString();
  }

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

  // 提取 UA-CH Platform Version（如果存在）
  let uaString = props.comment.user_agent;
  let platformVersion = "";
  const pvMatch = uaString.match(/\|PV:([^|]+)/);
  if (pvMatch) {
    platformVersion = pvMatch[1].replace(/"/g, ""); // 移除引号
    uaString = uaString.replace(/\|PV:[^|]+/, ""); // 从 UA 字符串中移除 PV 部分
  }

  const parser = new UAParser(uaString);
  const result = parser.getResult();

  let osName = result.os.name || "";
  let osVersion = result.os.version || "";

  // 如果是 Windows 且有 Platform Version，使用它来判断 Windows 版本
  if (osName === "Windows" && platformVersion) {
    const versionNum = parseFloat(platformVersion);
    if (versionNum >= 13) {
      osName = "Windows";
      osVersion = "11";
    } else if (versionNum >= 10) {
      osName = "Windows";
      osVersion = "10";
    }
  }

  return {
    os: osName ? `${osName} ${osVersion}`.trim() : null,
    browser: result.browser.name
      ? `${result.browser.name} ${result.browser.version || ""}`.trim()
      : null
  };
});

const onAvatarError = (e: Event) => {
  (e.target as HTMLImageElement).src = gravatarSrc.value;
};

const handleReplyClick = () => {
  // 如果是匿名评论，不允许回复
  if (props.comment.is_anonymous) return;

  // 如果该评论有回复，自动展开回复列表
  if (hasReplies.value && !isRepliesExpanded.value) {
    isRepliesExpanded.value = true;
  }

  commentStore.toggleReplyForm(props.comment.id);
};
const handleReplySubmitted = () => {
  // 回复提交后，展开回复列表（这样用户可以看到刚发布的回复）
  // 无论之前是否有回复，都应该展开，因为现在至少有一条回复了
  isRepliesExpanded.value = true;

  commentStore.setActiveReplyCommentId(null);
  emit("comment-submitted");
};
const handleCancelReply = () => {
  commentStore.setActiveReplyCommentId(null);
};

// 点击评论内容区域触发回复（仅移动端）
const handleContentClick = () => {
  // 如果是匿名评论，不允许回复
  if (props.comment.is_anonymous) return;
  // 只在移动端才触发回复功能
  if (window.innerWidth > 768) return;
  commentStore.setActiveReplyCommentId(props.comment.id);
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

// 代码高亮
const commentContentRef = ref<HTMLElement | null>(null);

const highlightCode = () => {
  if (!commentContentRef.value) return;

  // 查找所有代码块
  const codeBlocks = commentContentRef.value.querySelectorAll("pre code");
  codeBlocks.forEach(block => {
    // 应用 highlight.js
    hljs.highlightElement(block as HTMLElement);
  });
};

onMounted(() => {
  nextTick(() => {
    highlightCode();
  });
});
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
            <el-tooltip
              :content="comment.is_anonymous ? '匿名评论无法回复' : '回复'"
              placement="top"
              :show-arrow="false"
            >
              <button
                class="action-btn"
                :class="{ 'is-disabled': comment.is_anonymous }"
                :disabled="comment.is_anonymous"
                :title="comment.is_anonymous ? '匿名评论无法回复' : '回复'"
                @click="handleReplyClick"
              >
                <IconReply />
              </button>
            </el-tooltip>
          </div>
        </div>

        <div v-if="comment.reply_to_nick" class="reply-to-block">
          回复
          <a href="#" @click.prevent="scrollToParent">{{
            "@" + comment.reply_to_nick
          }}</a>
          :
        </div>

        <div
          ref="commentContentRef"
          class="comment-content"
          :class="{ 'can-reply': !comment.is_anonymous }"
          @click="handleContentClick"
          v-html="contentWithFancybox"
        />

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

        <!-- 展开回复按钮 -->
        <div
          v-if="hasReplies && !isRepliesExpanded"
          class="expand-replies-btn-wrapper"
        >
          <button class="expand-replies-btn" @click="expandReplies">
            展开 {{ repliesCount }} 条回复 ▼
          </button>
        </div>
      </div>
    </div>

    <div v-if="isReplyFormVisible" class="reply-form-wrapper">
      <CommentForm
        :target-path="comment.target_path"
        :parent-id="comment.parent_id || comment.id"
        :reply-to-id="comment.id"
        :placeholder="`回复 @${comment.nickname}`"
        show-cancel-button
        @submitted="handleReplySubmitted"
        @cancel="handleCancelReply"
      />
    </div>
  </div>

  <!-- 展开的回复列表（平级显示，不缩进） -->
  <template v-if="hasReplies && isRepliesExpanded">
    <ReplyItem
      v-for="reply in displayedReplies"
      :key="reply.id"
      :comment="reply"
      :config="config"
      @comment-submitted="emit('comment-submitted')"
    />

    <!-- 加载更多回复按钮 -->
    <div v-if="hasMoreReplies" class="load-more-replies">
      <button class="load-more-replies-btn" @click="loadMoreReplies">
        加载更多回复 (还有 {{ repliesCount - displayedRepliesCount }} 条)
      </button>
    </div>
  </template>
</template>

<style lang="scss" scoped>
@use "@/style/article-content-base.scss" as *;

.comment-item {
  display: flex;
  gap: 0.5rem;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border: 1px solid #eee;
  border-radius: 50%;
  transition: transform 0.3s;

  &:hover {
    transform: scale(1.1) rotate(10deg);
  }
}

.comment-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0; // 允许 flex 子元素缩小到比内容更小，避免溢出
}

.comment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.user-info {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.nickname {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--anzhiyu-fontcolor);
  text-decoration: none;

  &:hover {
    color: var(--el-color-primary);
  }
}

.master-tag {
  padding: 2px 6px;
  font-size: 0.7rem;
  font-weight: bold;
  color: #fff;
  background-color: var(--anzhiyu-red);
  border-radius: 4px;
}

.timestamp {
  font-size: 0.8rem;
  color: var(--anzhiyu-fontcolor);
}

.comment-actions {
  display: flex;
  gap: 0.5rem;
  height: 30px;
}

.action-btn {
  display: flex;
  align-items: center;
  padding: 4px;
  color: #8a919f;
  cursor: pointer;
  background: none;
  border: none;
  border-radius: 4px;
  transition:
    color 0.3s,
    background-color 0.3s;

  &:hover {
    color: var(--anzhiyu-fontcolor);
    background-color: #f1f3f4;
  }

  &.is-liked {
    color: var(--el-color-primary);
  }

  &.is-liked:hover {
    background-color: #f1f3f4;
  }

  &.is-disabled {
    color: #d0d0d0;
    cursor: not-allowed;
    opacity: 0.5;

    &:hover {
      color: #d0d0d0;
      background-color: transparent;
    }
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
    padding: 0 0.2em;
    font-weight: 500;
    text-decoration: none;

    &:hover {
      color: var(--anzhiyu-white);
      background-color: var(--anzhiyu-theme);
      border-radius: 4px;
    }
  }
}

:deep(.comment-content) {
  // 应用文章内容基础样式
  @include article-content-base;

  // 使用 & {} 包装在 mixin 之后的普通声明，符合 Sass 新规范
  & {
    max-width: 100%; // 限制最大宽度为父容器宽度
    overflow-wrap: break-word; // 允许长单词换行
    word-break: break-word; // 允许在任意字符处换行
    font-size: 0.95rem;
    line-height: 1.6;
    color: var(--anzhiyu-fontcolor);
    transition: opacity 0.2s;
  }

  &.can-reply {
    @media screen and (width <= 768px) {
      cursor: pointer;
    }
  }

  // 覆盖文章样式中的部分规则以适应评论区
  p {
    margin: 0.5rem 0;
  }

  // 代码块溢出处理
  pre,
  .md-editor-code {
    max-width: 100%;
    overflow-x: auto; // 允许水平滚动
  }

  // 表格溢出处理
  table {
    max-width: 100%;
    overflow-x: auto;
    display: block;
  }

  // 图片溢出处理
  img {
    max-width: 100%;
    height: auto;
  }

  // 排除 fancybox 图片链接的样式
  a[data-fancybox] {
    padding: 0 !important;
    border-bottom: none !important;

    &:hover {
      background: transparent !important;
      box-shadow: none !important;
    }
  }

  img {
    max-width: 100%;
    max-height: 300px;
    vertical-align: middle;
    border-radius: 4px;

    &:not(.anzhiyu-owo-emotion) {
      cursor: zoom-in;
    }
  }

  .anzhiyu-owo-emotion {
    width: 3rem;
    height: auto;
    margin: 0;
    display: inline;
  }
}

.comment-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: var(--anzhiyu-fontcolor);

  @media screen and (width <= 768px) {
    gap: 0.5rem;
    font-size: 0.75rem;
    margin-top: 0.5rem;
  }
}

.meta-item {
  display: flex;
  gap: 0.3rem;
  align-items: center;

  @media screen and (width <= 768px) {
    gap: 0.25rem;
  }
}

:deep(.meta-item svg) {
  width: 14px;
  height: 14px;

  @media screen and (width <= 768px) {
    width: 12px;
    height: 12px;
  }
}

.reply-form-wrapper {
  margin-top: 1rem;
  margin-left: 48px;
}

@media (width <= 768px) {
  .reply-form-wrapper {
    margin-left: 0;
  }
}

.expand-replies-btn-wrapper {
  margin-top: 0.75rem;
}

.expand-replies-btn {
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
  color: var(--anzhiyu-main);
  background: transparent;
  border: 1px solid var(--anzhiyu-main);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: var(--anzhiyu-main);
    color: var(--anzhiyu-white);
  }

  @media screen and (width <= 768px) {
    padding: 0.35rem 0.7rem;
    font-size: 0.8rem;
  }
}

.load-more-replies {
  margin: 1rem 0;
  text-align: center;
}

.load-more-replies-btn {
  padding: 0.4rem 1rem;
  font-size: 0.85rem;
  color: var(--anzhiyu-fontcolor);
  background: var(--anzhiyu-card-bg);
  border: 1px solid var(--anzhiyu-main);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: var(--anzhiyu-main);
    color: var(--anzhiyu-white);
  }

  @media screen and (width <= 768px) {
    padding: 0.35rem 0.8rem;
    font-size: 0.8rem;
  }
}
</style>
