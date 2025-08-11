<script setup lang="ts">
import {
  ref,
  reactive,
  onMounted,
  computed,
  nextTick,
  watch,
  onUnmounted
} from "vue";
import { getPublicComments, createPublicComment } from "@/api/comment";
import type { Comment, CreateCommentPayload } from "@/api/comment/type";
import CommentItem from "./components/CommentItem.vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
  ElAlert,
  ElSkeleton,
  ElEmpty
} from "element-plus";
import type { FormInstance, FormRules } from "element-plus";

import IconEmoji from "./icon/IconEmoji.vue";
import IconImage from "./icon/IconImage.vue";
import IconRefresh from "./icon/IconRefresh.vue";

// 引入 GSAP
import { gsap } from "gsap";

// 定义 Emoji 数据类型
interface EmojiPackage {
  name: string;
  type: string;
  icon: string;
  items: {
    icon: string;
    text: string;
  }[];
}

// v-lazy 自定义指令：只负责图片懒加载
const vLazy = {
  mounted: (
    el: HTMLImageElement,
    binding: { value: { url: string; index: number } }
  ) => {
    el.src =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          observer.unobserve(el);
          el.src = binding.value.url;
        }
      },
      {
        root: el.closest(".OwO-items")
      }
    );
    observer.observe(el);
  }
};

defineOptions({
  name: "PostComment"
});

const props = defineProps({
  articleId: { type: String, required: true }
});

const siteConfigStore = useSiteConfigStore();

onMounted(async () => {
  await siteConfigStore.fetchSiteConfig();
  initialize();
});

const owoContainerRef = ref<HTMLElement | null>(null);

const emojiPreviewRef = ref<HTMLElement | null>(null);
const isPreviewVisible = ref(false);
const previewEmojiUrl = ref("");

const commentInfoConfig = computed(() => {
  const config = siteConfigStore.getSiteConfig.comment;
  return {
    blogger_email: config.blogger_email,
    emoji_cdn: config.emoji_cdn,
    limit_length: config.limit_length,
    login_required: config.login_required,
    master_tag: config.master_tag,
    page_size: config.page_size,
    placeholder: config.placeholder,
    show_region: config.show_region,
    show_ua: config.show_ua
  };
});

const comments = ref<Comment[]>([]);
const isLoading = ref(true);
const isLoadingMore = ref(false);
const formRef = ref<FormInstance>();
const showEmojiPicker = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const totalComments = ref(0);
const hasMore = computed(() => comments.value.length < totalComments.value);

const form = reactive<Omit<CreateCommentPayload, "article_id" | "parent_id">>({
  nickname: "",
  email: "",
  website: "",
  content: ""
});

const formRules = reactive<FormRules>({
  email: [{ type: "email", message: "请输入有效的邮箱地址", trigger: "blur" }],
  website: [{ type: "url", message: "请输入有效的网址", trigger: "blur" }]
});

const isSubmitDisabled = computed(() => {
  if (commentInfoConfig.value.login_required) {
    return !form.content.trim();
  }
  return !form.nickname.trim() || !form.content.trim() || !form.email.trim();
});

const replyTo = ref<Comment | null>(null);
const emojiData = ref<EmojiPackage[] | null>(null);
const activeEmojiPackageIndex = ref(0);

const onEmojiEnter = (el: Element, done: () => void) => {
  const items = el.querySelectorAll(".OwO-item");
  const tl = gsap.timeline({ onComplete: done });

  tl.to(el, {
    opacity: 1,
    y: -5,
    duration: 0.2,
    ease: "power2.out"
  });

  if (items.length > 0) {
    tl.to(
      items,
      {
        opacity: 1,
        y: 0,
        duration: 0.3,
        ease: "power2.out",
        stagger: 0.02
      },
      "-=0.1"
    );
  }
};

const onEmojiLeave = (el: Element, done: () => void) => {
  gsap.to(el, {
    opacity: 0,
    y: 15,
    duration: 0.2,
    ease: "power2.in",
    onComplete: done
  });
};

const handleClickOutside = (event: MouseEvent) => {
  if (
    owoContainerRef.value &&
    !owoContainerRef.value.contains(event.target as Node)
  ) {
    showEmojiPicker.value = false;
  }
};

