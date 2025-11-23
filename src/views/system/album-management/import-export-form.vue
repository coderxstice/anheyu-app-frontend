<script setup lang="ts">
import { ref, computed } from "vue";
import ReCol from "@/components/ReCol";
import { useWindowSize } from "@vueuse/core";
import type { UploadFile, UploadFiles } from "element-plus";
import { UploadFilled } from "@element-plus/icons-vue";

interface ImportExportFormProps {
  formInline?: {
    importMode: "file" | "json" | "urls";
    file: File | null;
    jsonContent: string;
    urlsContent: string;
    skipExisting: boolean;
    overwriteExisting: boolean;
    defaultCategoryId: number | null;
    thumbParam: string;
    bigParam: string;
    tags: string[];
  };
  categories?: Array<{ id: number; name: string }>;
}

const props = withDefaults(defineProps<ImportExportFormProps>(), {
  formInline: () => ({
    importMode: "urls",
    file: null,
    jsonContent: "",
    urlsContent: "",
    skipExisting: true,
    overwriteExisting: false,
    defaultCategoryId: null,
    thumbParam: "",
    bigParam: "",
    tags: []
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
  ],
  urlsContent: [
    {
      required: newFormInline.value.importMode === "urls",
      message: "请输入图片链接",
      trigger: "blur"
    },
    {
      validator: (rule: any, value: string, callback: any) => {
        if (newFormInline.value.importMode === "urls" && value) {
          const urls = value
            .split("\n")
            .map(line => line.trim())
            .filter(Boolean);
          if (urls.length === 0) {
            callback(new Error("请至少输入一个图片链接"));
          } else if (urls.length > 100) {
            callback(new Error("单次最多导入 100 个链接"));
          } else {
            callback();
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
        title="📌 导入说明"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <template #default>
          <div style="line-height: 2">
            <p style="font-weight: 600; margin-bottom: 8px">
              支持三种导入方式：
            </p>
            <p>
              🔗 <strong>链接导入</strong>：直接粘贴图片链接，一行一个（推荐）
            </p>
            <p>📝 <strong>JSON 导入</strong>：粘贴包含完整相册数据的 JSON</p>
            <p>
              📁 <strong>文件导入</strong>：上传 JSON 或 ZIP 格式的相册数据文件
            </p>
            <p style="margin-top: 8px; color: var(--anzhiyu-blue)">
              • 单次最多导入 100 条数据，文件大小限制 50MB
            </p>
            <p style="color: var(--anzhiyu-blue)">
              • 默认跳过已存在的相册（基于文件哈希值）
            </p>
          </div>
        </template>
      </el-alert>

      <el-row :gutter="30">
        <re-col :value="24" :xs="24" :sm="24">
          <el-form-item label="导入方式">
            <el-radio-group v-model="newFormInline.importMode">
              <el-radio label="urls">🔗 粘贴链接（一行一个）</el-radio>
              <el-radio label="json">📝 粘贴 JSON 数据</el-radio>
              <el-radio label="file">📁 上传文件</el-radio>
            </el-radio-group>
          </el-form-item>
        </re-col>

        <!-- 链接导入模式 -->
        <re-col
          v-if="newFormInline.importMode === 'urls'"
          :value="24"
          :xs="24"
          :sm="24"
        >
          <el-form-item label="图片链接" prop="urlsContent">
            <el-input
              v-model="newFormInline.urlsContent"
              type="textarea"
              :rows="10"
              placeholder="请粘贴图片链接，每行一个链接，例如：
https://example.com/image1.jpg
https://example.com/image2.png
https://example.com/image3.webp

支持的格式：jpg, jpeg, png, gif, webp, bmp, svg
单次最多导入 100 个链接"
              class="urls-textarea"
            />
          </el-form-item>
        </re-col>

        <!-- 链接导入模式的额外选项 -->
        <template v-if="newFormInline.importMode === 'urls'">
          <re-col :value="12" :xs="24" :sm="12">
            <el-form-item label="缩略图参数" prop="thumbParam">
              <el-input
                v-model="newFormInline.thumbParam"
                placeholder="例如：?x-oss-process=image/resize,w_400"
                clearable
              />
            </el-form-item>
          </re-col>

          <re-col :value="12" :xs="24" :sm="12">
            <el-form-item label="大图参数" prop="bigParam">
              <el-input
                v-model="newFormInline.bigParam"
                placeholder="例如：?x-oss-process=image/quality,q_90"
                clearable
              />
            </el-form-item>
          </re-col>

          <re-col :value="24" :xs="24" :sm="24">
            <el-form-item label="标签" prop="tags">
              <el-select
                v-model="newFormInline.tags"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="输入标签后按回车添加，可添加多个"
                class="w-full!"
              />
            </el-form-item>
          </re-col>
        </template>

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
  color: var(--anzhiyu-blue);
}

.json-textarea {
  :deep(.el-textarea__inner) {
    font-family: "Consolas", "Monaco", "Courier New", monospace;
    font-size: 13px;
    line-height: 1.6;
  }
}

.urls-textarea {
  :deep(.el-textarea__inner) {
    font-family: "Consolas", "Monaco", "Courier New", monospace;
    font-size: 13px;
    line-height: 1.8;
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
