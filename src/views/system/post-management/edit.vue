<script setup lang="ts">
import {
  ref,
  reactive,
  onMounted,
  onUnmounted,
  computed,
  watch,
  defineAsyncComponent
} from "vue";
import { useRoute, useRouter, onBeforeRouteLeave } from "vue-router";
import { ElMessage, ElNotification, ElMessageBox } from "element-plus";
import { ArrowLeft } from "@element-plus/icons-vue";
import { debounce } from "lodash-es";
import type { FormInstance } from "element-plus";

type ExposeParam = any;

// 使用懒加载避免影响首屏性能
const MarkdownEditor = defineAsyncComponent(
  () => import("@/components/MarkdownEditor/index.vue")
);
import PostActionButtons from "./components/PostActionButtons.vue";
import PublishDialog from "./components/PublishDialog.vue";
import ArticleHistoryDrawer from "./components/ArticleHistoryDrawer.vue";
import type { ArticleHistory } from "@/api/article-history/types";

import { useNav } from "@/layout/hooks/useNav";
import {
  getArticle,
  createArticle,
  updateArticle,
  getCategoryList,
  getTagList,
  createTag,
  uploadArticleImage
} from "@/api/post";
import type { ArticleForm, PostCategory, PostTag } from "@/api/post/type";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { constant } from "@/constant";

defineOptions({ name: "PostEdit" });

const route = useRoute();
const router = useRouter();
const siteConfigStore = useSiteConfigStore();

const { device, pureApp, toggleSideBar } = useNav();
let wasSidebarOpened = pureApp.getSidebarStatus;

const formRef = ref<FormInstance>();
const editorRef = ref<ExposeParam>();
const loading = ref(true);
const isSubmitting = ref(false);
const articleId = ref<string | null>(null);
const isPublishDialogVisible = ref(false);
const isHistoryDrawerVisible = ref(false);

const form = reactive<ArticleForm>({
  title: "",
  content_md: "## 在这里开始你的创作...",
  cover_url: "",
  ip_location: "",
  status: "PUBLISHED",
  post_tag_ids: [],
  post_category_ids: [],
  show_on_home: true,
  home_sort: 0,
  pin_sort: 0,
  top_img_url: "",
  summaries: [],
  primary_color: "",
  is_primary_color_manual: false,
  abbrlink: "",
  copyright: true,
  is_reprint: false,
  copyright_author: "",
  copyright_author_href: "",
  copyright_url: "",
  keywords: "",
  // 版权区域按钮显示控制（默认全部显示）
  show_reward_button: true,
  show_share_button: true,
  show_subscribe_button: true
});

const initialFormState = reactive({
  title: "",
  content_md: ""
});
const categoryOptions = ref<PostCategory[]>([]);
const tagOptions = ref<PostTag[]>([]);
const isEditMode = computed(
  () => !!articleId.value && articleId.value !== "new"
);
const isDirty = computed(() => {
  return (
    form.title !== initialFormState.title ||
    form.content_md !== initialFormState.content_md
  );
});

// ===== 离开页面保护 =====
// 当有未保存的更改时，离开页面需要提示用户

// 自定义确认弹窗状态
const showLeaveConfirm = ref(false);
let leaveConfirmResolve: ((value: boolean) => void) | null = null;

// 显示离开确认弹窗（返回 Promise）
const showLeaveConfirmDialog = (): Promise<boolean> => {
  return new Promise(resolve => {
    leaveConfirmResolve = resolve;
    showLeaveConfirm.value = true;
  });
};

// 确认离开
const confirmLeave = () => {
  showLeaveConfirm.value = false;
  leaveConfirmResolve?.(true);
  leaveConfirmResolve = null;
};

// 取消离开
const cancelLeave = () => {
  showLeaveConfirm.value = false;
  leaveConfirmResolve?.(false);
  leaveConfirmResolve = null;
};

// beforeunload 事件处理函数
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (isDirty.value) {
    event.preventDefault();
    // 现代浏览器会显示标准的确认对话框
    event.returnValue = "您有未保存的更改，确定要离开吗？";
    return event.returnValue;
  }
};

