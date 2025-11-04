<script setup lang="ts">
import { ref, computed } from "vue";
import ReCol from "@/components/ReCol";
import { useWindowSize } from "@vueuse/core";
import type { UploadFile, UploadFiles } from "element-plus";
import { UploadFilled } from "@element-plus/icons-vue";

interface ImportExportFormProps {
  formInline?: {
    importMode: "file" | "json";
    file: File | null;
    jsonContent: string;
    skipExisting: boolean;
    overwriteExisting: boolean;
    defaultCategoryId: number | null;
  };
  categories?: Array<{ id: number; name: string }>;
}

const props = withDefaults(defineProps<ImportExportFormProps>(), {
  formInline: () => ({
    importMode: "json",
    file: null,
    jsonContent: "",
    skipExisting: true,
    overwriteExisting: false,
    defaultCategoryId: null
  }),
  categories: () => []
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);
const uploadRef = ref();

// 响应式窗口大小
const { width } = useWindowSize();

// 计算表单标签宽度
const labelWidth = computed(() => {
  return width.value <= 768 ? "120px" : "140px";
});

// 表单验证规则
const formRules = computed(() => ({
  file: [
    {
      required: newFormInline.value.importMode === "file",
      message: "请上传相册数据文件",
      trigger: "change"
    }
  ],
  jsonContent: [
    {
      required: newFormInline.value.importMode === "json",
      message: "请输入 JSON 数据",
      trigger: "blur"
    },
    {
      validator: (rule: any, value: string, callback: any) => {
        if (newFormInline.value.importMode === "json" && value) {
          try {
            JSON.parse(value);
            callback();
          } catch (error) {
            callback(new Error("JSON 格式不正确"));
          }
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ]
}));

// 文件上传处理
const handleFileChange = (uploadFile: UploadFile, uploadFiles: UploadFiles) => {
  if (uploadFile.raw) {
    newFormInline.value.file = uploadFile.raw;
  }
};

const handleFileRemove = () => {
  newFormInline.value.file = null;
};

// 限制只能上传一个文件
const handleExceed = () => {
  return false;
};

// 文件上传前的验证
const beforeUpload = (file: File) => {
  const isJSON = file.name.endsWith(".json");
  const isZIP = file.name.endsWith(".zip");
  const isValid = isJSON || isZIP;

  if (!isValid) {
    return false;
  }

  // 限制文件大小为 50MB
  const isLt50M = file.size / 1024 / 1024 < 50;
  if (!isLt50M) {
    return false;
  }

  return true;
};

function getRef() {
  return ruleFormRef.value;
}

defineExpose({ getRef });
</script>

<template>
  <div class="import-export-container">
    <el-form
      ref="ruleFormRef"
      :model="newFormInline"
      :rules="formRules"
      :label-width="labelWidth"
    >
      <el-alert
        title="导入说明"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <template #default>
          <div style="line-height: 1.8">
            <p>• 支持直接粘贴 JSON 数据或上传 JSON/ZIP 文件</p>
            <p>• 文件大小限制为 50MB</p>
            <p>• 默认会跳过已存在的相册（基于文件哈希值）</p>
            <p>• 可选择覆盖已存在的相册或指定默认分类</p>
          </div>
        </template>
      </el-alert>

      <el-row :gutter="30">
        <re-col :value="24" :xs="24" :sm="24">
          <el-form-item label="导入方式">
            <el-radio-group v-model="newFormInline.importMode">
              <el-radio label="json">粘贴 JSON 数据</el-radio>
              <el-radio label="file">上传文件</el-radio>
            </el-radio-group>
          </el-form-item>
        </re-col>

        <re-col
          v-if="newFormInline.importMode === 'json'"
          :value="24"
          :xs="24"
          :sm="24"
        >
          <el-form-item label="JSON 数据" prop="jsonContent">
            <el-input
              v-model="newFormInline.jsonContent"
              type="textarea"
              :rows="12"
              placeholder='请粘贴相册 JSON 数据，例如：
{
  "version": "1.0",
  "albums": [
    {
      "image_url": "https://example.com/image.jpg",
      "tags": "风景,自然",
      ...
    }
  ]
}'
              class="json-textarea"
            />
          </el-form-item>
        </re-col>

        <re-col
          v-if="newFormInline.importMode === 'file'"
          :value="24"
          :xs="24"
          :sm="24"
        >
          <el-form-item label="数据文件" prop="file">
            <el-upload
              ref="uploadRef"
              class="upload-demo"
              drag
              :auto-upload="false"
              :limit="1"
              accept=".json,.zip"
              :on-change="handleFileChange"
              :on-remove="handleFileRemove"
              :on-exceed="handleExceed"
              :before-upload="beforeUpload"
            >
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">
                将文件拖到此处，或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  支持 .json 或 .zip 格式文件，文件大小不超过 50MB
                </div>
              </template>
            </el-upload>
          </el-form-item>
        </re-col>

        <re-col :value="24" :xs="24" :sm="24">
          <el-form-item label="导入选项">
            <div class="option-group">
              <el-checkbox
                v-model="newFormInline.skipExisting"
                label="跳过已存在的相册"
              />
              <el-checkbox
                v-model="newFormInline.overwriteExisting"
                label="覆盖已存在的相册"
                :disabled="newFormInline.skipExisting"
              />
            </div>
          </el-form-item>
        </re-col>

        <re-col :value="24" :xs="24" :sm="24">
          <el-form-item label="默认分类" prop="defaultCategoryId">
            <el-select
              v-model="newFormInline.defaultCategoryId"
              placeholder="为没有分类的相册指定默认分类（可选）"
              clearable
              class="w-full!"
            >
              <el-option
                v-for="category in categories"
                :key="category.id"
                :label="category.name"
                :value="category.id"
              />
            </el-select>
          </el-form-item>
        </re-col>
      </el-row>
    </el-form>
  </div>
</template>

<style scoped lang="scss">
.import-export-container {
  max-height: 67vh;
  overflow: auto;
  padding-right: 1rem;

  /* 美化垂直滚动条 */
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: var(--el-fill-color-lighter);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-color-info-light-5);
    border-radius: 3px;

    &:hover {
      background: var(--el-color-info-light-3);
    }
  }

  // 移动端适配
  @media (width <= 768px) {
    max-height: 70vh;
  }
}

:deep(.el-form) {
  // 移动端调整标签宽度
  @media (width <= 768px) {
    label {
      font-size: 14px;
    }
  }
}

:deep(.el-alert) {
  // 移动端调整说明文字
  @media (width <= 768px) {
    .el-alert__title {
      font-size: 14px;
    }

    .el-alert__description {
      font-size: 12px;

      p {
        margin: 4px 0;
      }
    }
  }
}

:deep(.el-alert__description) {
  margin-top: 8px;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;

  @media (width <= 768px) {
    gap: 8px;
  }
}

:deep(.el-upload) {
  width: 100%;

  .el-upload-dragger {
    width: 100%;
  }
}

:deep(.el-upload__tip) {
  margin-top: 8px;
  font-size: 13px;
  color: var(--el-color-info);
}

.json-textarea {
  :deep(.el-textarea__inner) {
    font-family: "Consolas", "Monaco", "Courier New", monospace;
    font-size: 13px;
    line-height: 1.6;
  }
}

// 移动端输入框适配
:deep(.el-checkbox) {
  @media (width <= 768px) {
    .el-checkbox__label {
      font-size: 14px;
    }
  }
}

:deep(.el-radio-group) {
  display: flex;
  gap: 16px;

  @media (width <= 768px) {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
