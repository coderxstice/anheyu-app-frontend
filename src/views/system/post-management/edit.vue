<script setup lang="ts">
import {
  ref,
  reactive,
  onMounted,
  onUnmounted,
  computed,
  watch,
  readonly
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElNotification } from "element-plus";
import { useNav } from "@/layout/hooks/useNav";
import type { FormInstance } from "element-plus";
import type * as Monaco from "monaco-editor";
import type { editor } from "monaco-editor";

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
import { UploadFilled, Plus, Remove } from "@element-plus/icons-vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { constant } from "@/constant";

/**
 * 一个响应式的 Hook，用于获取并监听应用的全局主题 (light/dark)。
 */
function useTheme() {
  const theme = ref<"light" | "dark">(
    document.documentElement.classList.contains("dark") ? "dark" : "light"
  );

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.attributeName === "class") {
        const newTheme = document.documentElement.classList.contains("dark")
          ? "dark"
          : "light";
        if (theme.value !== newTheme) {
          theme.value = newTheme;
        }
      }
    }
  });

  onMounted(() => {
    observer.observe(document.documentElement, { attributes: true });
  });

  onUnmounted(() => {
    observer.disconnect();
  });

  return {
    theme: readonly(theme)
  };
}

defineOptions({ name: "PostEdit" });

const route = useRoute();
const router = useRouter();
const siteConfigStore = useSiteConfigStore();

const { device, pureApp, toggleSideBar } = useNav();
let wasSidebarOpened = pureApp.getSidebarStatus;

const { theme } = useTheme();
const monacoTheme = computed(() =>
  theme.value === "light" ? "vs" : "vs-dark"
);

const isImmersiveFullscreen = ref(false);
const toggleImmersiveFullscreen = () => {
  isImmersiveFullscreen.value = !isImmersiveFullscreen.value;
};

let monaco: typeof Monaco | null = null;
let editorInstance: Monaco.editor.IStandaloneCodeEditor | null = null;
const editorContainerRef = ref<HTMLElement | null>(null);
const isMonacoLoading = ref(false);

const monacoOptions = computed<editor.IStandaloneEditorConstructionOptions>(
  () => ({
    language: "markdown",
    theme: monacoTheme.value,
    automaticLayout: true,
    minimap: { enabled: false },
    wordWrap: "on",
    fontSize: 15,
    scrollBeyondLastLine: false,
    lineNumbers: "on",
    scrollbar: {
      alwaysConsumeMouseWheel: false
    }
  })
);

const formRef = ref<FormInstance>();
const loading = ref(true);
const isSubmitting = ref(false);
const articleId = ref<string | null>(null);

