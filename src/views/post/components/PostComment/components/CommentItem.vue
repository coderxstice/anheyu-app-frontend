<script setup lang="ts">
import { computed, ref, onMounted, nextTick, watchEffect } from "vue";
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
import ReplyItem from "./ReplyItem.vue";

const props = defineProps({
  comment: { type: Object as () => Comment, required: true },
  config: { type: Object, required: true }
});

const emit = defineEmits(["comment-submitted"]);

const commentStore = useCommentStore();

// 子评论分页状态管理
const childrenPage = ref(1); // 从第1页开始
const childrenPageSize = ref(10);

// 计算已经显示的子评论数量
const displayedChildrenCount = computed(() => {
  return props.comment.children?.length || 0;
});

// 计算下一次应该请求的页码和每页大小
const getNextRequestParams = computed(() => {
  const displayed = displayedChildrenCount.value;

  if (displayed === 3) {
    // 第一次点击"加载更多"：需要获取前13条，然后跳过前3条
    // 由于API返回的是按时间排序的数据（从老到新），
    // 这样就能显示从最新数据开始的前13条
    return { page: 1, pageSize: 13, skipFirst: 3 };
  } else if (displayed > 3) {
    // 后续加载更多：每次显示10条新的评论
    // 目标：显示到第 (displayed + 10) 条
    const targetCount = displayed + 10;

    // 由于API返回的是按时间排序的数据（从老到新），
    // 我们需要获取前targetCount条数据，然后跳过前displayed条
    // 这样就能显示从最新数据开始的前targetCount条
    return { page: 1, pageSize: targetCount, skipFirst: displayed };
  }

  // 默认情况（不应该到这里）
  return { page: 1, pageSize: 10, skipFirst: 0 };
});

