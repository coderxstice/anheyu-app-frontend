<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { getPublicComments, createPublicComment } from "@/api/comment";
import type { Comment, CreateCommentPayload } from "@/api/comment/type";
import CommentItem from "./components/CommentItem.vue";
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

defineOptions({
  name: "PostComment"
});

const props = defineProps({
  articleId: { type: String, required: true }
});

const comments = ref<Comment[]>([]);
const isLoading = ref(true);
const isLoadingMore = ref(false);
const formRef = ref<FormInstance>();

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
  return !form.nickname.trim() || !form.content.trim();
});

const replyTo = ref<Comment | null>(null);

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

// submitForm 函数基本不变，validate 主要用于校验 email 和 website 格式
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
        // 如果用户勾选了“记住我”之类的选项，可以不清空这些信息
        if (!localStorage.getItem("comment-user-info")) {
          form.nickname = "";
          form.email = "";
          form.website = "";
        }
        replyTo.value = null;
        await fetchComments(1);
      } catch (error) {
        console.error("评论发布失败:", error);
        alert("评论发布失败，请稍后再试。");
      }
    }
  });
};

onMounted(() => {
  fetchComments(1);
  const userInfo = localStorage.getItem("comment-user-info");
  if (userInfo) {
    const { nickname, email, website } = JSON.parse(userInfo);
    form.nickname = nickname;
    form.email = email;
    form.website = website;
  }
});
</script>

<template>
  <div id="post-comment-container">
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
                placeholder="欢迎留下宝贵的建议啦～"
                resize="none"
                show-word-limit
                :maxlength="10000"
              />
              <div class="textarea-actions">
                <button class="action-icon" type="button"><IconEmoji /></button>
                <button class="action-icon" type="button"><IconImage /></button>
              </div>
            </div>
          </el-form-item>
        </div>

        <div class="form-meta-actions">
          <div class="meta-inputs">
            <el-form-item prop="nickname">
              <el-input v-model="form.nickname" placeholder="必选">
                <template #prepend>昵称</template>
              </el-input>
            </el-form-item>
            <el-form-item prop="email">
              <el-input v-model="form.email" placeholder="必选">
                <template #prepend>邮箱</template>
              </el-input>
            </el-form-item>
            <el-form-item prop="website">
              <el-input v-model="form.website" placeholder="可选">
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
          @reply="handleReply"
        />
        <div v-if="hasMore" class="load-more-container">
          <el-button
            type="primary"
            plain
            :loading="isLoadingMore"
            @click="loadMoreComments"
          >
            加载更多
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
#post-comment-container {
  background-color: #fff;
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
    /* background-image: url("https://npm.elemecdn.com/anzhiyu-blog@1.1.6/img/post/common/comment_bg.png");
    background-position: right bottom;
    background-repeat: no-repeat; */

    &:focus-within {
      border: var(--style-border-hover-always);
    }

    .textarea-actions {
      display: flex;
      gap: 8px;
      z-index: 2;

      .action-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        background: #f1f3f4;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        color: #5f6368;
        transition: background-color 0.2s;

        &:hover {
          background-color: #e8eaed;
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

      :deep(.el-input-group__prepend) {
        background-color: #e9ecef;
        color: #495057;
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
}
</style>