// ▼▼▼ 修改开始 ▼▼▼
const form = reactive<ArticleForm>({
  title: "",
  content_md: "",
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
// ▲▲▲ 修改结束 ▲▲▲

const categoryOptions = ref<PostCategory[]>([]);
const tagOptions = ref<PostTag[]>([]);
const statusOptions = [
  { value: "PUBLISHED", label: "发布" },
  { value: "DRAFT", label: "存为草稿" },
  { value: "ARCHIVED", label: "归档" }
];

const isEditMode = computed(() => !!articleId.value);
const pageTitle = computed(() => (isEditMode.value ? "编辑文章" : "新增文章"));

const categorySelectKey = ref(0);
const tagSelectKey = ref(0);

const addSummaryInput = () => {
  if (!form.summaries) {
    form.summaries = [];
  }
  if (form.summaries.length < 3) {
    form.summaries.push("");
  }
};
const removeSummaryInput = (index: number) => {
  form.summaries.splice(index, 1);
};

const loadMonaco = async () => {
  if (monaco) return;
  isMonacoLoading.value = true;
  try {
    monaco = await import("monaco-editor");
  } catch (error) {
    ElMessage.error("编辑器核心组件加载失败！");
  } finally {
    isMonacoLoading.value = false;
  }
};

const initEditor = (initialContent: string) => {
  if (!editorContainerRef.value || !monaco) return;
  if (editorInstance) editorInstance.dispose();
  editorInstance = monaco.editor.create(editorContainerRef.value, {
    value: initialContent,
    ...monacoOptions.value
  });
  editorInstance.onDidChangeModelContent(() => {
    if (editorInstance) {
      form.content_md = editorInstance.getValue();
    }
  });
};

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
    } else {
      // ▼▼▼ 修改开始 ▼▼▼
      Object.assign(form, {
        title: "",
        content_md: `## 在这里开始你的创作...`,
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
      // ▲▲▲ 修改结束 ▲▲▲
    }

    await fetchOptionsPromise;
    await loadMonaco();
    initEditor(form.content_md);
  } catch (error) {
    ElMessage.error("页面数据加载失败，请重试");
  } finally {
    loading.value = false;
  }
};

/**
 * 校验分类或标签名
 * @param name 名称
 * @param type 类型 "分类" 或 "标签"
 * @returns boolean 是否校验通过
 */
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
      try {
        const res = await createCategory({ name: item });
        const newCategory = res.data;
        categoryOptions.value.push(newCategory);
        return newCategory.id;
      } catch (error) {
        ElMessage.error(`创建分类 "${item}" 失败`);
        throw error;
      }
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
      try {
        const res = await createTag({ name: item });
        const newTag = res.data;
        tagOptions.value.push(newTag);
        return newTag.id;
      } catch (error) {
        ElMessage.error(`创建标签 "${item}" 失败`);
        throw error;
      }
    });
    form.post_tag_ids = await Promise.all(tagPromises);
  }
};

const handleSubmit = async (isPublish = false) => {
  if (!form.title || form.title.trim() === "") {
    ElNotification({
      title: "提交错误",
      message: "文章标题不能为空，请输入标题后再保存。",
      type: "error",
      duration: 3000
    });
    return;
  }

  await formRef.value.validate(async valid => {
    if (valid) {
      isSubmitting.value = true;
      try {
        await processTagsAndCategories();

        if (isPublish) {
          form.status = "PUBLISHED";
        }

        const dataToSubmit = {
          ...form,
          summaries: form.summaries?.filter(s => s && s.trim() !== "")
        };

        if (isEditMode.value) {
          await updateArticle(articleId.value, dataToSubmit);
          ElMessage.success("更新成功");
        } else {
          await createArticle(dataToSubmit);
          ElMessage.success("创建成功");
        }

        const keysToRefetch = [
          constant.KeySidebarSiteInfoTotalPostCount,
          constant.KeySidebarSiteInfoTotalWordCount
        ];

        await siteConfigStore.fetchSystemSettings(keysToRefetch);
        console.log("站点统计信息已从后端同步。");

        router.push({ name: "PostManagement" });
      } catch (error) {
        if (!(error instanceof Error && error.message.includes("校验失败"))) {
          ElMessage.error(isEditMode.value ? "更新失败" : "创建失败");
        }
      } finally {
        isSubmitting.value = false;
      }
    }
  });
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
  if (editorInstance) editorInstance.dispose();
  if (
    device.value !== "mobile" &&
    !pureApp.getSidebarStatus &&
    wasSidebarOpened
  ) {
    toggleSideBar();
  }
});

watch(monacoTheme, newTheme => {
  monaco?.editor.setTheme(newTheme);
});

watch(
  () => form.content_md,
  newValue => {
    if (editorInstance && newValue !== editorInstance.getValue()) {
      editorInstance.setValue(newValue);
    }
  }
);
</script>

