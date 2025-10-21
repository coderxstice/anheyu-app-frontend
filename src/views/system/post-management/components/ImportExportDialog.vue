<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Upload, Download, UploadFilled } from "@element-plus/icons-vue";
import type { UploadProps, UploadFile } from "element-plus";
import { exportArticles, importArticles } from "@/api/post";
import type {
  ImportArticleOptions,
  ImportArticleResult
} from "@/api/post/type";
import AnDialog from "@/components/AnDialog/index.vue";

defineOptions({
  name: "ImportExportDialog"
});

interface Props {
  modelValue: boolean;
  selectedIds: string[]; // 选中的文章ID列表
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  selectedIds: () => []
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});

// 是否显示导出标签页（只有选中了文章才显示）
const showExportTab = computed(() => props.selectedIds.length > 0);

// 弹窗标题
const dialogTitle = computed(() =>
  showExportTab.value ? "文章导入导出" : "文章导入"
);

const activeTab = ref<"export" | "import">("export");

// 监听弹窗打开，根据是否有选中文章设置默认标签页
watch(
  () => props.modelValue,
  isOpen => {
    if (isOpen) {
      activeTab.value = showExportTab.value ? "export" : "import";
    }
  }
);
const exporting = ref(false);
const importing = ref(false);
const uploadFileList = ref<UploadFile[]>([]);

// 导入选项
const importOptions = reactive<ImportArticleOptions>({
  create_categories: true,
  create_tags: true,
  skip_existing: true,
  default_status: "DRAFT"
});

