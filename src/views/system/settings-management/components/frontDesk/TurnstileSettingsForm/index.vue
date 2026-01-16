<!--
 * @Description: Cloudflare Turnstile 人机验证配置表单
 * @Author: 安知鱼
 * @Date: 2025-01-16
-->
<script setup lang="ts">
import type { TurnstileSettingsInfo } from "../../../type";

defineOptions({
  name: "TurnstileSettingsForm"
});

const model = defineModel<TurnstileSettingsInfo>({ required: true });
</script>

<template>
  <div>
    <el-alert
      title="Cloudflare Turnstile 人机验证"
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 20px"
    >
      <template #default>
        <p style="margin: 0">
          Turnstile 是 Cloudflare
          提供的免费人机验证服务，可以有效防止机器人和恶意请求。
          启用后，用户在登录和注册时需要完成人机验证。
        </p>
        <p style="margin: 8px 0 0">
          获取密钥请访问：
          <el-link
            type="primary"
            href="https://dash.cloudflare.com/?to=/:account/turnstile"
            target="_blank"
          >
            Cloudflare Turnstile 控制台
          </el-link>
        </p>
      </template>
    </el-alert>

    <el-divider content-position="left">基本配置</el-divider>

    <el-form-item label="启用 Turnstile 人机验证">
      <el-switch v-model="model.enable" />
      <div class="el-form-item__info">
        开启后，用户登录和注册时需要完成人机验证
      </div>
    </el-form-item>

    <el-divider content-position="left">密钥配置</el-divider>

    <el-form-item label="Site Key（公钥）">
      <el-input
        v-model="model.siteKey"
        placeholder="请输入 Turnstile Site Key"
        :disabled="!model.enable"
      />
      <div class="el-form-item__info">
        用于前端页面渲染验证组件，从 Cloudflare 控制台获取
      </div>
    </el-form-item>

    <el-form-item label="Secret Key（私钥）">
      <el-input
        v-model="model.secretKey"
        type="password"
        show-password
        placeholder="请输入 Turnstile Secret Key"
        :disabled="!model.enable"
      />
      <div class="el-form-item__info">
        用于后端验证用户提交的 token，请妥善保管，不要泄露
      </div>
    </el-form-item>

    <el-divider content-position="left">使用说明</el-divider>

    <div class="help-section">
      <h4>配置步骤</h4>
      <ol>
        <li>
          访问
          <a
            href="https://dash.cloudflare.com/?to=/:account/turnstile"
            target="_blank"
            >Cloudflare Turnstile 控制台</a
          >
        </li>
        <li>点击 "Add site" 创建新站点</li>
        <li>填写站点名称和域名（需要与您的博客域名一致）</li>
        <li>选择验证模式（推荐使用 Managed）</li>
        <li>创建完成后，复制 Site Key 和 Secret Key 到上方对应输入框</li>
        <li>保存配置并启用开关</li>
      </ol>

      <h4>验证模式说明</h4>
      <ul>
        <li><strong>Managed</strong>：自动判断是否需要验证，用户体验最佳</li>
        <li><strong>Non-interactive</strong>：静默验证，无需用户交互</li>
        <li><strong>Invisible</strong>：完全隐藏的验证</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.help-section {
  padding: 16px;
  background-color: var(--anzhiyu-secondbg);
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.8;
}

.help-section h4 {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: var(--anzhiyu-fontcolor);
}

.help-section h4:not(:first-child) {
  margin-top: 20px;
}

.help-section ol,
.help-section ul {
  margin: 0;
  padding-left: 20px;
}

.help-section li {
  margin-bottom: 6px;
  color: var(--anzhiyu-secondfontcolor);
}

.help-section a {
  color: var(--anzhiyu-theme);
  text-decoration: none;
}

.help-section a:hover {
  text-decoration: underline;
}

.help-section strong {
  color: var(--anzhiyu-fontcolor);
}
</style>