<template>
  <div
    v-loading="loading"
    class="post-edit-container"
    :class="{ 'is-fullscreen-mode': isImmersiveFullscreen }"
  >
    <el-form ref="formRef" :model="form" label-position="top">
      <el-row :gutter="20">
        <el-col :lg="18" :md="16" class="left-panel">
          <el-card shadow="never" class="content-card">
            <template #header>
              <div class="content-card-header">
                <el-form-item prop="title" class="title-form-item">
                  <el-input
                    v-model="form.title"
                    placeholder="请输入文章标题..."
                    size="large"
                    class="title-input"
                  />
                </el-form-item>
                <div class="header-actions">
                  <el-tooltip
                    :content="
                      isImmersiveFullscreen ? '退出沉浸模式' : '沉浸模式'
                    "
                    placement="bottom"
                  >
                    <el-button
                      link
                      class="action-btn"
                      @click="toggleImmersiveFullscreen"
                    >
                      <IconifyIconOnline
                        :icon="
                          isImmersiveFullscreen
                            ? 'ant-design:fullscreen-exit-outlined'
                            : 'ant-design:fullscreen-outlined'
                        "
                      />
                    </el-button>
                  </el-tooltip>
                  <span class="editor-type-label">Markdown</span>
                </div>
              </div>
            </template>
            <div v-loading="isMonacoLoading" class="editor-wrapper">
              <div ref="editorContainerRef" class="editor-container" />
            </div>
          </el-card>
        </el-col>

        <el-col :lg="6" :md="8" class="right-panel">
          <el-card shadow="never" class="form-card action-card">
            <template #header>
              <div class="card-header">
                <el-icon><UploadFilled /></el-icon>
                <span>操作</span>
              </div>
            </template>
            <div class="actions">
              <el-button :loading="isSubmitting" @click="handleSubmit(false)"
                >保存草稿</el-button
              >
              <el-button
                type="primary"
                :loading="isSubmitting"
                @click="handleSubmit(true)"
              >
                {{
                  isEditMode && form.status === "PUBLISHED"
                    ? "更新发布"
                    : "直接发布"
                }}
              </el-button>
            </div>
            <el-divider />
            <el-button class="go-back-btn" @click="handleGoBack"
              >返回列表</el-button
            >
          </el-card>

          <el-card shadow="never" class="form-card">
            <template #header>
              <div class="card-header">
                <IconifyIconOnline icon="ep:setting" />
                <span>发布设置</span>
              </div>
            </template>
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status" class="status-radio-group">
                <el-radio-button
                  v-for="item in statusOptions"
                  :key="item.value"
                  :value="item.value"
                  >{{ item.label }}</el-radio-button
                >
              </el-radio-group>
            </el-form-item>
            <el-form-item label="分类" prop="post_category_ids">
              <el-select
                :key="categorySelectKey"
                v-model="form.post_category_ids"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="选择或创建分类 (最多3个)"
                style="width: 100%"
                no-data-text="输入名称后按回车键创建"
                :multiple-limit="3"
                @change="handleCategoryChange"
              >
                <el-option
                  v-for="item in categoryOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="标签" prop="post_tag_ids">
              <el-select
                :key="tagSelectKey"
                v-model="form.post_tag_ids"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="选择或创建标签"
                style="width: 100%"
                no-data-text="输入名称后按回车键创建"
                @change="handleTagChange"
              >
                <el-option
                  v-for="item in tagOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="首页推荐排序">
              <el-input-number
                v-model="form.home_sort"
                :min="0"
                controls-position="right"
                style="width: 100%"
                placeholder="0"
              />
              <div class="form-item-help">
                0则不推荐, >0则推荐, 值越小越靠前
              </div>
            </el-form-item>
            <el-form-item label="文章置顶排序">
              <el-input-number
                v-model="form.pin_sort"
                :min="0"
                controls-position="right"
                style="width: 100%"
                placeholder="0"
              />
              <div class="form-item-help">
                0则不置顶, >0则置顶, 值越小越靠前
              </div>
            </el-form-item>
            <el-form-item label="IP 属地 (可选)" prop="ip_location">
              <el-input
                v-model="form.ip_location"
                placeholder="留空则自动获取"
              />
            </el-form-item>
          </el-card>

          <el-card shadow="never" class="form-card">
            <template #header>
              <div class="card-header">
                <IconifyIconOnline icon="ep:postcard" />
                <span>高级设置</span>
              </div>
            </template>
            <el-form-item label="自定义永久链接 (可选)" prop="abbrlink">
              <el-input
                v-model="form.abbrlink"
                placeholder="例如: my-awesome-post"
              />
              <div class="form-item-help">
                必须唯一，用于生成更友好的URL。留空则自动生成。
              </div>
            </el-form-item>
            <el-form-item label="显示文章版权">
              <el-switch v-model="form.copyright" />
            </el-form-item>
            <div v-if="form.copyright">
              <el-form-item label="版权作者 (可选)" prop="copyright_author">
                <el-input
                  v-model="form.copyright_author"
                  placeholder="留空则使用站点默认作者"
                />
                <div class="form-item-help">
                  如果此值与【系统设置】-> 【前台设置】 -> 【首页配置】->
                  【网站拥有者名称】不同，则在文章页内会显示为【转载】文章。
                </div>
              </el-form-item>
              <el-form-item
                label="版权作者链接 (可选)"
                prop="copyright_author_href"
              >
                <el-input
                  v-model="form.copyright_author_href"
                  placeholder="https://..."
                />
              </el-form-item>
              <el-form-item label="版权来源链接 (可选)" prop="copyright_url">
                <el-input
                  v-model="form.copyright_url"
                  placeholder="转载文章的原始链接"
                />
              </el-form-item>
            </div>
          </el-card>
          <el-card shadow="never" class="form-card">
            <template #header>
              <div class="card-header">
                <IconifyIconOnline icon="clarity:image-gallery-line" />
                <span>媒体与摘要</span>
              </div>
            </template>
            <el-form-item label="手动指定主色调">
              <el-switch v-model="form.is_primary_color_manual" />
            </el-form-item>
            <el-form-item
              v-if="form.is_primary_color_manual"
              label="主色调"
              prop="primary_color"
            >
              <div class="primary-color-display">
                <span
                  v-if="form.primary_color"
                  class="color-swatch"
                  :style="{ backgroundColor: form.primary_color }"
                />
                <el-input
                  v-model="form.primary_color"
                  placeholder="请输入十六进制色值, 如 #ff6600"
                />
              </div>
            </el-form-item>
            <el-form-item
              v-else-if="!form.is_primary_color_manual && form.primary_color"
              label="主色调 (自动获取)"
            >
              <div class="primary-color-display">
                <span
                  class="color-swatch"
                  :style="{ backgroundColor: form.primary_color }"
                />
                <el-input v-model="form.primary_color" readonly />
              </div>
              <div class="form-item-help">
                由封面图自动提取，保存文章后更新。
              </div>
            </el-form-item>
            <el-form-item label="封面图 URL" prop="cover_url">
              <el-input v-model="form.cover_url" placeholder="https://..." />
            </el-form-item>
            <el-form-item label="顶部大图 URL (可选)" prop="top_img_url">
              <el-input v-model="form.top_img_url" placeholder="https://..." />
              <div class="form-item-help">
                若不填, 保存时将自动使用上方封面图的URL
              </div>
            </el-form-item>
            <el-form-item label="摘要" prop="summaries">
              <div
                v-for="(summary, index) in form.summaries"
                :key="index"
                class="summary-item"
              >
                <el-input
                  v-model="form.summaries[index]"
                  placeholder="请输入单行摘要..."
                />
                <el-button
                  :icon="Remove"
                  type="danger"
                  circle
                  plain
                  @click="removeSummaryInput(index)"
                />
              </div>
              <el-button
                v-if="!form.summaries || form.summaries.length < 3"
                :icon="Plus"
                type="primary"
                plain
                style="width: 100%"
                @click="addSummaryInput"
              >
                新增摘要 ({{ form.summaries?.length || 0 }}/3)
              </el-button>
            </el-form-item>
          </el-card>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>