watch(showEmojiPicker, isShown => {
  nextTick(() => {
    if (isShown) {
      document.addEventListener("click", handleClickOutside);
    } else {
      document.removeEventListener("click", handleClickOutside);
    }
  });
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

const handleEmojiEnter = async (event: MouseEvent, emoji: { icon: string }) => {
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  previewEmojiUrl.value = emoji.icon;
  isPreviewVisible.value = true;
  await nextTick();
  const previewEl = emojiPreviewRef.value;
  if (previewEl) {
    const left = rect.left + rect.width / 2 - previewEl.offsetWidth / 2;
    const top = rect.top - previewEl.offsetHeight + 3;
    previewEl.style.left = `${left}px`;
    previewEl.style.top = `${top}px`;
  }
};

const handleEmojiLeave = () => {
  isPreviewVisible.value = false;
};

const fetchEmojis = async () => {
  if (!commentInfoConfig.value.emoji_cdn) return;
  try {
    const response = await fetch(commentInfoConfig.value.emoji_cdn);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    const packages = Object.keys(data).map(key => {
      const packageData = data[key];
      const items = packageData.container.map((item: any) => {
        const srcMatch = item.icon.match(/src="([^"]+)"/);
        return { icon: srcMatch ? srcMatch[1] : "", text: `:${item.text}:` };
      });
      return {
        name: key.match(/title="([^"]+)"/)?.[1] || "Emojis",
        type: packageData.type,
        icon: key,
        items: items
      };
    });
    emojiData.value = packages;
  } catch (error) {
    console.error("Failed to fetch emojis:", error);
  }
};

const addEmoji = (emojiText: string) => {
  const newText = ` ${emojiText} `;
  const textarea = document.querySelector(
    "#comment-form .el-textarea__inner"
  ) as HTMLTextAreaElement;
  if (textarea) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    form.content =
      form.content.substring(0, start) + newText + form.content.substring(end);
    const newPos = start + newText.length;
    textarea.focus();
    nextTick(() => {
      textarea.setSelectionRange(newPos, newPos);
    });
  } else {
    form.content += newText;
  }
};

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
  replyTo.value = comment;
  const formEl = document.getElementById("comment-form");
  formEl?.scrollIntoView({ behavior: "smooth", block: "center" });
};

const cancelReply = () => {
  replyTo.value = null;
};

const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(async valid => {
    if (valid) {
      const payload: CreateCommentPayload = {
        ...form,
        article_id: props.articleId,
        parent_id: replyTo.value ? replyTo.value.id : null
      };
      try {
        await createPublicComment(payload);
        form.content = "";
        replyTo.value = null;
        await fetchComments(1);
      } catch (error) {
        console.error("评论发布失败:", error);
        alert("评论发布失败，请稍后再试。");
      }
    }
  });
};

const initialize = () => {
  pageSize.value = commentInfoConfig.value.page_size || 10;
  fetchComments(1);
  fetchEmojis();
  const userInfo = localStorage.getItem("comment-user-info");
  if (userInfo) {
    const { nickname, email, website } = JSON.parse(userInfo);
    form.nickname = nickname;
    form.email = email;
    form.website = website;
  }
};
</script>