// 监听 isDirty 变化，动态添加/移除 beforeunload 事件
watch(
  isDirty,
  newIsDirty => {
    if (newIsDirty) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    } else {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  },
  { immediate: true }
);

// Vue Router 路由守卫：阻止路由导航离开
onBeforeRouteLeave(async (to, from, next) => {
  if (isDirty.value) {
    const confirmed = await showLeaveConfirmDialog();
    if (confirmed) {
      // 用户确认离开，移除 beforeunload 事件监听
      window.removeEventListener("beforeunload", handleBeforeUnload);
      next();
    } else {
      // 用户取消，阻止导航
      next(false);
    }
  } else {
    next();
  }
});

const categorySelectKey = ref(0);
const tagSelectKey = ref(0);
const updateInitialState = () => {
  initialFormState.title = form.title;
  initialFormState.content_md = form.content_md;
};
const getDraftKey = () => `post_draft_${articleId.value || "new"}`;
const initPage = async () => {
  loading.value = true;
  const id = route.params.id as string;
  try {
    const fetchOptionsPromise = Promise.all([
      getCategoryList(),
      getTagList()
    ]).then(([catRes, tagRes]) => {
      categoryOptions.value = catRes.data;
      tagOptions.value = tagRes.data;
    });
    if (id !== "new") {
      articleId.value = id;
      const { data } = await getArticle(id);
      Object.assign(form, data);
      form.post_category_ids = data.post_categories.map(c => c.id);
      form.post_tag_ids = data.post_tags.map(t => t.id);
      if (!Array.isArray(form.summaries)) {
        form.summaries = [];
      }
    }
    await fetchOptionsPromise;
  } catch (error) {
    ElMessage.error("页面数据加载失败，请重试");
  } finally {
    loading.value = false;
    updateInitialState();
  }
};
const validateName = (name: string, type: "标签"): boolean => {
  const pattern = /^[\u4e00-\u9fa5a-zA-Z0-9_-]{1,30}$/;
  if (!pattern.test(name)) {
    ElMessage.error({
      message: `${type}名 "${name}" 格式不正确。只能包含中英文、数字、下划线或连字符，长度为1-30个字符。`,
      duration: 4000
    });
    return false;
  }
  return true;
};

// 核心改动点：简化此函数，移除处理分类创建的逻辑
const processTagsAndCategories = async () => {
  // 分类 ID 数组现在只包含有效的、已存在的 ID，无需处理
  if (Array.isArray(form.post_tag_ids)) {
    const tagPromises = form.post_tag_ids.map(async item => {
      // 如果 item 已经是 tagOptions 中的一个 id，直接返回
      if (tagOptions.value.some(opt => opt.id === item)) {
        return item;
      }
      // 否则，它是一个新创建的标签名称 (字符串)
      if (!validateName(item, "标签")) {
        throw new Error(`标签名 "${item}" 校验失败`);
      }
      const res = await createTag({ name: item });
      const newTag = res.data;
      tagOptions.value.push(newTag); // 更新前端的 tag 列表
      return newTag.id;
    });
    form.post_tag_ids = await Promise.all(tagPromises);
  }
};

