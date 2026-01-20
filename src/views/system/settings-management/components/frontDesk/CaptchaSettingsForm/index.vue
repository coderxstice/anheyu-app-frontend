<!--
 * @Description: 人机验证配置表单（支持 Turnstile / 极验 / 系统验证码）
 * @Author: 安知鱼
 * @Date: 2026-01-20
-->
<script setup lang="ts">
import { computed } from "vue";
import type { CaptchaSettingsInfo } from "../../../type";

defineOptions({
  name: "CaptchaSettingsForm"
});

const model = defineModel<CaptchaSettingsInfo>({ required: true });

// 验证方式选项
const providerOptions = [
  { label: "不启用", value: "none" },
  { label: "Cloudflare Turnstile", value: "turnstile" },
  { label: "极验 GeeTest 4.0", value: "geetest" },
  { label: "系统图形验证码", value: "image" }
];

// 当前选择的验证方式
const currentProvider = computed(() => model.value.provider);
</script>

<template>
  <div>
    <el-alert
      title="人机验证配置"
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 20px"
    >
      <template #default>
        <p style="margin: 0">
          人机验证可以有效防止机器人和恶意请求。启用后，用户在登录、注册、忘记密码等场景需要完成验证。
        </p>
        <p style="margin: 8px 0 0">
          支持三种验证方式：Cloudflare Turnstile（推荐）、极验 GeeTest 4.0、系统图形验证码。
        </p>
      </template>
    </el-alert>

    <el-divider content-position="left">验证方式</el-divider>

    <el-form-item label="选择验证方式">
      <el-select v-model="model.provider" placeholder="请选择验证方式" style="width: 300px">
        <el-option
          v-for="option in providerOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
      <div class="el-form-item__info">
        选择要使用的人机验证方式，不同方式需要配置不同的参数
      </div>
    </el-form-item>

    <!-- Turnstile 配置 -->
    <template v-if="currentProvider === 'turnstile'">
      <el-divider content-position="left">Cloudflare Turnstile 配置</el-divider>

      <el-alert
        type="success"
        :closable="false"
        style="margin-bottom: 16px"
      >
        <template #title>
          获取密钥请访问：
          <el-link
            type="primary"
            href="https://dash.cloudflare.com/?to=/:account/turnstile"
            target="_blank"
          >
            Cloudflare Turnstile 控制台
          </el-link>
        </template>
      </el-alert>

      <el-form-item label="Site Key（公钥）">
        <el-input
          v-model="model.turnstile.siteKey"
          placeholder="请输入 Turnstile Site Key"
        />
        <div class="el-form-item__info">
          用于前端页面渲染验证组件，从 Cloudflare 控制台获取
        </div>
      </el-form-item>

      <el-form-item label="Secret Key（私钥）">
        <el-input
          v-model="model.turnstile.secretKey"
          type="password"
          show-password
          placeholder="请输入 Turnstile Secret Key"
        />
        <div class="el-form-item__info">
          用于后端验证用户提交的 token，请妥善保管，不要泄露
        </div>
      </el-form-item>
    </template>

    <!-- 极验配置 -->
    <template v-else-if="currentProvider === 'geetest'">
      <el-divider content-position="left">极验 GeeTest 4.0 配置</el-divider>

      <el-alert
        type="success"
        :closable="false"
        style="margin-bottom: 16px"
      >
        <template #title>
          获取密钥请访问：
          <el-link
            type="primary"
            href="https://www.geetest.com/"
            target="_blank"
          >
            极验官网
          </el-link>
        </template>
      </el-alert>

      <el-form-item label="Captcha ID（验证 ID）">
        <el-input
          v-model="model.geetest.captchaId"
          placeholder="请输入极验 Captcha ID"
        />
        <div class="el-form-item__info">
          从极验后台获取的验证 ID，用于前端初始化验证组件
        </div>
      </el-form-item>

      <el-form-item label="Captcha Key（验证 Key）">
        <el-input
          v-model="model.geetest.captchaKey"
          type="password"
          show-password
          placeholder="请输入极验 Captcha Key"
        />
        <div class="el-form-item__info">
          从极验后台获取的验证 Key，用于后端二次验证，请妥善保管
        </div>
      </el-form-item>
    </template>

    <!-- 系统验证码配置 -->
    <template v-else-if="currentProvider === 'image'">
      <el-divider content-position="left">系统图形验证码配置</el-divider>

      <el-alert
        type="success"
        :closable="false"
        style="margin-bottom: 16px"
      >
        <template #title>
          系统内置的图形验证码，无需第三方服务，简单易用
        </template>
      </el-alert>

      <el-form-item label="验证码长度">
        <el-input-number
          v-model="model.imageCaptcha.length"
          :min="4"
          :max="8"
          :step="1"
        />
        <div class="el-form-item__info">
          验证码字符数量，建议 4-6 位
        </div>
      </el-form-item>

      <el-form-item label="过期时间（秒）">
        <el-input-number
          v-model="model.imageCaptcha.expire"
          :min="60"
          :max="600"
          :step="30"
        />
        <div class="el-form-item__info">
          验证码有效时间，超时后需要重新获取
        </div>
      </el-form-item>
    </template>

    <!-- 不启用时的提示 -->
    <template v-else-if="currentProvider === 'none'">
      <el-alert
        title="提示"
        type="warning"
        :closable="false"
        style="margin-top: 16px"
      >
        <template #default>
          <p style="margin: 0">
            未启用人机验证，登录、注册等功能将不受人机验证保护。
            建议在生产环境中启用人机验证以提高安全性。
          </p>
        </template>
      </el-alert>
    </template>

    <el-divider content-position="left">使用说明</el-divider>

    <div class="help-section">
      <h4>验证方式对比</h4>
      <table class="comparison-table">
        <thead>
          <tr>
            <th>特性</th>
            <th>Turnstile</th>
            <th>极验</th>
            <th>系统验证码</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>免费</td>
            <td>是</td>
            <td>有免费额度</td>
            <td>是</td>
          </tr>
          <tr>
            <td>无感验证</td>
            <td>支持</td>
            <td>支持</td>
            <td>不支持</td>
          </tr>
          <tr>
            <td>第三方依赖</td>
            <td>Cloudflare</td>
            <td>极验</td>
            <td>无</td>
          </tr>
          <tr>
            <td>用户体验</td>
            <td>优秀</td>
            <td>优秀</td>
            <td>一般</td>
          </tr>
          <tr>
            <td>安全性</td>
            <td>高</td>
            <td>高</td>
            <td>中</td>
          </tr>
        </tbody>
      </table>

      <h4>应用场景</h4>
      <ul>
        <li>用户登录</li>
        <li>用户注册</li>
        <li>忘记密码 / 发送重置邮件</li>
        <li>订阅博客 / 发送验证码</li>
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

.help-section ul {
  margin: 0;
  padding-left: 20px;
}

.help-section li {
  margin-bottom: 6px;
  color: var(--anzhiyu-secondfontcolor);
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
}

.comparison-table th,
.comparison-table td {
  padding: 8px 12px;
  text-align: left;
  border: 1px solid var(--anzhiyu-border-color);
}

.comparison-table th {
  background-color: var(--anzhiyu-card-bg);
  font-weight: 600;
  color: var(--anzhiyu-fontcolor);
}

.comparison-table td {
  color: var(--anzhiyu-secondfontcolor);
}
</style>
