<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import type * as Monaco from "monaco-editor";
import type { editor } from "monaco-editor";

import {
  getArticle,
  createArticle,
  updateArticle,
  getCategoryList,
  getTagList
} from "@/api/post";
import type { ArticleForm, PostCategory, PostTag } from "@/api/post/type";
import { Document, UploadFilled } from "@element-plus/icons-vue";

// 假设这是您项目中用于主题切换的 Hook
// import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";

defineOptions({
  name: "PostEdit"
});

const route = useRoute();
const router = useRouter();

// 主题适配 (模拟)
const dataTheme = ref("dark");
const monacoTheme = computed(() =>
  dataTheme.value === "light" ? "vs" : "vs-dark"
);

// Monaco Editor
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
    lineNumbers: "on"
  })
);

// 表单与页面状态
const formRef = ref<FormInstance>();
const loading = ref(true);
const isSubmitting = ref(false);
const articleId = ref<string | null>(null);

const form = reactive<ArticleForm>({
  title: "",
  content_md: "",
  summary: "",
  cover_url: "",
  ip_location: "",
  status: "DRAFT",
  post_tag_ids: [],
  post_category_ids: []
});

const categoryOptions = ref<PostCategory[]>([]);
const tagOptions = ref<PostTag[]>([]);
const statusOptions = [
  { value: "PUBLISHED", label: "发布" },
  { value: "DRAFT", label: "存为草稿" },
  { value: "ARCHIVED", label: "归档" }
];

const isEditMode = computed(() => !!articleId.value);
const pageTitle = computed(() => (isEditMode.value ? "编辑文章" : "新增文章"));

const rules = reactive<FormRules>({
  title: [{ required: true, message: "请输入文章标题", trigger: "blur" }]
});

// 核心函数
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
    } else {
      form.content_md = `## ${pageTitle.value}\n\n在这里开始你的创作...`;
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

const handleSubmit = async (isPublish = false) => {
  if (isPublish) {
    form.status = "PUBLISHED";
  }
  await formRef.value.validate(async valid => {
    if (valid) {
      isSubmitting.value = true;
      try {
        if (isEditMode.value) {
          await updateArticle(articleId.value, form);
          ElMessage.success("更新成功");
        } else {
          await createArticle(form);
          ElMessage.success("创建成功");
        }
        router.push({ name: "PostManagement" });
      } catch (error) {
        ElMessage.error(isEditMode.value ? "更新失败" : "创建失败");
      } finally {
        isSubmitting.value = false;
      }
    }
  });
};

const handleGoBack = () => {
  router.push({ name: "PostManagement" });
};

// 生命周期
onMounted(() => {
  initPage();
});

onUnmounted(() => {
  if (editorInstance) editorInstance.dispose();
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
  <div v-loading="loading" class="post-edit-container">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-row :gutter="20">
        <!-- 左侧：沉浸式内容创作区 -->
        <el-col :lg="18" :md="16">
          <el-card shadow="never" class="content-card">
            <template #header>
              <div class="card-header">
                <IconifyIconOnline icon="fluent:code-text-20-regular" />
                <span>内容创作 (Markdown)</span>
              </div>
            </template>
            <div v-loading="isMonacoLoading" class="editor-wrapper">
              <div ref="editorContainerRef" class="editor-container" />
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：多功能配置栏 -->
        <el-col :lg="6" :md="8">
          <!-- 卡片一：发布操作栏 -->
          <el-card shadow="never" class="form-card action-card">
            <template #header>
              <div class="card-header">
                <el-icon><UploadFilled /></el-icon>
                <span>操作</span>
              </div>
            </template>
            <div class="actions">
              <el-button @click="handleSubmit(false)">保存草稿</el-button>
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

          <!-- 卡片二：基本信息 -->
          <el-card shadow="never" class="form-card">
            <template #header>
              <div class="card-header">
                <el-icon><Document /></el-icon>
                <span>基本信息</span>
              </div>
            </template>
            <el-form-item label="文章标题" prop="title">
              <el-input v-model="form.title" placeholder="请输入文章标题" />
            </el-form-item>
          </el-card>

          <!-- 卡片三：发布设置 -->
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
                  :label="item.value"
                  >{{ item.label }}</el-radio-button
                >
              </el-radio-group>
            </el-form-item>
            <el-form-item label="分类" prop="post_category_ids">
              <el-select
                v-model="form.post_category_ids"
                multiple
                filterable
                placeholder="选择分类"
                style="width: 100%"
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
                v-model="form.post_tag_ids"
                multiple
                filterable
                placeholder="选择标签"
                style="width: 100%"
              >
                <el-option
                  v-for="item in tagOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="IP 属地 (可选)" prop="ip_location">
              <el-input
                v-model="form.ip_location"
                placeholder="留空则自动获取"
              />
            </el-form-item>
          </el-card>

          <!-- 卡片四：媒体与摘要 -->
          <el-card shadow="never" class="form-card">
            <template #header>
              <div class="card-header">
                <IconifyIconOnline icon="clarity:image-gallery-line" />
                <span>媒体与摘要</span>
              </div>
            </template>
            <el-form-item label="封面图 URL" prop="cover_url">
              <el-input v-model="form.cover_url" placeholder="https://..." />
            </el-form-item>
            <el-form-item label="摘要" prop="summary">
              <el-input
                v-model="form.summary"
                type="textarea"
                :rows="5"
                placeholder="文章摘要..."
              />
            </el-form-item>
          </el-card>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>

<style lang="scss" scoped>
.post-edit-container {
  background-color: var(--el-bg-color-page);
  min-height: calc(100vh - 88px);
  transition: background-color 0.3s;
}

.form-card,
.content-card {
  margin-bottom: 20px;
  border-radius: 8px;
  background-color: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  transition:
    background-color 0.3s,
    border-color 0.3s;

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

.content-card {
  height: calc(100vh - 88px - 40px);
  display: flex;
  flex-direction: column;

  :deep(.el-card__body) {
    padding: 0;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }
}

.editor-wrapper {
  width: 100%;
  flex-grow: 1;
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
</style>