<style lang="scss" scoped>
.post-edit-container {
  padding: 20px;
  background-color: var(--el-bg-color-page);
  min-height: calc(100vh - 88px);
  transition: background-color 0.3s;
}

.form-card,
.content-card {
  margin-bottom: 20px;
  border-radius: 8px;
  background-color: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  transition: all 0.3s ease-in-out;

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 16px;
    color: var(--el-text-color-primary);
  }

  :deep(.el-form-item__label) {
    color: var(--el-text-color-regular);
    margin-bottom: 4px !important;
  }
}

.form-item-help {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  margin-top: 4px;
}

.primary-color-display {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.color-swatch {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color);
  flex-shrink: 0;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin-bottom: 8px;

  .el-input {
    flex-grow: 1;
  }
}

.content-card {
  height: calc(100vh - 88px - 40px);
  display: flex;
  flex-direction: column;

  :deep(.el-card__header) {
    padding: 10px 20px;
    flex-shrink: 0;
  }
  .content-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .title-form-item {
    flex-grow: 1;
    margin-bottom: 0 !important;
  }
  .title-input {
    :deep(.el-input__wrapper) {
      box-shadow: none !important;
      background-color: transparent;
      padding: 0;
    }
    :deep(.el-input__inner) {
      font-size: 20px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }
  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    margin-left: 16px;
  }
  .action-btn {
    font-size: 18px;
    color: var(--el-text-color-secondary);
    &:hover {
      color: var(--el-text-color-primary);
    }
  }
  .editor-type-label {
    font-size: 14px;
    color: var(--el-text-color-placeholder);
    user-select: none;
  }

  :deep(.el-card__body) {
    padding: 0;
    flex-grow: 1;
    min-height: 0;
  }
}