// 导出文章
const handleExport = async () => {
  if (props.selectedIds.length === 0) {
    ElMessage.warning("请至少选择一篇文章进行导出");
    return;
  }

  try {
    exporting.value = true;
    const blob = await exportArticles(props.selectedIds);

    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    link.download = `articles_export_${timestamp}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    ElMessage.success(`成功导出 ${props.selectedIds.length} 篇文章`);
    dialogVisible.value = false;
  } catch (error: any) {
    console.error("导出失败:", error);
    ElMessage.error(error.message || "导出文章失败");
  } finally {
    exporting.value = false;
  }
};

// 文件上传前的验证
const beforeUpload: UploadProps["beforeUpload"] = file => {
  const allowedTypes = [
    "application/json",
    "application/zip",
    "application/x-zip-compressed"
  ];
  const isAllowed =
    allowedTypes.includes(file.type) ||
    file.name.endsWith(".json") ||
    file.name.endsWith(".zip");

  if (!isAllowed) {
    ElMessage.error("只支持 .json 和 .zip 格式的文件");
    return false;
  }

  const isLt50M = file.size / 1024 / 1024 < 50;
  if (!isLt50M) {
    ElMessage.error("文件大小不能超过 50MB");
    return false;
  }

  return true;
};

// 手动上传
const handleFileChange: UploadProps["onChange"] = file => {
  uploadFileList.value = [file];
};

// 移除文件
const handleRemove: UploadProps["onRemove"] = () => {
  uploadFileList.value = [];
};

// 导入文章
const handleImport = async () => {
  if (uploadFileList.value.length === 0) {
    ElMessage.warning("请选择要导入的文件");
    return;
  }

  const file = uploadFileList.value[0].raw;
  if (!file) {
    ElMessage.error("无效的文件");
    return;
  }

  try {
    importing.value = true;
    const { data } = await importArticles(file, importOptions);

    // 显示导入结果
    const result = data as ImportArticleResult;
    const messages = [
      `总计: ${result.total_count} 篇`,
      `成功: ${result.success_count} 篇`,
      `跳过: ${result.skipped_count} 篇`,
      `失败: ${result.failed_count} 篇`
    ];

    if (result.error_messages && result.error_messages.length > 0) {
      messages.push("\n错误信息:");
      messages.push(...result.error_messages.slice(0, 5));
      if (result.error_messages.length > 5) {
        messages.push(`...还有 ${result.error_messages.length - 5} 条错误`);
      }
    }

    ElMessageBox.alert(messages.join("\n"), "导入完成", {
      confirmButtonText: "确定",
      type: result.failed_count > 0 ? "warning" : "success",
      callback: () => {
        emit("success");
        dialogVisible.value = false;
        uploadFileList.value = [];
      }
    });
  } catch (error: any) {
    console.error("导入失败:", error);
    ElMessage.error(error.message || "导入文章失败");
  } finally {
    importing.value = false;
  }
};

const handleClose = () => {
  uploadFileList.value = [];
  dialogVisible.value = false;
};
</script>

<template>
  <AnDialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="680px"
    max-width="95vw"
    max-height="90vh"
    :close-on-click-modal="false"
    hide-footer
    @close="handleClose"
  >
    <el-tabs v-model="activeTab" class="import-export-tabs">
      <!-- 导出标签页（只有选中了文章才显示） -->
      <el-tab-pane v-if="showExportTab" label="导出文章" name="export">
        <div class="export-container">
          <el-alert
            title="导出说明"
            type="info"
            :closable="false"
            show-icon
            class="mb-4"
          >
            <template #default>
              <p>• 将导出选中的文章为 ZIP 压缩包</p>
              <p>• 包含文章的 JSON 数据和 Markdown 文件</p>
              <p>• 支持跨系统导入，保留文章所有信息</p>
            </template>
          </el-alert>

          <div class="export-info">
            <el-statistic title="已选择文章数" :value="selectedIds.length">
              <template #prefix>
                <IconifyIconOnline icon="ep:document" />
              </template>
            </el-statistic>
          </div>

          <div class="export-actions">
            <el-button
              :disabled="selectedIds.length === 0"
              :loading="exporting"
              type="primary"
              :icon="Download"
              size="large"
              class="export-btn"
              @click="handleExport"
            >
              {{ exporting ? "导出中..." : "开始导出" }}
            </el-button>
          </div>
        </div>
      </el-tab-pane>

      <!-- 导入标签页 -->
      <el-tab-pane label="导入文章" name="import">
        <div class="import-container">
          <el-alert
            title="导入说明"
            type="info"
            :closable="false"
            show-icon
            class="mb-4"
          >
            <template #default>
              <p>• 支持导入 JSON 或 ZIP 格式的文章数据</p>
              <p>• 可自动创建不存在的分类和标签</p>
              <p>• 已存在的文章（相同标题）将被跳过</p>
            </template>
          </el-alert>

          <!-- 文件上传 -->
          <div class="upload-section">
            <el-upload
              v-model:file-list="uploadFileList"
              class="upload-area"
              drag
              :auto-upload="false"
              :limit="1"
              :before-upload="beforeUpload"
              :on-change="handleFileChange"
              :on-remove="handleRemove"
              accept=".json,.zip"
            >
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">
                将文件拖到此处，或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  仅支持 .json 和 .zip 格式，文件大小不超过 50MB
                </div>
              </template>
            </el-upload>
          </div>

          <!-- 导入选项 -->
          <div class="import-options">
            <el-form label-width="140px" label-position="left">
              <el-form-item label="自动创建分类">
                <el-switch v-model="importOptions.create_categories" />
                <span class="option-tip">不存在的分类将自动创建</span>
              </el-form-item>

              <el-form-item label="自动创建标签">
                <el-switch v-model="importOptions.create_tags" />
                <span class="option-tip">不存在的标签将自动创建</span>
              </el-form-item>

              <el-form-item label="跳过已存在文章">
                <el-switch v-model="importOptions.skip_existing" />
                <span class="option-tip">标题相同的文章将被跳过</span>
              </el-form-item>

              <el-form-item label="默认状态">
                <el-select
                  v-model="importOptions.default_status"
                  placeholder="选择状态"
                >
                  <el-option label="草稿" value="DRAFT" />
                  <el-option label="已发布" value="PUBLISHED" />
                  <el-option label="已归档" value="ARCHIVED" />
                </el-select>
                <span class="option-tip">导入文章的默认状态</span>
              </el-form-item>
            </el-form>
          </div>

          <!-- 导入按钮 -->
          <div class="import-actions">
            <el-button
              :disabled="uploadFileList.length === 0"
              :loading="importing"
              type="primary"
              :icon="Upload"
              size="large"
              class="import-btn"
              @click="handleImport"
            >
              {{ importing ? "导入中..." : "开始导入" }}
            </el-button>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </AnDialog>
</template>

<style lang="scss" scoped>
.import-export-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 0;
  }

  :deep(.el-tabs__content) {
    padding-top: 20px;
  }

  :deep(.el-tabs__nav-wrap) {
    padding: 0;
  }
}

.export-container,
.import-container {
  .mb-4 {
    margin-bottom: 20px;
  }

  :deep(.el-alert) {
    border-radius: 8px;

    p {
      margin: 4px 0;
      font-size: 13px;
      line-height: 1.6;
    }
  }
}

.export-info {
  padding: 24px;
  text-align: center;
  background: var(--anzhiyu-secondbg);
  border-radius: 12px;
  margin: 20px 0;
}

.export-actions,
.import-actions {
  display: flex;
  justify-content: center;
  margin-top: 24px;

  .export-btn,
  .import-btn {
    min-width: 160px;
    border-radius: 8px;
    font-weight: 500;
  }
}

.upload-section {
  margin: 20px 0;

  .upload-area {
    :deep(.el-upload) {
      width: 100%;
    }

    :deep(.el-upload-dragger) {
      padding: 40px 20px;
      border-radius: 12px;
      border: 2px dashed var(--anzhiyu-card-border);
      background: var(--anzhiyu-secondbg);
      transition: all 0.3s ease;

      &:hover {
        border-color: var(--anzhiyu-main);
        background: var(--anzhiyu-card-bg);
      }
    }

    :deep(.el-icon--upload) {
      font-size: 48px;
      color: var(--anzhiyu-main);
      margin-bottom: 16px;
    }

    :deep(.el-upload__text) {
      font-size: 14px;
      color: var(--anzhiyu-fontcolor);

      em {
        color: var(--anzhiyu-main);
        font-style: normal;
      }
    }

    :deep(.el-upload__tip) {
      margin-top: 12px;
      font-size: 12px;
      color: var(--anzhiyu-secondtext);
    }
  }
}

.import-options {
  margin: 24px 0;
  padding: 20px;
  background: var(--anzhiyu-secondbg);
  border-radius: 12px;

  :deep(.el-form-item) {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: var(--anzhiyu-fontcolor);
  }

  :deep(.el-form-item__content) {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .option-tip {
    font-size: 12px;
    color: var(--anzhiyu-secondtext);
  }
}
</style>