const contentWithFancybox = computed(() => {
  const content = props.comment.content_html;

  if (!content) {
    return "";
  }

  const imgTagRegex =
    /<img(?![^>]*class="[^"]*anzhiyu-owo-emotion[^"]*")[^>]+>/g;

  let matchFound = false;
  let processedContent = content.replace(imgTagRegex, imgTag => {
    matchFound = true;

    const srcMatch = /src=(["'])(.*?)\1/.exec(imgTag);
    const altMatch = /alt=(["'])(.*?)\1/.exec(imgTag);

    if (!srcMatch) {
      console.warn(
        "   - Image tag found, but could not extract 'src' attribute. Skipping.",
        imgTag
      );
      return imgTag;
    }

    const src = srcMatch[2];
    const caption = altMatch ? altMatch[2] : "";
    const galleryName = `gallery-comment-${props.comment.id}`;

    const replacement = `<a href="${src}" data-fancybox="${galleryName}" data-caption="${caption}">${imgTag}</a>`;
    return replacement;
  });

  // 处理普通链接，为没有 target 属性的链接添加 target="_blank" 和 rel
  processedContent = processedContent.replace(
    /<a\s+(?![^>]*data-fancybox)([^>]*)>/gi,
    (match, attrs) => {
      // 如果已经有 target 属性，不做修改
      if (/target\s*=/i.test(attrs)) {
        return match;
      }

      // 添加 target="_blank" 和 rel 属性
      let newAttrs = attrs;

      // 检查是否已有 rel 属性
      const relMatch = /rel\s*=\s*["']([^"']*)["']/i.exec(attrs);
      if (relMatch) {
        // 如果已有 rel 属性，追加 noopener noreferrer
        const existingRel = relMatch[1];
        const relValues = new Set(existingRel.split(/\s+/));
        relValues.add("noopener");
        relValues.add("noreferrer");
        newAttrs = attrs.replace(
          /rel\s*=\s*["'][^"']*["']/i,
          `rel="${Array.from(relValues).join(" ")}"`
        );
      } else {
        // 如果没有 rel 属性，添加
        newAttrs += ' rel="noopener noreferrer"';
      }

      return `<a ${newAttrs} target="_blank">`;
    }
  );

  return processedContent;
});

const isLiked = computed(() =>
  commentStore.likedCommentIds.has(props.comment.id)
);
const handleLike = () => {
  commentStore.toggleLikeComment(props.comment.id);
};

// 子评论相关计算属性
const isLoadingChildren = computed(() =>
  commentStore.loadingChildrenCommentIds.has(props.comment.id)
);
const hasMoreChildren = computed(() => {
  // 只有当显示的链头数量 >= 3 且数据库还有更多评论时，才显示"加载更多"按钮
  const chainHeadCount = sortedChildren.value.length;
  const loadedCount = props.comment.children?.length || 0;

  // 链头数量 < 3：不显示按钮（预览模式，无需分页）
  // 链头数量 >= 3 且还有更多数据：显示按钮
  return chainHeadCount >= 3 && props.comment.total_children > loadedCount;
});
const childrenCountText = computed(() => {
  const loadedCount = props.comment.children?.length || 0;
  const totalCount = props.comment.total_children;
  const remainingCount = totalCount - loadedCount;
  if (remainingCount <= 0) return "已显示全部回复";
  return `展开 ${remainingCount} 条回复`;
});

const isDev = computed(() => {
  return import.meta.env.DEV;
});

const isBlogger = computed(() => !!props.comment.is_admin_comment);

const isReplyFormVisible = computed(
  () =>
    commentStore.activeReplyCommentId === props.comment.id &&
    !props.comment.is_anonymous
);

// 记录上一次的排序结果（用于保持已显示评论的顺序）
const previousSortedIds = ref<string[]>([]);

// 排序后的子评论列表（使用 ref 而非 computed，以便在 watchEffect 中修改状态）
const sortedChildren = ref<Comment[]>([]);

// 使用 watchEffect 自动计算排序（允许副作用）
watchEffect(() => {
  if (!props.comment.children || props.comment.children.length === 0) {
    previousSortedIds.value = [];
    sortedChildren.value = [];
    return;
  }

  const children = [...props.comment.children];
  const currentIds = new Set(children.map(c => c.id));
  const currentLength = children.length;

  // 开发环境调试：输出原始子评论数据
  if (import.meta.env.DEV) {
    console.log(
      `[评论排序] 顶级评论 ${props.comment.id} 的子评论:`,
      children.map(c => ({
        id: c.id,
        nickname: c.nickname,
        reply_to_id: c.reply_to_id,
        reply_to_nick: c.reply_to_nick,
        created_at: c.created_at
      }))
    );
    console.log(
      `[评论排序] children.length = ${children.length}, total_children = ${props.comment.total_children}`
    );
  }

  // 构建子评论ID集合（用于检测reply_to目标是否在当前数组中）
  const childrenIds = new Set(children.map(c => c.id));

  // 构建回复关系映射：reply_to_id -> Comment[]
  const replyMap = new Map<string, Comment[]>();

  // 识别链头（直接回复顶级评论的评论）
  const chainHeads: Comment[] = [];

  children.forEach(child => {
    // 如果 reply_to_id 是顶级评论的ID或为空，则是链头
    if (!child.reply_to_id || child.reply_to_id === props.comment.id) {
      chainHeads.push(child);
    } else if (childrenIds.has(child.reply_to_id)) {
      // reply_to 目标在当前数组中，建立回复关系映射
      if (!replyMap.has(child.reply_to_id)) {
        replyMap.set(child.reply_to_id, []);
      }
      replyMap.get(child.reply_to_id)!.push(child);
    }
    // 注意：如果 reply_to 目标不在当前数组中，说明它不属于这个预览范围
    // 应该隐藏在"展开更多"按钮后面，这里不做处理
  });

  // 计算每个链头的权重（该链头下的所有回复数）
  const calculateChainWeight = (comment: Comment): number => {
    const directReplies = replyMap.get(comment.id) || [];
    let weight = directReplies.length;

    // 递归计算子回复
    directReplies.forEach(reply => {
      weight += calculateChainWeight(reply);
    });

    return weight;
  };

  // 为每个链头计算权重并附加回复信息
  const chainHeadsWithInfo = chainHeads.map(head => {
    const weight = calculateChainWeight(head);
    return {
      comment: head,
      weight: weight,
      hasReplies: weight > 0,
      repliesCount: weight
    };
  });

  // 对链头排序：优先按时间倒序（保持稳定顺序），权重差距显著时按权重排序
  chainHeadsWithInfo.sort((a, b) => {
    // 优先按时间倒序（新的在前）
    const timeA = new Date(a.comment.created_at).getTime();
    const timeB = new Date(b.comment.created_at).getTime();

    // 如果权重差距较大（>= 5 条回复），则按权重排序（热门对话优先）
    // 否则按时间排序（保持稳定性，避免展开时跳跃）
    const weightDiff = Math.abs(a.weight - b.weight);
    if (weightDiff >= 5) {
      return b.weight - a.weight; // 权重降序
    }

    // 权重差距不大，按时间倒序
    return timeB - timeA;
  });

  // 展开每条对话链
  const expandChain = (comment: Comment): Comment[] => {
    const result: Comment[] = [comment];
    const replies = replyMap.get(comment.id) || [];

    // 对当前层级的回复按时间正序排序（旧的在前）
    const sortedReplies = [...replies].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // 递归展开每个回复
    sortedReplies.forEach(reply => {
      result.push(...expandChain(reply));
    });

    return result;
  };

  // 按链头顺序展开所有对话链，并标记回复信息
  const sortedResult: Comment[] = [];
  chainHeadsWithInfo.forEach(({ comment, hasReplies, repliesCount }) => {
    // 展开完整对话链
    const chain = expandChain(comment);

    // 为链头添加回复信息（用于UI展示"展开回复"按钮）
    const enrichedHead = {
      ...chain[0],
      _hasReplies: hasReplies,
      _repliesCount: repliesCount,
      _replies: chain.slice(1) // 保存其回复链
    } as Comment;

    // 只push链头，回复通过展开按钮显示
    sortedResult.push(enrichedHead);
  });

  // 开发环境调试：输出识别的链头
  if (import.meta.env.DEV) {
    console.log(
      `[评论排序] 识别到 ${chainHeads.length} 个链头:`,
      chainHeads.map(c => ({
        id: c.id,
        nickname: c.nickname,
        reply_to_id: c.reply_to_id,
        created_at: c.created_at
      }))
    );
  }

  // 判断是否是"加载更多"操作（更精确的判断）
  // 加载更多的特征：新数据包含所有旧数据的 ID，且有新增的 ID
  const previousIds = new Set(previousSortedIds.value);
  const allOldIdsPresent = previousSortedIds.value.every(id =>
    currentIds.has(id)
  );
  const hasNewIds = children.some(c => !previousIds.has(c.id));
  const isLoadingMore =
    previousSortedIds.value.length > 0 && allOldIdsPresent && hasNewIds;

  // 首次渲染或非加载更多（如展开回复、刷新）：正常排序
  if (!isLoadingMore) {
    if (import.meta.env.DEV) {
      console.log(
        `[评论排序] 正常排序（首次或重新计算），子评论数=${currentLength}:`,
        sortedResult.map(c => ({
          id: c.id,
          nickname: c.nickname,
          reply_to_nick: c.reply_to_nick,
          hasReplies: c._hasReplies,
          repliesCount: c._repliesCount,
          created_at: c.created_at
        }))
      );
    }

    // 更新记录
    previousSortedIds.value = sortedResult.map(c => c.id);
    sortedChildren.value = sortedResult;
    return;
  }

  // 加载更多：保持已显示评论的顺序，新评论追加到末尾
  const alreadyDisplayed: Comment[] = [];
  const newComments: Comment[] = [];

  sortedResult.forEach(comment => {
    if (previousIds.has(comment.id)) {
      alreadyDisplayed.push(comment);
    } else {
      newComments.push(comment);
    }
  });

  // 保持已显示评论的原顺序
  const finalResult: Comment[] = [];
  previousSortedIds.value.forEach(id => {
    const comment = alreadyDisplayed.find(c => c.id === id);
    if (comment && currentIds.has(id)) {
      finalResult.push(comment);
    }
  });

  // 新加载的评论按排序结果追加到末尾
  finalResult.push(...newComments);

  // 开发环境调试：输出排序后结果
  if (import.meta.env.DEV) {
    console.log(
      `[评论排序] 加载更多，保持已显示=${alreadyDisplayed.length}，新增=${newComments.length}:`,
      finalResult.map(c => ({
        id: c.id,
        nickname: c.nickname,
        reply_to_nick: c.reply_to_nick,
        hasReplies: c._hasReplies,
        repliesCount: c._repliesCount,
        created_at: c.created_at
      }))
    );
  }

  // 更新记录
  previousSortedIds.value = finalResult.map(c => c.id);
  sortedChildren.value = finalResult;
});

const gravatarSrc = computed(() => {
  const url = new URL(props.config.gravatar_url);
  url.pathname += `avatar/${props.comment.email_md5}`;
  url.searchParams.set("d", props.config.default_gravatar_type);
  url.searchParams.set("s", "140");
  return url.toString();
});

const avatarSrc = computed(() => {
  // 优先使用用户自定义头像
  if (props.comment.avatar_url) {
    return props.comment.avatar_url;
  }

  // 如果是匿名评论，使用匿名头像
  if (props.comment.is_anonymous) {
    const url = new URL(props.config.gravatar_url);
    url.pathname += `avatar/anonymous`;
    url.searchParams.set("d", "mp"); // Mystery Person - 匿名剪影头像
    url.searchParams.set("s", "140");
    url.searchParams.set("f", "y"); // 强制使用默认头像
    return url.toString();
  }

  // 如果后端返回了QQ号（邮箱是QQ邮箱格式），使用QQ头像
  if (props.comment.qq_number) {
    return `https://thirdqq.qlogo.cn/g?b=sdk&nk=${props.comment.qq_number}&s=140`;
  }

  // 向后兼容：检查昵称是否为QQ号且邮箱MD5匹配
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
  commentStore.toggleReplyForm(props.comment.id);
};
const handleReplySubmitted = () => {
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

// 加载更多子评论
const handleLoadMoreChildren = async () => {
  const params = getNextRequestParams.value;

  try {
    await commentStore.loadMoreChildren(
      props.comment.id,
      params.page,
      params.pageSize,
      params.skipFirst || 0
    );

    childrenPage.value++;
  } catch (error) {
    console.error("加载更多子评论失败:", error);
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
            <span v-if="comment.pinned_at" class="pinned-tag"> 置顶 </span>
            <span class="timestamp">{{ formattedDate }}</span>
          </div>
          <div class="comment-actions">
            <el-tooltip
              :content="isLiked ? '取消点赞' : '点赞'"
              placement="top"
              :show-arrow="false"
            >
              <button
                class="action-btn"
                :class="{ 'is-liked': isLiked }"
                :title="isLiked ? '取消点赞' : '点赞'"
                @click="handleLike"
              >
                <IconLike />
                <span v-if="comment.like_count > 0" class="like-count">{{
                  comment.like_count
                }}</span>
              </button>
            </el-tooltip>
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
      </div>
    </div>
    <div v-if="isReplyFormVisible" class="reply-form-wrapper">
      <CommentForm
        :target-path="comment.target_path"
        :parent-id="comment.id"
        :reply-to-is-anonymous="comment.is_anonymous"
        :placeholder="`回复 @${comment.nickname}`"
        show-cancel-button
        @submitted="handleReplySubmitted"
        @cancel="handleCancelReply"
      />
    </div>
    <div v-if="sortedChildren.length > 0" class="comment-children">
      <ReplyItem
        v-for="child in sortedChildren"
        :key="child.id"
        :comment="child"
        :config="config"
        @comment-submitted="$emit('comment-submitted')"
      />
    </div>

    <!-- 加载更多子评论按钮 -->
    <div v-if="hasMoreChildren" class="load-more-children-wrapper">
      <button
        class="load-more-children-button"
        :class="{ 'is-loading': isLoadingChildren }"
        :disabled="isLoadingChildren"
        @click="handleLoadMoreChildren"
      >
        <span v-if="!isLoadingChildren">{{ childrenCountText }}</span>
        <span v-else>加载中...</span>
      </button>
    </div>

    <!-- 调试信息 (仅开发环境显示) -->
    <div
      v-if="isDev"
      class="debug-info"
      :style="{
        marginTop: '8px',
        marginLeft: 'calc(40px + 0.5rem)',
        fontSize: '12px',
        color: '#999'
      }"
    >
      调试: total_children={{ comment.total_children }}, children.length={{
        comment.children?.length || 0
      }}, hasMore={{ hasMoreChildren }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "@/style/article-content-base.scss" as *;

.comment-item {
  display: flex;
  gap: 0.5rem;
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border: 1px solid #eee;
  border-radius: 50%;
  transition: transform 0.3s;

  &:hover {
    transform: scale(1.1) rotate(10deg);
  }
}

.comment-main {
  flex: 1;
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
  font-weight: 600;
  color: var(--anzhiyu-fontcolor);
}

.timestamp {
  font-size: 0.8rem;
  color: var(--anzhiyu-fontcolor);
}

.master-tag {
  padding: 2px 6px;
  font-size: 0.7rem;
  font-weight: bold;
  color: #fff;
  background-color: var(--anzhiyu-red);
  border-radius: 4px;
}

.pinned-tag {
  display: flex;
  gap: 0.25rem;
  align-items: center;
  padding: 2px 6px;
  font-size: 0.7rem;
  font-weight: bold;
  color: #fff;
  background-color: #ff6b6b;
  border-radius: 4px;

  i {
    font-size: 0.7rem;
  }
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
  color: var(--anzhiyu-secondtext);
  cursor: pointer;
  background: none;
  border: none;
  border-radius: 4px;
  transition:
    color 0.3s,
    background-color 0.3s;

  &:hover {
    color: var(--anzhiyu-fontcolor);
    background-color: var(--anzhiyu-secondbg);
  }

  &.is-liked {
    color: var(--el-color-primary);
  }

  &.is-liked:hover {
    background-color: var(--anzhiyu-secondbg);
  }

  &.is-disabled {
    color: var(--anzhiyu-lighttext);
    cursor: not-allowed;
    opacity: 0.5;

    &:hover {
      color: var(--anzhiyu-lighttext);
      background-color: transparent;
    }
  }

  .like-count {
    margin-left: 6px;
    font-size: 0.8rem;
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

.comment-children {
  display: flex;
  flex-direction: column;
  padding-top: 1rem;
  margin-top: 1rem;
  margin-left: calc(40px + 0.5rem); // 与父评论内容区域左边缘对齐
}

:deep(.reply-item-container) {
  padding: 1.25rem;
  border-top: var(--style-border-dashed);
  padding-left: 0;
  padding-right: 0;
}

.reply-form-wrapper {
  margin-top: 1rem;
  margin-left: calc(40px + 0.5rem);
}

.load-more-children-wrapper {
  margin-top: 1rem;
  margin-left: calc(40px + 0.5rem);
  text-align: center;
}

.load-more-children-button {
  min-width: 120px;
  padding: 0.5rem 1rem;
  font-size: 0.7rem;
  color: var(--anzhiyu-fontcolor);
  text-align: center;
  letter-spacing: 3px;
  cursor: pointer;
  background-color: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 50px;
  box-shadow: 0 8px 16px -4px rgb(44 45 48 / 4.7%);
  transition: all 0.3s;

  &:hover:not(:disabled) {
    color: var(--anzhiyu-white);
    background-color: var(--anzhiyu-main);
    border: var(--style-border-none);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &.is-loading {
    color: var(--anzhiyu-main);
  }
}

@media (width <= 768px) {
  .comment-children,
  .reply-form-wrapper,
  .load-more-children-wrapper {
    margin-left: 0;
  }
}
</style>
