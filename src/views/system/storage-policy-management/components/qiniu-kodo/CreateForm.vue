<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { type StoragePolicy } from "@/api/sys-policy";

const myInput = ref(null);

const emit = defineEmits<{
  (e: "submit", payload: Partial<StoragePolicy>): void;
}>();

const formRef = ref<FormInstance>();
const formData = ref<Partial<StoragePolicy>>({
  type: "qiniu_kodo",
  name: "",
  server: "https://up-z0.qiniup.com",
  bucket_name: "",
  access_key: "",
  secret_key: "",
  base_path: "",
  virtual_path: "/qiniu",
  is_private: false,
  settings: {
    upload_method: "client",
    cdn_domain: ""
  }
});

const rules = reactive<FormRules>({
  name: [{ required: true, message: "策略名称不能为空", trigger: "blur" }],
  bucket_name: [
    { required: true, message: "存储空间名称不能为空", trigger: "blur" }
  ],
  access_key: [
    { required: true, message: "AccessKey 不能为空", trigger: "blur" }
  ],
  secret_key: [
    { required: true, message: "SecretKey 不能为空", trigger: "blur" }
  ],
  "settings.cdn_domain": [
    { required: true, message: "访问域名不能为空", trigger: "blur" }
  ],
  virtual_path: [
    { required: true, message: "应用内挂载路径不能为空", trigger: "blur" },
    {
      pattern: /^\/[a-zA-Z0-9_-]+$/,
      message:
        "路径必须以 / 开头，只能包含字母、数字、下划线和连字符，且只能是一级目录（如 /qiniu）",
      trigger: "blur"
    },
    {
      validator: (rule, value, callback) => {
        const pathWithoutSlash = value.replace(/^\//, "");
        if (pathWithoutSlash.includes("/")) {
          callback(
            new Error(
              "只允许一级路径，不能包含多级目录（如 /data/qiniu 是不允许的）"
            )
          );
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ]
});

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(valid => {
    if (valid) {
      emit("submit", formData.value);
    }
  });
};

onMounted(() => {
  setTimeout(() => myInput.value?.focus(), 100);
});

defineExpose({ submitForm });
</script>

<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-position="top"
    class="create-form"
  >
    <!-- 基础配置区域 -->
    <div class="form-section">
      <div class="section-header">
        <span class="section-icon">📝</span>
        <span class="section-title">基础配置</span>
      </div>

      <div class="form-row">
        <el-form-item label="策略名称" prop="name" class="form-item-half">
          <el-input
            ref="myInput"
            v-model="formData.name"
            placeholder="输入策略名称"
          />
        </el-form-item>

        <el-form-item
          label="挂载路径"
          prop="virtual_path"
          class="form-item-half"
        >
          <el-input v-model="formData.virtual_path" placeholder="/qiniu" />
          <div class="form-item-help compact">
            仅支持一级路径，如 /qiniu、/kodo
          </div>
        </el-form-item>
      </div>
    </div>

    <!-- 七牛云配置区域 -->
    <div class="form-section">
      <div class="section-header">
        <span class="section-icon">☁️</span>
        <span class="section-title">七牛云配置</span>
        <el-link
          type="primary"
          href="https://portal.qiniu.com/kodo/bucket"
          target="_blank"
          class="section-link"
        >
          前往控制台 →
        </el-link>
      </div>

      <div class="form-row">
        <el-form-item
          label="存储空间"
          prop="bucket_name"
          class="form-item-half"
        >
          <el-input v-model="formData.bucket_name" placeholder="my-bucket" />
        </el-form-item>

        <el-form-item label="存储区域" prop="server" class="form-item-half">
          <el-select
            v-model="formData.server"
            placeholder="选择区域"
            style="width: 100%"
          >
            <el-option label="华东-浙江" value="https://up-z0.qiniup.com" />
            <el-option
              label="华东-浙江2"
              value="https://up-cn-east-2.qiniup.com"
            />
            <el-option label="华北-河北" value="https://up-z1.qiniup.com" />
            <el-option label="华南-广东" value="https://up-z2.qiniup.com" />
            <el-option label="北美-洛杉矶" value="https://up-na0.qiniup.com" />
            <el-option label="亚太-新加坡" value="https://up-as0.qiniup.com" />
          </el-select>
        </el-form-item>
      </div>

      <el-form-item label="访问域名" prop="settings.cdn_domain">
        <el-input
          v-model="formData.settings.cdn_domain"
          placeholder="https://cdn.example.com"
        >
          <template #prefix>
            <span class="input-prefix-icon">🔗</span>
          </template>
        </el-input>
        <div class="form-item-help compact">
          七牛云控制台 → 空间管理 → 域名管理 中获取
        </div>
      </el-form-item>

      <el-form-item label="存储根目录" prop="base_path">
        <el-input
          v-model="formData.base_path"
          placeholder="留空表示根目录，或输入 /files"
        />
      </el-form-item>
    </div>

    <!-- 密钥配置区域 -->
    <div class="form-section">
      <div class="section-header">
        <span class="section-icon">🔐</span>
        <span class="section-title">API 密钥</span>
        <el-link
          type="primary"
          href="https://portal.qiniu.com/user/key"
          target="_blank"
          class="section-link"
        >
          获取密钥 →
        </el-link>
      </div>

      <div class="form-row">
        <el-form-item
          label="AccessKey"
          prop="access_key"
          class="form-item-half"
        >
          <el-input v-model="formData.access_key" placeholder="AK" />
        </el-form-item>

        <el-form-item
          label="SecretKey"
          prop="secret_key"
          class="form-item-half"
        >
          <el-input
            v-model="formData.secret_key"
            type="password"
            show-password
            placeholder="SK"
          />
        </el-form-item>
      </div>
    </div>

    <!-- 访问权限区域 -->
    <div class="form-section">
      <div class="section-header">
        <span class="section-icon">🔒</span>
        <span class="section-title">访问权限</span>
      </div>

      <div class="permission-cards">
        <div
          class="permission-card"
          :class="{ active: !formData.is_private }"
          @click="formData.is_private = false"
        >
          <div class="card-radio">
            <div class="radio-dot" :class="{ checked: !formData.is_private }" />
          </div>
          <div class="card-content">
            <div class="card-title">公开空间</div>
            <div class="card-desc">无需授权即可访问，适合公开资源</div>
          </div>
        </div>

        <div
          class="permission-card"
          :class="{ active: formData.is_private }"
          @click="formData.is_private = true"
        >
          <div class="card-radio">
            <div class="radio-dot" :class="{ checked: formData.is_private }" />
          </div>
          <div class="card-content">
            <div class="card-title">私有空间</div>
            <div class="card-desc">需授权签名访问，适合敏感文件</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 提示信息 -->
    <div class="tips-section">
      <div class="tip-item">
        <span class="tip-icon">💡</span>
        <span class="tip-text">上传方式：客户端直传（自动配置）</span>
      </div>
      <div class="tip-item">
        <span class="tip-icon">⚠️</span>
        <span class="tip-text">
          CORS 需在七牛云控制台手动配置：空间设置 → 跨域资源共享
        </span>
      </div>
    </div>
  </el-form>
</template>

<style lang="scss" scoped>
.create-form {
  max-height: 60vh;
  padding: 16px 20px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 5px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color);
    border-radius: 4px;

    &:hover {
      background: var(--el-border-color-darker);
    }
  }
}

// 表单区块
.form-section {
  padding: 16px;
  margin-bottom: 12px;
  background: var(--anzhiyu-secondbg);
  border-radius: 10px;

  &:last-of-type {
    margin-bottom: 8px;
  }
}

.section-header {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 14px;

  .section-icon {
    font-size: 16px;
  }

  .section-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--anzhiyu-fontcolor);
  }

  .section-link {
    margin-left: auto;
    font-size: 12px;
  }
}