.editor-wrapper {
  width: 100%;
  height: 100%;
}
.editor-container {
  width: 100%;
  height: 100%;
}
.action-card {
  .actions {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    .el-button {
      flex: 1;
    }
  }
  .go-back-btn {
    width: 100%;
  }
}

.status-radio-group {
  width: 100%;
  :deep(.el-radio-button) {
    width: calc(100% / 3);
    .el-radio-button__inner {
      width: 100%;
      border-radius: 0;
      border-left: 0;
      background: var(--el-fill-color-blank);
      box-shadow: none !important;
      transition:
        background-color 0.3s,
        color 0.3s,
        border-color 0.3s;
    }
    &:first-child .el-radio-button__inner {
      border-left: 1px solid var(--el-border-color);
      border-top-left-radius: var(--el-border-radius-base);
      border-bottom-left-radius: var(--el-border-radius-base);
    }
    &:last-child .el-radio-button__inner {
      border-top-right-radius: var(--el-border-radius-base);
      border-bottom-right-radius: var(--el-border-radius-base);
    }

    &.is-active .el-radio-button__inner {
      background: var(--el-color-primary);
      color: var(--el-color-white);
      border-color: var(--el-color-primary);
    }
  }
}

.post-edit-container.is-fullscreen-mode {
  padding: 0;

  .left-panel {
    width: 100%;
    padding: 0 !important;
    flex: 1;
    max-width: 100%;
  }

  .right-panel {
    display: none;
  }

  .content-card {
    margin: 0;
    border-radius: 0;
    border: none;
    height: 100vh;
  }
}

@media (max-width: 992px) {
  .post-edit-container {
    padding: 0;
  }
  .left-panel,
  .right-panel {
    width: 100%;
    max-width: 100%;
    padding: 0 !important;
  }
  .content-card {
    height: auto;
    margin-bottom: 0;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
  .editor-wrapper {
    height: 500px;
  }
  .form-card {
    border-radius: 0;
    border-left: none;
    border-right: none;
    margin-bottom: 10px;
  }
  .form-card:first-of-type {
    margin-top: 10px;
  }
}

@media (max-width: 768px) {
  .content-card .editor-type-label {
    display: none;
  }
}
</style>
