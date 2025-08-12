<script setup lang="ts">
import type { EmailSettingsInfo } from "../../../type";

defineOptions({
  name: "EmailSettingsForm"
});

const model = defineModel<EmailSettingsInfo>({ required: true });
</script>

<template>
  <div>
    <el-divider content-position="left">SMTP 服务器</el-divider>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="SMTP 服务器地址">
          <el-input
            v-model="model.smtpHost"
            placeholder="例如: smtp.example.com"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="SMTP 服务器端口">
          <el-input-number
            v-model="model.smtpPort"
            :min="1"
            :max="65535"
            placeholder="例如: 587"
          />
        </el-form-item>
      </el-col>
    </el-row>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="SMTP 登录用户名">
          <el-input
            v-model="model.smtpUsername"
            placeholder="例如: user@example.com"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="SMTP 登录密码">
          <el-input
            v-model="model.smtpPassword"
            type="password"
            show-password
            placeholder="输入密码"
          />
        </el-form-item>
      </el-col>
    </el-row>
    <el-form-item label="是否强制使用 SSL (通常配合465端口)">
      <el-switch v-model="model.smtpForceSSL" />
    </el-form-item>

    <el-divider content-position="left">发件人信息</el-divider>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="发件人名称">
          <el-input
            v-model="model.smtpSenderName"
            placeholder="例如: 我的网站"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="发件人邮箱">
          <el-input
            v-model="model.smtpSenderEmail"
            placeholder="例如: noreply@example.com"
          />
        </el-form-item>
      </el-col>
    </el-row>
    <el-form-item label="回信邮箱地址 (留空则使用发件人邮箱)">
      <el-input
        v-model="model.smtpReplyToEmail"
        placeholder="例如: support@example.com"
      />
    </el-form-item>

    <el-divider content-position="left">功能开关与模板</el-divider>
    <el-form-item label="开启新用户邮箱激活功能">
      <el-switch v-model="model.enableUserActivation" />
    </el-form-item>
    <el-form-item label="用户激活邮件主题">
      <el-input v-model="model.activateAccountSubject" />
    </el-form-item>
    <el-form-item label="用户激活邮件模板 (支持HTML)">
      <el-input
        v-model="model.activateAccountTemplate"
        type="textarea"
        :rows="6"
      />
      <div class="template-hint">
        可用变量: \{\{.Nickname}}, \{\{.AppName}}, \{\{.ActivateLink}}
      </div>
    </el-form-item>
    <el-form-item label="重置密码邮件主题">
      <el-input v-model="model.resetPasswordSubject" />
    </el-form-item>
    <el-form-item label="重置密码邮件模板 (支持HTML)">
      <el-input
        v-model="model.resetPasswordTemplate"
        type="textarea"
        :rows="6"
      />
      <div class="template-hint">
        可用变量: \{\{.Nickname}}, \{\{.AppName}}, \{\{.ResetLink}}
      </div>
    </el-form-item>
  </div>
</template>

<style scoped>
.template-hint {
  font-size: 12px;
  color: #999;
  line-height: 1.5;
  margin-top: 4px;
}
</style>
