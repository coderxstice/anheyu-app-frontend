<!--
 * @Description: 微信分享配置表单
 * @Author: 安知鱼
 * @Date: 2026-01-24
-->
<script setup lang="ts">
import type { WechatShareSettingsInfo } from "../../../type";

defineOptions({
  name: "WechatShareSettingsForm"
});

const model = defineModel<WechatShareSettingsInfo>({ required: true });
</script>

<template>
  <div>
    <el-alert
      title="微信分享配置"
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 20px"
    >
      <template #default>
        <p style="margin: 0">
          启用微信分享功能后，用户在微信内分享文章时将显示带有自定义标题、描述和图片的卡片样式。
        </p>
        <p style="margin: 8px 0 0">
          需要在微信公众平台配置 JS 安全域名，并获取 AppID 和 AppSecret。
        </p>
      </template>
    </el-alert>

    <el-divider content-position="left">基础配置</el-divider>

    <el-form-item label="启用微信分享">
      <el-switch v-model="model.enable" />
      <div class="el-form-item__info">
        开启后，微信内访问文章时将启用自定义分享卡片功能
      </div>
    </el-form-item>

    <template v-if="model.enable">
      <el-divider content-position="left">微信公众号配置</el-divider>

      <el-alert type="success" :closable="false" style="margin-bottom: 16px">
        <template #title>
          获取密钥请访问：
          <el-link
            type="primary"
            href="https://mp.weixin.qq.com/"
            target="_blank"
          >
            微信公众平台
          </el-link>
          → 设置与开发 → 基本配置
        </template>
      </el-alert>

      <el-form-item label="AppID（应用ID）">
        <el-input v-model="model.appId" placeholder="请输入微信公众号 AppID" />
        <div class="el-form-item__info">
          微信公众号的唯一标识，从公众平台「开发 → 基本配置」获取
        </div>
      </el-form-item>

      <el-form-item label="AppSecret（应用密钥）">
        <el-input
          v-model="model.appSecret"
          type="password"
          show-password
          placeholder="请输入微信公众号 AppSecret"
        />
        <div class="el-form-item__info">
          微信公众号的密钥，用于生成 JS-SDK 签名，请妥善保管，不要泄露
        </div>
      </el-form-item>
    </template>

    <el-divider content-position="left">配置说明</el-divider>

    <div class="help-section">
      <h4>前置条件</h4>
      <ol>
        <li>需要一个已认证的微信公众号（服务号或订阅号）</li>
        <li>
          在公众平台「设置与开发 → 公众号设置 → 功能设置」中配置 JS 接口安全域名
        </li>
        <li>安全域名需要与网站域名一致（不包含协议和端口）</li>
      </ol>

      <h4>配置步骤</h4>
      <ol>
        <li>
          登录
          <a href="https://mp.weixin.qq.com/" target="_blank">微信公众平台</a>
        </li>
        <li>进入「设置与开发 → 基本配置」，获取 AppID 和 AppSecret</li>
        <li>
          进入「设置与开发 → 公众号设置 → 功能设置」，添加 JS 接口安全域名
        </li>
        <li>将 AppID 和 AppSecret 填入上方配置项</li>
        <li>保存配置并重启应用</li>
      </ol>

      <h4>功能效果</h4>
      <ul>
        <li>在微信内分享文章链接时显示自定义卡片</li>
        <li>卡片包含文章标题、摘要和封面图</li>
        <li>支持分享到聊天、朋友圈、收藏等场景</li>
      </ul>

      <h4>注意事项</h4>
      <ul>
        <li>AppSecret 是敏感信息，请勿在前端代码或日志中暴露</li>
        <li>JS 接口安全域名每月只能修改 5 次，请谨慎操作</li>
        <li>配置生效可能需要几分钟时间</li>
        <li>仅在微信内置浏览器中生效，其他浏览器不受影响</li>
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

.help-section ul,
.help-section ol {
  margin: 0;
  padding-left: 20px;
}

.help-section li {
  margin-bottom: 6px;
  color: var(--anzhiyu-secondfontcolor);
}

.help-section a {
  color: var(--anzhiyu-main);
  text-decoration: none;
}

.help-section a:hover {
  text-decoration: underline;
}
</style>