const onSaveHandler = async (markdown: string, sanitizedHtml: string) => {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    await processTagsAndCategories();
    if (!form.title || form.title.trim() === "") {
      ElNotification({
        title: "提交错误",
        message: "文章标题不能为空，请输入标题后再保存。",
        type: "error"
      });
      isSubmitting.value = false;
      return;
    }
    // 处理 ip_location：当为 "未知" 或空值时，传递空字符串触发后端自动获取
    const ipLocationToSubmit =
      !form.ip_location || form.ip_location === "未知" ? "" : form.ip_location;

    const dataToSubmit = {
      ...form,
      content_md: markdown,
      content_html: sanitizedHtml,
      summaries: form.summaries?.filter(s => s && s.trim() !== "") || [],
      ip_location: ipLocationToSubmit // 确保 ip_location 字段总是被传递
    };
    if (isEditMode.value) {
      await updateArticle(articleId.value, dataToSubmit);
      ElMessage.success("更新成功");
    } else {
      const res = await createArticle(dataToSubmit);
      console.log("📦 创建文章API响应:", res);
      console.log("📦 响应数据 res.data:", res.data);
      console.log("📦 文章ID res.data.id:", res.data?.id);
      const newArticleId = res.data?.id;
      console.log("✅ 文章创建成功，ID:", newArticleId);
      ElMessage.success("创建成功");
      localStorage.removeItem(getDraftKey());
      // 立即更新 articleId，避免后续操作认为还在新增模式
      articleId.value = newArticleId;
      console.log(
        "🔄 准备跳转到编辑页面:",
        `/admin/post-management/edit/${newArticleId}`
      );
      // 使用 replace 而不是 push，确保路由真正改变
      await router.replace({ name: "PostEdit", params: { id: newArticleId } });
      console.log("✅ 路由跳转完成");
    }
    localStorage.removeItem(getDraftKey());
    updateInitialState();
    await siteConfigStore.fetchSystemSettings([
      constant.KeySidebarSiteInfoTotalPostCount,
      constant.KeySidebarSiteInfoTotalWordCount
    ]);
  } catch (error) {
    if (!(error instanceof Error && error.message.includes("校验失败"))) {
      ElMessage.error(isEditMode.value ? "更新失败" : "创建失败");
    }
  } finally {
    isSubmitting.value = false;
  }
};
const handleSubmit = (isPublish = false) => {
  if (!form.title || form.title.trim() === "") {
    ElNotification({
      title: "提交错误",
      message: "文章标题不能为空，请输入标题后再保存。",
      type: "error"
    });
    return;
  }
  if (isPublish) {
    form.status = "PUBLISHED";
  } else {
    form.status = "DRAFT";
  }
  editorRef.value?.triggerSave();
};
const handleOpenPublishDialog = () => {
  if (!form.title || form.title.trim() === "") {
    ElNotification({
      title: "操作无效",
      message: "发布前请先填写文章标题。",
      type: "warning"
    });
    return;
  }
  isPublishDialogVisible.value = true;
};
const handleConfirmPublish = () => {
  isPublishDialogVisible.value = false;
  // 不再强制设置状态，使用用户在 PublishDialog 中选择的状态
  editorRef.value?.triggerSave();
};

// 显示历史版本抽屉
const handleShowHistory = () => {
  if (!articleId.value) {
    ElMessage.warning("请先保存文章后再查看历史版本");
    return;
  }
  isHistoryDrawerVisible.value = true;
};

// 从历史版本恢复
const handleRestoreFromHistory = (history: ArticleHistory) => {
  // 使用历史版本的内容替换当前编辑器内容
  form.title = history.title;
  form.content_md = history.content_md;
  form.cover_url = history.cover_url;
  form.top_img_url = history.top_img_url;
  form.primary_color = history.primary_color;
  form.summaries = history.summaries || [];
  form.keywords = history.keywords;

  // 更新初始状态，避免恢复后被认为是脏数据
  updateInitialState();

  ElMessage.success(`已恢复到版本 v${history.version} 的内容`);
};

const handleImageUploadForMdV3 = async (
  files: File[],
  callback: (urls: string[]) => void
) => {
  const loadingInstance = ElMessage.info({
    message: "正在上传图片...",
    duration: 0
  });
  try {
    const urls = await Promise.all(
      files.map(async file => {
        const res = await uploadArticleImage(file);
        const url = res?.data?.url;
        if (!url) {
          throw new Error(`图片 ${file.name} 上传失败: 服务器未返回有效URL`);
        }
        return url;
      })
    );
    callback(urls);
    ElMessage.success("图片上传成功！");
  } catch (error: any) {
    console.error("图片上传失败:", error);
    ElMessage.error(error.message || "图片上传失败，请稍后再试。");
  } finally {
    loadingInstance.close();
  }
};
const handleGoBack = async () => {
  if (isDirty.value) {
    const confirmed = await showLeaveConfirmDialog();
    if (confirmed) {
      router.push({ name: "PostManagement" });
    }
  } else {
    router.push({ name: "PostManagement" });
  }
};

const handleCategoryChange = () => {
  // 这个函数现在可以保留为空，或者用于其他逻辑
  // 主要目的是保留 @change 事件，以触发可能的 re-render
  // 由于我们强制 key 更新，这个函数体不是必须的
};