// 表单行布局
.form-row {
  display: flex;
  gap: 12px;

  .form-item-half {
    flex: 1;
    min-width: 0;
  }
}

// 表单项
:deep(.el-form-item) {
  margin-bottom: 14px;

  &:last-child {
    margin-bottom: 0;
  }

  .el-form-item__label {
    padding-bottom: 4px;
    font-size: 13px;
    font-weight: 500;
    line-height: 1.4;
    color: var(--anzhiyu-fontcolor);
  }
}

.form-item-help {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--anzhiyu-secondfontcolor);

  &.compact {
    margin-top: 2px;
    font-size: 11px;
  }
}

.input-prefix-icon {
  font-size: 14px;
}

// 权限卡片
.permission-cards {
  display: flex;
  gap: 10px;
}

.permission-card {
  display: flex;
  flex: 1;
  gap: 10px;
  align-items: flex-start;
  padding: 12px;
  cursor: pointer;
  background: var(--anzhiyu-background);
  border: 2px solid transparent;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--el-color-primary-light-5);
  }

  &.active {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary);
  }
}

.card-radio {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-top: 1px;
  border: 2px solid var(--el-border-color);
  border-radius: 50%;
  transition: all 0.2s ease;

  .radio-dot {
    width: 8px;
    height: 8px;
    background: transparent;
    border-radius: 50%;
    transition: all 0.2s ease;

    &.checked {
      background: var(--el-color-primary);
    }
  }

  .permission-card.active & {
    border-color: var(--el-color-primary);
  }
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-title {
  margin-bottom: 2px;
  font-size: 14px;
  font-weight: 600;
  color: var(--anzhiyu-fontcolor);
}

.card-desc {
  font-size: 12px;
  line-height: 1.4;
  color: var(--anzhiyu-secondfontcolor);
}

// 提示区域
.tips-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 14px;
  background: var(--el-color-info-light-9);
  border-radius: 8px;
}

.tip-item {
  display: flex;
  gap: 8px;
  align-items: center;

  .tip-icon {
    flex-shrink: 0;
    font-size: 13px;
  }

  .tip-text {
    font-size: 12px;
    line-height: 1.4;
    color: var(--anzhiyu-secondfontcolor);
  }
}
</style>
