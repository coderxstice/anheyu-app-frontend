<script setup lang="ts">
import { type StoragePolicy } from "@/api/sys-policy";

// 使用 defineModel 来处理双向绑定
const formData = defineModel<Partial<StoragePolicy>>({ required: true });

// 确保 settings 对象存在并初始化默认值
if (!formData.value.settings) {
  formData.value.settings = {};
}

// 确保七牛云相关的设置有默认值
if (!formData.value.settings.upload_method) {
  formData.value.settings.upload_method = "client";
}
if (!formData.value.settings.cdn_domain) {
  formData.value.settings.cdn_domain = "";
}
if (formData.value.settings.source_auth === undefined) {
  formData.value.settings.source_auth = false;
}
if (formData.value.settings.custom_proxy === undefined) {
  formData.value.settings.custom_proxy = false;
}
if (!formData.value.settings.style_separator) {
  formData.value.settings.style_separator = "";
}
</script>

<template>
  <div class="qiniu-form">
    <!-- 存储配置区域 -->
    <div class="form-section">
      <div class="section-header">
        <span class="section-icon">☁️</span>
        <span class="section-title">存储配置</span>
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

      <div class="form-row">
        <el-form-item
          label="存储根目录"
          prop="base_path"
          class="form-item-half"
        >
          <el-input v-model="formData.base_path" placeholder="留空表示根目录" />
        </el-form-item>

        <el-form-item
          label="挂载路径"
          prop="virtual_path"
          class="form-item-half"
        >
          <el-input v-model="formData.virtual_path" placeholder="/qiniu" />
        </el-form-item>
      </div>
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
          管理密钥 →
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

    <!-- 访问设置区域 -->
    <div class="form-section">
      <div class="section-header">
        <span class="section-icon">🌐</span>
        <span class="section-title">访问设置</span>
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
        <div class="form-item-help">
          七牛云控制台 → 空间管理 → 域名管理 中获取
        </div>
      </el-form-item>

      <!-- 访问权限 -->
      <el-form-item label="访问权限" prop="is_private">
        <div class="permission-cards">
          <div
            class="permission-card"
            :class="{ active: !formData.is_private }"
            @click="formData.is_private = false"
          >
            <div class="card-radio">
              <div
                class="radio-dot"
                :class="{ checked: !formData.is_private }"
              />
            </div>
            <div class="card-content">
              <div class="card-title">公开空间</div>
              <div class="card-desc">无需授权即可访问</div>
            </div>
          </div>

          <div
            class="permission-card"
            :class="{ active: formData.is_private }"
            @click="formData.is_private = true"
          >
            <div class="card-radio">
              <div
                class="radio-dot"
                :class="{ checked: formData.is_private }"
              />
            </div>
            <div class="card-content">
              <div class="card-title">私有空间</div>
              <div class="card-desc">需授权签名访问</div>
            </div>
          </div>
        </div>
      </el-form-item>

      <!-- 下载中转 -->
      <el-form-item label="下载中转">
        <el-switch v-model="formData.settings.custom_proxy" />
        <span class="switch-label">
          {{ formData.settings.custom_proxy ? "已开启" : "已关闭" }}
        </span>
        <div class="form-item-help">开启后，用户下载文件时会通过服务器代理</div>
      </el-form-item>
    </div>

    <!-- 图片处理区域（仅图片相关策略显示） -->
    <div
      v-if="
        formData.flag === 'article_image' ||
        formData.flag === 'comment_image' ||
        formData.flag === 'user_avatar'
      "
      class="form-section"
    >
      <div class="section-header">
        <span class="section-icon">🖼️</span>
        <span class="section-title">图片处理</span>
        <el-link
          type="primary"
          href="https://developer.qiniu.com/dora/kb/1279/image-processing-guide"
          target="_blank"
          class="section-link"
        >
          查看文档 →
        </el-link>
      </div>

      <el-form-item label="样式分隔符" prop="settings.style_separator">
        <el-input
          v-model="formData.settings.style_separator"
          placeholder="-small 或 !thumbnail"
        />
        <div class="form-item-help">
          在七牛云控制台创建图片样式后，填写分隔符+样式名（如 -small）
        </div>
      </el-form-item>
    </div>

    <!-- 提示信息 -->
    <div class="tips-section">
      <div class="tip-item">
        <span class="tip-icon">💡</span>
        <span class="tip-text">上传方式：客户端直传</span>
      </div>
      <div class="tip-item">
        <span class="tip-icon">⚠️</span>
        <span class="tip-text">
          CORS 需在七牛云控制台配置：空间设置 → 跨域资源共享
        </span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.qiniu-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// 表单区块
.form-section {
  padding: 16px;
  background: var(--anzhiyu-secondbg);
  border-radius: 10px;
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
  font-size: 11px;
  line-height: 1.4;
  color: var(--anzhiyu-secondfontcolor);
}

.input-prefix-icon {
  font-size: 14px;
}

.switch-label {
  margin-left: 8px;
  font-size: 13px;
  color: var(--anzhiyu-secondfontcolor);
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