const handleTagChange = (currentValues: string[]) => {
  const isNewItemAdded = currentValues.some(
    val => !tagOptions.value.some(opt => opt.id === val)
  );
  if (isNewItemAdded) {
    tagSelectKey.value++;
  }
};
const refreshCategories = async () => {
  try {
    const { data } = await getCategoryList();
    categoryOptions.value = data;
    categorySelectKey.value++;
  } catch (error) {
    ElMessage.error("刷新分类列表失败");
  }
};
watch(
  () => [form.title, form.content_md],
  debounce(newData => {
    if (loading.value) return;
    const draft = {
      title: newData[0],
      content_md: newData[1],
      saveTime: new Date().toLocaleString()
    };
    localStorage.setItem(getDraftKey(), JSON.stringify(draft));
  }, 2000),
  { deep: true }
);

// 监听路由参数变化，当从新增模式切换到编辑模式时重新加载
watch(
  () => route.params.id,
  async (newId, oldId) => {
    if (newId && newId !== oldId && newId !== "new") {
      await initPage();
    }
  }
);
onMounted(async () => {
  await initPage();
  wasSidebarOpened = pureApp.getSidebarStatus;
  if (device.value !== "mobile" && pureApp.getSidebarStatus) {
    toggleSideBar();
  }
  const draftKey = getDraftKey();
  const draft = localStorage.getItem(draftKey);
  if (draft) {
    const parsedDraft = JSON.parse(draft);
    ElMessageBox.confirm(
      `检测到您在 ${parsedDraft.saveTime} 有一份未保存的本地草稿，是否恢复？`,
      "发现本地草稿",
      {
        confirmButtonText: "恢复",
        cancelButtonText: "放弃",
        type: "info"
      }
    )
      .then(() => {
        form.title = parsedDraft.title;
        form.content_md = parsedDraft.content_md;
        ElMessage.success("草稿已恢复");
      })
      .catch(() => {
        localStorage.removeItem(draftKey);
        ElMessage.info("已放弃本地草稿");
      });
  }
});
onUnmounted(() => {
  // 移除离开页面提示事件监听
  window.removeEventListener("beforeunload", handleBeforeUnload);

  if (
    device.value !== "mobile" &&
    !pureApp.getSidebarStatus &&
    wasSidebarOpened
  ) {
    toggleSideBar();
  }
});
</script>

<template>
  <div v-loading="loading" class="post-edit-page">
    <header class="post-edit-header">
      <div class="header-left">
        <el-tooltip content="返回列表" placement="bottom" :show-arrow="false">
          <el-button :icon="ArrowLeft" text circle @click="handleGoBack" />
        </el-tooltip>
        <div class="title-container">
          <el-input
            v-model="form.title"
            placeholder="请输入文章标题..."
            class="title-input"
          />
        </div>
      </div>
      <div class="header-right">
        <PostActionButtons
          :is-submitting="isSubmitting"
          :is-edit-mode="isEditMode"
          :status="form.status"
          :post-id="articleId"
          :post-slug="form.abbrlink"
          @save="handleSubmit(false)"
          @publish="handleOpenPublishDialog"
          @show-history="handleShowHistory"
        />
      </div>
    </header>

    <main class="post-edit-main">
      <MarkdownEditor
        ref="editorRef"
        v-model="form.content_md"
        :on-upload-img="handleImageUploadForMdV3"
        @onSave="onSaveHandler"
      />
    </main>

    <PublishDialog
      v-model="isPublishDialogVisible"
      :form="form"
      :category-options="categoryOptions"
      :tag-options="tagOptions"
      :is-submitting="isSubmitting"
      :category-select-key="categorySelectKey"
      :tag-select-key="tagSelectKey"
      @change-category="handleCategoryChange"
      @change-tag="handleTagChange"
      @confirm-publish="handleConfirmPublish"
      @refresh-categories="refreshCategories"
    />

    <!-- 历史版本抽屉 -->
    <ArticleHistoryDrawer
      v-model:visible="isHistoryDrawerVisible"
      :article-id="articleId || ''"
      @restore="handleRestoreFromHistory"
    />

    <!-- 离开确认弹窗 -->
    <Teleport to="body">
      <Transition name="leave-confirm-fade">
        <div
          v-if="showLeaveConfirm"
          class="leave-confirm-overlay"
          @click.self="cancelLeave"
        >
          <div class="leave-confirm-dialog">
            <div class="leave-confirm-icon">
              <svg
                viewBox="0 0 24 24"
                width="32"
                height="32"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div class="leave-confirm-title">离开编辑？</div>
            <div class="leave-confirm-message">未保存的更改将丢失</div>
            <div class="leave-confirm-actions">
              <button class="leave-confirm-btn cancel" @click="cancelLeave">
                继续编辑
              </button>
              <button class="leave-confirm-btn confirm" @click="confirmLeave">
                确定离开
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.post-edit-page {
  display: flex;
  flex-direction: column;
  height: calc(100%);
  background-color: var(--anzhiyu-background);
}

