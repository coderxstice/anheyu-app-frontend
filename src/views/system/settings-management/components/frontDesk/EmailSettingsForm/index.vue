<script setup lang="ts">
import { ref } from "vue";
import type { EmailSettingsInfo } from "../../../type";
import { ElMessage } from "element-plus";
import { sendTestEmail } from "@/api/site";

defineOptions({
  name: "EmailSettingsForm"
});

const model = defineModel<EmailSettingsInfo>({ required: true });

const testEmailAddress = ref("");
const isSending = ref(false);

const handleSendTestEmail = async () => {
  if (!testEmailAddress.value) {
    ElMessage.warning("请输入要接收测试邮件的邮箱地址");
    return;
  }

  isSending.value = true;
  try {
    const res = await sendTestEmail(testEmailAddress.value);
    ElMessage.success(res.message || "测试邮件已成功发送！");
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message || "邮件发送失败，请检查配置或网络";
    ElMessage.error(errorMessage);
    console.error("发送测试邮件失败:", error);
  } finally {
    isSending.value = false;
  }
};
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
            controls-position="right"
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
          <el-input v-model="model.smtpSenderName" placeholder="例如: 安和鱼" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="发件人邮箱">
          <el-input
            v-model="model.smtpSenderEmail"
            placeholder="例如: user@example.com（需要和SMTP登录用户名一致）"
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

    <el-divider content-position="left">服务连通性测试</el-divider>
    <el-form-item label="发送测试邮件">
      <div style="display: flex; gap: 10px; width: 100%">
        <el-input
          v-model="testEmailAddress"
          placeholder="输入接收测试邮件的邮箱地址"
          clearable
        />
        <el-button
          type="primary"
          :loading="isSending"
          style="width: 120px"
          @click="handleSendTestEmail"
        >
          {{ isSending ? "发送中..." : "发送" }}
        </el-button>
      </div>
      <div class="el-form-item__info">
        点击发送前，请确保上方的 SMTP
        配置已填写并保存。此功能将使用已保存的配置进行发送。
      </div>
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
      <div v-pre class="template-hint">
        <b>可用占位符:</b>
        <ul>
          <li>
            <code>{{.Nickname}}</code
            >: 用户的昵称
          </li>
          <li>
            <code>{{.AppName}}</code
            >: 您的网站名称
          </li>
          <li>
            <code>{{.ActivateLink}}</code
            >: 用于激活账户的唯一链接
          </li>
        </ul>
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
      <div v-pre class="template-hint">
        <b>可用占位符:</b>
        <ul>
          <li>
            <code>{{.Nickname}}</code
            >: 用户的昵称
          </li>
          <li>
            <code>{{.AppName}}</code
            >: 您的网站名称
          </li>
          <li>
            <code>{{.ResetLink}}</code
            >: 用于重置密码的唯一链接
          </li>
        </ul>
      </div>
    </el-form-item>
  </div>
</template>

<style scoped>
.template-hint {
  padding: 8px 16px;
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--anzhiyu-fontcolor);
  background-color: var(--anzhiyu-secondbg);
  border-radius: 4px;
}

.template-hint b {
  font-weight: 600;
}

.template-hint ul {
  padding-left: 18px;
  margin: 6px 0 0;
  list-style-type: disc;
}

.template-hint li {
  margin-bottom: 5px;
}

.template-hint code {
  padding: 2px 5px;
  margin-right: 8px;
  font-family: "Courier New", Courier, monospace;
  font-size: 12px;
  background-color: var(--anzhiyu-card-bg-grey);
  border-radius: 3px;
}
</style>
