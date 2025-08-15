<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElNotification, ElMessageBox } from "element-plus";
import { ArrowLeft } from "@element-plus/icons-vue";
import { debounce } from "lodash-es";
import type { FormInstance } from "element-plus";
import type { ExposeParam } from "md-editor-v3";

import MarkdownEditor from "@/components/MarkdownEditor/index.vue";
import PostActionButtons from "./components/PostActionButtons.vue";
import PostSettingsDrawer from "./components/PostSettingsDrawer.vue";

import { useNav } from "@/layout/hooks/useNav";
import {
  getArticle,
  createArticle,
  updateArticle,
  getCategoryList,
  getTagList,
  createCategory,
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
const isSettingsDrawerVisible = ref(false);

const form = reactive<ArticleForm>({
  title: "",
  content_md: "## 在这里开始你的创作...",
  cover_url: "",
  ip_location: "",
  status: "DRAFT",
  post_tag_ids: [],
  post_category_ids: [],
  home_sort: 0,
  pin_sort: 0,
  top_img_url: "",
  summaries: [],
  primary_color: "",
  is_primary_color_manual: false,
  abbrlink: "",
  copyright: true,
  copyright_author: "",
  copyright_author_href: "",
  copyright_url: ""
});

// ... 其他代码保持不变，直到 handleSubmit ...
const initialFormState = reactive({
  title: "",
  content_md: ""
});
const categoryOptions = ref<PostCategory[]>([]);
const tagOptions = ref<PostTag[]>([]);
const isEditMode = computed(() => !!articleId.value);
const pageTitle = computed(() => (isEditMode.value ? "编辑文章" : "新增文章"));
const isDirty = computed(() => {
  return (
    form.title !== initialFormState.title ||
    form.content_md !== initialFormState.content_md
  );
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
const validateName = (name: string, type: "分类" | "标签"): boolean => {
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
const processTagsAndCategories = async () => {
  if (Array.isArray(form.post_category_ids)) {
    const categoryPromises = form.post_category_ids.map(async item => {
      if (categoryOptions.value.some(opt => opt.id === item)) {
        return item;
      }
      if (!validateName(item, "分类")) {
        throw new Error(`分类名 "${item}" 校验失败`);
      }
      const res = await createCategory({ name: item });
      const newCategory = res.data;
      categoryOptions.value.push(newCategory);
      return newCategory.id;
    });
    form.post_category_ids = await Promise.all(categoryPromises);
  }
  if (Array.isArray(form.post_tag_ids)) {
    const tagPromises = form.post_tag_ids.map(async item => {
      if (tagOptions.value.some(opt => opt.id === item)) {
        return item;
      }
      if (!validateName(item, "标签")) {
        throw new Error(`标签名 "${item}" 校验失败`);
      }
      const res = await createTag({ name: item });
      const newTag = res.data;
      tagOptions.value.push(newTag);
      return newTag.id;
    });
    form.post_tag_ids = await Promise.all(tagPromises);
  }
};

// ⭐ 3. 提交逻辑被移动到 onSave 事件处理器中
const onSaveHandler = async (markdown: string, sanitizedHtml: string) => {
  if (isSubmitting.value) return;
  isSubmitting.value = true;

  try {
    // 不再需要等待 Promise，直接使用 sanitizedHtml
    // const generatedHtml = await htmlPromise; // <--- 删除这一行

    await processTagsAndCategories();

    const dataToSubmit = {
      ...form,
      content_md: markdown,
      // 直接使用处理后的 HTML
      content_html: sanitizedHtml,
      summaries: form.summaries?.filter(s => s && s.trim() !== "")
    };

    // 【日志】在发送给后端之前，打印最终的数据包
    console.log("[关卡 B] 准备发送给后端的数据包:", dataToSubmit);
    console.log(
      "[关卡 B] 其中 content_html 的内容是:",
      dataToSubmit.content_html
    );

    if (isEditMode.value) {
      await updateArticle(articleId.value, dataToSubmit);
      ElMessage.success("更新成功");
    } else {
      const res = await createArticle(dataToSubmit);
      ElMessage.success("创建成功");
      localStorage.removeItem(getDraftKey());
      router.push({ name: "PostEdit", params: { id: res.data.id } });
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

// ⭐ 4. handleSubmit 现在只负责校验和触发保存
const handleSubmit = (isPublish = false) => {
  if (!form.title || form.title.trim() === "") {
    ElNotification({
      title: "提交错误",
      message: "文章标题不能为空，请输入标题后再保存。",
      type: "error"
    });
    return;
  }

  // 更新文章状态
  if (isPublish) {
    form.status = "PUBLISHED";
  } else {
    // 如果文章已经是发布状态，但这次点击的是“存为草稿”，则将其状态改回草稿
    if (form.status === "PUBLISHED") {
      form.status = "DRAFT";
    }
  }

  // 以编程方式触发编辑器的 onSave 事件
  editorRef.value?.triggerSave();
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

const handleGoBack = () => {
  if (isDirty.value) {
    ElMessageBox.confirm(
      "您有未保存的更改，确定要离开吗？所有未保存的更改都将丢失。",
      "警告",
      {
        confirmButtonText: "确定离开",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(() => {
        router.push({ name: "PostManagement" });
      })
      .catch(() => {
        ElMessage.info("已取消离开");
      });
  } else {
    router.push({ name: "PostManagement" });
  }
};

const handleCategoryChange = (currentValues: string[]) => {
  const isNewItemAdded = currentValues.some(
    val => !categoryOptions.value.some(opt => opt.id === val)
  );
  if (isNewItemAdded) {
    categorySelectKey.value++;
  }
};
const handleTagChange = (currentValues: string[]) => {
  const isNewItemAdded = currentValues.some(
    val => !tagOptions.value.some(opt => opt.id === val)
  );
  if (isNewItemAdded) {
    tagSelectKey.value++;
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
        <el-tooltip content="返回列表" placement="bottom">
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
          @save="handleSubmit(false)"
          @publish="handleSubmit(true)"
          @open-settings="isSettingsDrawerVisible = true"
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

    <PostSettingsDrawer
      :key="categorySelectKey || tagSelectKey"
      v-model="isSettingsDrawerVisible"
      :form="form"
      :category-options="categoryOptions"
      :tag-options="tagOptions"
      @change-category="handleCategoryChange"
      @change-tag="handleTagChange"
    />
  </div>
</template>

<style lang="scss" scoped>
.post-edit-page {
  display: flex;
  flex-direction: column;
  height: calc(100%);
  background-color: var(--el-bg-color-page);
}

.post-edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background-color: var(--el-bg-color-overlay);
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
  height: 64px;
  z-index: 10;
  gap: 20px;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
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
      box-shadow: none !important;
      background: transparent;
      padding: 0;
      font-size: 20px;
      font-weight: 600;
    }
  }
}

.post-edit-main {
  flex-grow: 1;
  min-height: 0;
  background-color: var(--el-bg-color);
  padding: 8px;
}
:deep(.md-editor-preview .md-editor-code .md-editor-code-head) {
  z-index: 99 !important;
}

@media (max-width: 768px) {
  .post-edit-page {
    margin: 0;
  }
  .post-edit-header {
    flex-wrap: wrap;
    height: auto;
    padding: 10px;
  }
  .title-container {
    order: -1;
    width: 100%;
    margin: 0 0 10px 0;
  }
  .header-left {
    flex-grow: 0;
  }
}
</style>