<template>
  <div id="post-comment">
    <div id="comment-form" class="comment-form-container">
      <h2 class="form-title">评论</h2>
      <el-form ref="formRef" :model="form" :rules="formRules">
        <el-alert
          v-if="replyTo"
          :title="`正在回复 @${replyTo.nickname}`"
          type="info"
          show-icon
          :closable="false"
          class="reply-indicator"
        >
          <el-button type="primary" link @click="cancelReply"
            >取消回复</el-button
          >
        </el-alert>

        <div class="textarea-container">
          <el-form-item prop="content">
            <div class="textarea-wrapper">
              <el-input
                v-model="form.content"
                type="textarea"
                :rows="5"
                :placeholder="commentInfoConfig.placeholder"
                show-word-limit
                :maxlength="commentInfoConfig.limit_length"
              />
              <div class="textarea-actions">
                <div
                  v-if="emojiData"
                  ref="owoContainerRef"
                  :class="{
                    'action-icon': true,
                    OwO: true,
                    'OwO-open': showEmojiPicker
                  }"
                  @click.stop="showEmojiPicker = !showEmojiPicker"
                >
                  <div class="OwO-logo">
                    <IconEmoji />
                  </div>

                  <transition
                    :css="false"
                    @enter="onEmojiEnter"
                    @leave="onEmojiLeave"
                  >
                    <div v-if="showEmojiPicker" class="OwO-body">
                      <ul class="OwO-items">
                        <li
                          v-for="(emoji, index) in emojiData[
                            activeEmojiPackageIndex
                          ].items"
                          :key="emoji.text"
                          class="OwO-item"
                          :title="emoji.text"
                          @click.stop="addEmoji(emoji.text)"
                          @mouseenter="handleEmojiEnter($event, emoji)"
                          @mouseleave="handleEmojiLeave"
                        >
                          <img
                            v-lazy="{ url: emoji.icon, index: index }"
                            :alt="emoji.text"
                          />
                        </li>
                      </ul>
                      <div class="OwO-bar">
                        <ul class="OwO-packages">
                          <li
                            v-for="(pkg, index) in emojiData"
                            :key="pkg.name"
                            :class="{
                              'OwO-package-active':
                                activeEmojiPackageIndex === index
                            }"
                            @click.stop="activeEmojiPackageIndex = index"
                          >
                            <div v-html="pkg.icon" />
                          </li>
                        </ul>
                      </div>
                    </div>
                  </transition>
                </div>
                <button class="action-icon" type="button"><IconImage /></button>
              </div>
            </div>
          </el-form-item>
        </div>

        <div v-if="!commentInfoConfig.login_required">
          <div class="form-meta-actions">
            <div class="meta-inputs">
              <el-form-item prop="nickname">
                <el-input v-model="form.nickname" placeholder="必填">
                  <template #prepend>昵称</template>
                </el-input>
              </el-form-item>
              <el-form-item prop="email">
                <el-input v-model="form.email" placeholder="必填">
                  <template #prepend>邮箱</template>
                </el-input>
              </el-form-item>
              <el-form-item prop="website">
                <el-input v-model="form.website" placeholder="选填">
                  <template #prepend>网址</template>
                </el-input>
              </el-form-item>
            </div>
            <el-button
              type="primary"
              class="submit-button"
              :disabled="isSubmitDisabled"
              @click="submitForm(formRef)"
              >发送</el-button
            >
          </div>
        </div>
        <div v-else>
          <el-alert
            title="需要登录后才能发表评论"
            type="info"
            show-icon
            :closable="false"
          />
        </div>
      </el-form>
    </div>

    <div class="comment-list-container">
      <div v-if="!isLoading && comments.length > 0" class="list-header">
        <h3 class="list-title">{{ totalComments }} 条评论</h3>
        <div class="list-tools">
          <button class="tool-icon" @click="fetchComments(1)">
            <IconRefresh />
          </button>
        </div>
      </div>

      <el-skeleton v-if="isLoading" :rows="8" animated />
      <el-empty
        v-else-if="comments.length === 0"
        description="暂无评论，快来抢沙发吧！"
      />
      <div v-else class="comments-wrapper">
        <CommentItem
          v-for="comment in comments"
          :key="comment.id"
          :comment="comment"
          :config="commentInfoConfig"
          @reply="handleReply"
        />
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

    <div v-if="isPreviewVisible" ref="emojiPreviewRef" class="emoji-preview">
      <img :src="previewEmojiUrl" alt="emoji-preview" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@keyframes owoIn {
  from {
    opacity: 0;
    transform: translateY(0) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(-10px) scale(1);
  }
}

.emoji-preview {
  position: fixed;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 8px;
  z-index: 9999;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  animation: owoIn 0.2s cubic-bezier(0.42, 0, 0.3, 1.11);
  transform: translateY(-10px);

  img {
    width: 64px;
    height: 64px;
    display: block;
  }
}

#post-comment {
  border-radius: 8px;
}