.post-edit-header {
  z-index: 10;
  display: flex;
  flex-shrink: 0;
  gap: 20px;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 20px;
  background-color: var(--el-bg-color-overlay);
  border-bottom: 1px solid var(--el-border-color-light);
}

.header-left,
.header-right {
  display: flex;
  gap: 16px;
  align-items: center;
}

.header-left {
  flex-grow: 1;
  min-width: 0;
}

.header-right {
  flex-shrink: 0;
}

.title-container {
  flex-grow: 1;
  min-width: 0;

  .title-input {
    :deep(.el-input__wrapper) {
      padding: 0;
      font-size: 20px;
      font-weight: 600;
      background: transparent;
      box-shadow: none !important;
    }
  }
}

.post-edit-main {
  flex-grow: 1;
  height: 500px;
  min-height: 0;
  padding: 8px;
  background-color: var(--anzhiyu-card-bg);
}

:deep(.md-editor-preview .md-editor-code .md-editor-code-head) {
  z-index: 99 !important;
}

@media (width <= 768px) {
  .post-edit-page {
    margin: 0;
  }

  .post-edit-header {
    flex-wrap: wrap;
    height: auto;
    padding: 10px;
    gap: 10px;
  }

  .header-left {
    flex: 1;
    flex-grow: 1;
    min-width: 0;
    gap: 12px;

    :deep(.el-button) {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
    }
  }

  .title-container {
    flex: 1;
    min-width: 0;

    .title-input {
      :deep(.el-input__wrapper) {
        font-size: 16px;
      }
    }
  }

  .header-right {
    width: 100%;
    flex-shrink: 0;
    justify-content: flex-end;
  }
}
</style>

<style lang="scss">
// 离开确认弹窗样式
.leave-confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.leave-confirm-dialog {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 90%;
  max-width: 320px;
  padding: 28px 24px 20px;
  text-align: center;
  background: var(--el-bg-color-overlay);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.leave-confirm-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  margin-bottom: 16px;
  color: #faad14;
  background: rgba(250, 173, 20, 0.1);
  border-radius: 50%;
}

.leave-confirm-title {
  margin-bottom: 8px;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.leave-confirm-message {
  margin-bottom: 24px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.leave-confirm-actions {
  display: flex;
  gap: 12px;
  width: 100%;
}

.leave-confirm-btn {
  flex: 1;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  border-radius: 8px;
  transition: all 0.2s ease;

  &.cancel {
    color: var(--el-text-color-primary);
    background: var(--el-fill-color-light);

    &:hover {
      background: var(--el-fill-color);
    }
  }

  &.confirm {
    color: #fff;
    background: #ff4d4f;

    &:hover {
      background: #ff7875;
    }
  }
}

// 弹窗过渡动画
.leave-confirm-fade-enter-active,
.leave-confirm-fade-leave-active {
  transition: opacity 0.2s ease;

  .leave-confirm-dialog {
    transition: transform 0.2s ease;
  }
}

.leave-confirm-fade-enter-from,
.leave-confirm-fade-leave-to {
  opacity: 0;

  .leave-confirm-dialog {
    transform: scale(0.9);
  }
}
</style>
