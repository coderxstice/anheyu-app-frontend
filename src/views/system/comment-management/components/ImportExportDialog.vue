<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Upload, Download, UploadFilled } from "@element-plus/icons-vue";
import type { UploadProps, UploadFile } from "element-plus";
import { exportComments, importComments } from "@/api/comment";
import type {
  ImportCommentOptions,
  ImportCommentResult
} from "@/api/comment/type";
import AnDialog from "@/components/AnDialog/index.vue";

defineOptions({
  name: "CommentImportExportDialog"
});

interface Props {
  modelValue: boolean;
  selectedIds: string[]; // 选中的评论ID列表
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

// 是否显示导出标签页（只有选中了评论才显示选择导出，否则导出全部）
const showExportTab = computed(() => true); // 始终显示导出标签页

// 弹窗标题
const dialogTitle = computed(() => "评论导入导出");

const activeTab = ref<"export" | "import">("export");

// 监听弹窗打开，根据是否有选中评论设置默认标签页
watch(
  () => props.modelValue,
  isOpen => {
    if (isOpen) {
      activeTab.value = "export";
    }
  }
);

const exporting = ref(false);
const importing = ref(false);
const uploadFileList = ref<UploadFile[]>([]);

// 导入选项
const importOptions = reactive<ImportCommentOptions>({
  skip_existing: true,
  default_status: 1,
  keep_create_time: true
});

// 导出评论
const handleExport = async () => {
  try {
    exporting.value = true;
    const blob = await exportComments(props.selectedIds);

    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    const filename =
      props.selectedIds.length > 0
        ? `comments_export_selected_${timestamp}.zip`
        : `comments_export_all_${timestamp}.zip`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    const msg =
      props.selectedIds.length > 0
        ? `成功导出 ${props.selectedIds.length} 条评论`
        : "成功导出所有评论";
    ElMessage.success({
      message: msg,
      customClass: "high-z-index-message"
    });
    dialogVisible.value = false;
  } catch (error: any) {
    console.error("导出失败:", error);
    ElMessage.error({
      message: error.message || "导出评论失败",
      customClass: "high-z-index-message"
    });
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
    ElMessage.error({
      message: "只支持 .json 和 .zip 格式的文件",
      customClass: "high-z-index-message"
    });
    return false;
  }

  const isLt50M = file.size / 1024 / 1024 < 50;
  if (!isLt50M) {
    ElMessage.error({
      message: "文件大小不能超过 50MB",
      customClass: "high-z-index-message"
    });
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

// 导入评论
const handleImport = async () => {
  if (uploadFileList.value.length === 0) {
    ElMessage.warning({
      message: "请选择要导入的文件",
      customClass: "high-z-index-message"
    });
    return;
  }

  const file = uploadFileList.value[0].raw;
  if (!file) {
    ElMessage.error({
      message: "无效的文件",
      customClass: "high-z-index-message"
    });
    return;
  }

  try {
    importing.value = true;
    const { data } = await importComments(file, importOptions);

    // 显示导入结果
    const result = data as ImportCommentResult;
    const messages = [
      `总计: ${result.total_count} 条`,
      `成功: ${result.success_count} 条`,
      `跳过: ${result.skipped_count} 条`,
      `失败: ${result.failed_count} 条`
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
    ElMessage.error({
      message: error.message || "导入评论失败",
      customClass: "high-z-index-message"
    });
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
      <!-- 导出标签页 -->
      <el-tab-pane v-if="showExportTab" label="导出评论" name="export">
        <div class="export-container">
          <el-alert
            title="导出说明"
            type="info"
            :closable="false"
            show-icon
            class="mb-4"
          >
            <template #default>
              <p>
                • 将导出{{ selectedIds.length > 0 ? "选中的" : "所有" }}评论为
                ZIP 压缩包
              </p>
              <p>• 包含评论的 JSON 数据文件</p>
              <p>• 支持跨系统导入，保留评论所有信息</p>
            </template>
          </el-alert>

          <div class="export-info">
            <el-statistic
              :title="selectedIds.length > 0 ? '已选择评论数' : '导出范围'"
              :value="selectedIds.length > 0 ? selectedIds.length : undefined"
            >
              <template #prefix>
                <IconifyIconOnline icon="ep:chat-dot-round" />
              </template>
              <template v-if="selectedIds.length === 0" #default>
                全部
              </template>
            </el-statistic>
          </div>

          <div class="export-actions">
            <el-button
              :loading="exporting"
              type="primary"
              :icon="Download"
              size="large"
              class="export-btn"
              @click="handleExport"
            >
              {{
                exporting
                  ? "导出中..."
                  : selectedIds.length > 0
                    ? "导出选中"
                    : "导出全部"
              }}
            </el-button>
          </div>
        </div>
      </el-tab-pane>

      <!-- 导入标签页 -->
      <el-tab-pane label="导入评论" name="import">
        <div class="import-container">
          <el-alert
            title="导入说明"
            type="info"
            :closable="false"
            show-icon
            class="mb-4"
          >
            <template #default>
              <p>• 支持导入 JSON 或 ZIP 格式的评论数据</p>
              <p>• 可选择跳过已存在的评论（根据邮箱、路径和内容判断）</p>
              <p>• 支持保留原评论的创建时间</p>
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
              <el-form-item label="跳过已存在评论">
                <el-switch v-model="importOptions.skip_existing" />
                <span class="option-tip"
                  >相同邮箱、路径、内容的评论将被跳过</span
                >
              </el-form-item>

              <el-form-item label="保留创建时间">
                <el-switch v-model="importOptions.keep_create_time" />
                <span class="option-tip">使用原评论的发布时间</span>
              </el-form-item>

              <el-form-item label="默认状态">
                <el-select
                  v-model="importOptions.default_status"
                  placeholder="选择状态"
                  :teleported="false"
                >
                  <el-option label="已发布" :value="1" />
                  <el-option label="待审核" :value="2" />
                </el-select>
                <span class="option-tip">导入评论的默认状态</span>
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