.comment-form-container {
  .form-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    color: #333;
  }

  .reply-indicator {
    margin-bottom: 1rem;
    border-radius: 6px;
  }
  .textarea-container {
    margin-bottom: 1rem;
  }

  .textarea-wrapper {
    position: relative;
    width: 100%;
    border: var(--style-border-always);
    border-radius: 12px;
    background-color: var(--anzhiyu-secondbg);
    padding: 16px;
    transition: border 0.2s;

    &:focus-within {
      border: var(--style-border-hover-always);
    }

    .textarea-actions {
      display: flex;
      gap: 8px;
      z-index: 2;

      .OwO {
        position: relative;
        &.OwO-open .OwO-body {
          display: block;
        }
        .OwO-logo {
          width: 1.25em;
          height: 1.25em;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .OwO-body {
          border: var(--style-border-always);
          border-radius: 8px;
          overflow: hidden;
          background-color: var(--anzhiyu-card-bg);
          backdrop-filter: saturate(180%) blur(10px);
          cursor: auto;
          transform: translateZ(0);
          position: absolute;
          left: 0;
          top: 2rem;
          max-width: 500px;
          z-index: 1000;
          min-width: 31.25rem;
          opacity: 0;

          .OwO-items {
            max-height: 200px;
            overflow-y: auto;
            padding: 10px;

            .OwO-item {
              width: 14%;
              box-sizing: border-box;
              list-style-type: none;
              padding: 5px 10px;
              border-radius: 5px;
              display: inline-block;
              font-size: 12px;
              line-height: 14px;
              cursor: pointer;
              text-align: center;
              opacity: 0;
              transform: translateY(20px);
              transition: background-color 0.3s;

              &:hover {
                background-color: rgba(144, 147, 153, 0.13);
              }

              img {
                max-width: 100%;
                width: 2.25rem;
                height: 2.25rem;
                object-fit: contain;
              }
            }
          }
        }
        .OwO-bar {
          width: 100%;
          border-top: 1px solid rgba(144, 147, 153, 0.31);
          border-radius: 0 0 4px 4px;
          .OwO-packages {
            margin: 0;
            padding: 0;
            font-size: 0;
            width: 50px;
            height: 48px;
            background: var(--anzhiyu-background);
            .OwO-package-active {
              background: var(--anzhiyu-card-bg);
            }
            li:nth-child(1) {
              border-radius: 0 0 0 3px;
            }
            li {
              list-style-type: none;
              display: inline-block;
              line-height: 48px;
              font-size: 28px;
              padding: 0 10px;
              cursor: pointer;
              transition: 0.3s;
            }
          }
        }
      }
      .action-icon {
        background: var(--anzhiyu-secondbg);
        border-radius: 50%;
        color: var(--anzhiyu-fontcolor);
        transition: background-color 0.2s;
        align-self: center;
        display: inline-block;
        width: 1.25em;
        line-height: 0;
        margin-right: 10px;
        cursor: pointer;
        flex-shrink: 0;
        user-select: none;

        &:hover {
          background-color: var(--anzhiyu-post-blockquote-bg);
        }
      }
    }

    :deep(.el-textarea__inner) {
      border: none;
      border-radius: 0;
      background-color: transparent;
      color: var(--anzhiyu-fontcolor);
      box-shadow: none;
      padding: 0;
      &:focus {
        box-shadow: none;
      }
      &:hover {
        box-shadow: none;
      }
    }

    :deep(.el-input__count) {
      background: transparent;
      color: var(--anzhiyu-secondtext);
      user-select: none;
      -webkit-user-select: none;
      bottom: -25px;
    }
  }

  .form-meta-actions {
    display: flex;
    gap: 1rem;
    align-items: flex-start;

    .meta-inputs {
      flex-grow: 1;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;

      .el-form-item {
        &:nth-child(1) .el-input-group--prepend {
          &:before {
            content: "输入QQ号会自动获取昵称和头像";
          }
          &::after {
            content: "";
          }
        }
        &:nth-child(2) .el-input-group--prepend {
          &:before {
            content: "收到回复将会发送到你的邮箱";
          }
          &::after {
            content: "";
          }
        }
      }

      :deep(.el-input-group--prepend) {
        &::before {
          display: none;
          position: absolute;
          top: -50px;
          white-space: nowrap;
          border-radius: 10px;
          left: 50%;
          transform: translate(-50%);
          padding: 4px 18px;
          background: var(--anzhiyu-main-op-deep);
          color: var(--anzhiyu-white);
          z-index: 100;
          backdrop-filter: blur(10px);
        }

        &:focus-within::before {
          display: block;
          animation: commonTipsIn 0.3s;
          z-index: 2;
        }

        &::after {
          display: none;
          position: absolute;
          border: 8px solid transparent;
          border-top-color: var(--anzhiyu-main-op-deep);
          left: 50%;
          transform: translate(-50%, -10px);
        }
        &:focus-within::after {
          display: block;
          animation: commonTriangleIn 0.3s;
        }
      }

      :deep(.el-input-group__prepend) {
        background-color: var(--anzhiyu-secondbg);
        color: var(--anzhiyu-fontcolor);
        font-weight: 600;
      }
      :deep(.el-input__inner) {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
      }
    }

    .submit-button {
      padding: 0 2rem;
      font-weight: 600;
      background-color: var(--anzhiyu-fontcolor);
      border: 0 solid var(--anzhiyu-main);
      color: var(--anzhiyu-background);
      &.is-disabled {
        opacity: 0.2;
      }
    }
  }
}

.comment-list-container {
  margin-top: 3rem;

  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 1rem;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 1.5rem;

    .list-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #333;
    }

    .list-tools {
      display: flex;
      gap: 0.5rem;

      .tool-icon {
        background: none;
        border: none;
        cursor: pointer;
        color: #8a919f;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4px;
        border-radius: 4px;

        &:hover {
          color: #333;
          background-color: #f1f3f4;
        }
      }
    }
  }

  .comments-wrapper {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .load-more-container {
    text-align: center;
    margin-top: 2rem;
  }
}

@media (max-width: 768px) {
  .form-meta-actions {
    flex-direction: column;
    .meta-inputs {
      grid-template-columns: 1fr;
    }
    .submit-button {
      width: 100%;
    }
  }
  .OwO-body {
    min-width: auto !important;
    width: 100%;
  }
}
</style>
