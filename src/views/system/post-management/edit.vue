<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElNotification } from "element-plus";
import { ArrowLeft } from "@element-plus/icons-vue";
import type { FormInstance } from "element-plus";

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
  createTag
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

const categoryOptions = ref<PostCategory[]>([]);
const tagOptions = ref<PostTag[]>([]);

const isEditMode = computed(() => !!articleId.value);
const pageTitle = computed(() => (isEditMode.value ? "编辑文章" : "新增文章"));

const categorySelectKey = ref(0);
const tagSelectKey = ref(0);

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

const handleSubmit = async (isPublish = false) => {
  if (!form.title || form.title.trim() === "") {
    ElNotification({
      title: "提交错误",
      message: "文章标题不能为空，请输入标题后再保存。",
      type: "error"
    });
    return;
  }

  isSubmitting.value = true;
  try {
    await processTagsAndCategories();

    if (isPublish) {
      form.status = "PUBLISHED";
    } else {
      if (form.status === "PUBLISHED") {
        form.status = "DRAFT";
      }
    }

    const dataToSubmit = {
      ...form,
      summaries: form.summaries?.filter(s => s && s.trim() !== "")
    };

    if (isEditMode.value) {
      await updateArticle(articleId.value, dataToSubmit);
      ElMessage.success("更新成功");
    } else {
      const res = await createArticle(dataToSubmit);
      ElMessage.success("创建成功");
      // 创建成功后跳转到编辑页
      router.push({ name: "PostEdit", params: { id: res.data.id } });
    }

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

const handleGoBack = () => {
  router.push({ name: "PostManagement" });
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

onMounted(() => {
  initPage();
  wasSidebarOpened = pureApp.getSidebarStatus;
  if (device.value !== "mobile" && pureApp.getSidebarStatus) {
    toggleSideBar();
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
      <MarkdownEditor v-model="form.content_md" height="100%" />
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
