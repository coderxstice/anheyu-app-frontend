<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-02 18:04:48
 * @LastEditTime: 2025-10-16 10:22:03
 * @LastEditors: 安知鱼
-->
<template>
  <el-divider content-position="left">
    <h3>文章配置</h3>
  </el-divider>

  <el-form-item label="默认cover图片">
    <el-input
      v-model="formData.default.defaultCover"
      placeholder="请输入默认cover图片地址"
    />
    <div class="form-item-help">
      用于文章未填写cover或者cover图片加载失败时的默认图片。
    </div>
  </el-form-item>

  <el-form-item label="默认双栏样式">
    <el-switch
      v-model="formData.default.doubleColumn"
      placeholder="例如：true"
    />
  </el-form-item>

  <el-form-item label="文章过期时间">
    <el-input-number
      v-model="formData.expirationTime"
      :min="1"
      controls-position="right"
      style="width: 100%"
      placeholder="例如: 365"
      :style="{ width: '100px' }"
    />
    <div class="form-item-help">
      文章过期时间，单位为天。<br />
      <strong>不填则没有过期时间组件展示。</strong>
    </div>
  </el-form-item>

  <el-form-item label="文章列表分页大小">
    <el-input-number
      v-model="formData.default.pageSize"
      :min="6"
      controls-position="right"
      style="width: 100%"
      placeholder="例如: 10"
      :style="{ width: '100px' }"
    />
  </el-form-item>

  <el-form-item label="IP属地查询 API 地址">
    <el-input
      v-model="formData.ipApi"
      placeholder="例如：https://api.nsmao.net/api/ipip/query"
    />
    <div class="form-item-help">
      用于在发布/更新文章时获取IP属地信息的 API 地址。
    </div>
  </el-form-item>

  <el-form-item label="IP属地查询 API Token">
    <el-input
      v-model="formData.ipApiToken"
      placeholder="请输入IP属地查询 API Token"
      show-password
    />
    <div class="form-item-help">
      配合 IP 属地查询 API 使用的 Token (如有)。
      <br />
      <strong
        >注意：当 API 地址和 Token 均被配置时，发布和更新文章才会调用此 API
        来获取城市信息。</strong
      >
    </div>
  </el-form-item>

  <el-form-item label="是否开启文章打赏功能">
    <el-switch v-model="formData.reward.enable" placeholder="例如：true" />
  </el-form-item>

  <el-form-item label="文章打赏微信二维码图片">
    <el-input
      v-model="formData.reward.weChat"
      placeholder="请输入文章打赏微信二维码图片链接地址"
    />
  </el-form-item>

  <el-form-item label="文章打赏支付宝二维码图片">
    <el-input
      v-model="formData.reward.aliPay"
      placeholder="请输入文章打赏支付宝二维码图片链接地址"
    />
  </el-form-item>

  <el-form-item label="代码块最大行数">
    <el-input-number
      v-model="formData.codeBlock.codeMaxLines"
      :min="1"
      :max="1000"
      controls-position="right"
      style="width: 100px"
      placeholder="例如: 50"
    />
    <div class="form-item-help">
      代码块超过此行数时将显示滚动条，默认为10行。
    </div>
  </el-form-item>

  <el-divider content-position="left">
    <h3>CDN 缓存刷新配置</h3>
  </el-divider>

  <el-form-item label="启用 CDN 缓存刷新">
    <div>
      <el-switch v-model="formData.cdn.enable" placeholder="例如：true" />
      <div class="form-item-help">
        启用后，文章更新或相关配置修改时会自动清除 CDN
        缓存，确保用户看到最新内容。
      </div>
    </div>
  </el-form-item>

  <el-form-item label="CDN 提供商">
    <div>
      <el-select
        v-model="formData.cdn.provider"
        placeholder="请选择 CDN 提供商"
        style="width: 200px"
      >
        <el-option label="腾讯云 CDN" value="tencent" />
        <el-option label="EdgeOne" value="edgeone" />
        <el-option label="阿里云 ESA" value="aliyun-esa" />
      </el-select>
      <div class="form-item-help">
        选择您使用的 CDN 服务提供商。目前支持腾讯云 CDN、EdgeOne 和阿里云 ESA。
      </div>
    </div>
  </el-form-item>

  <el-form-item
    :label="
      formData.cdn.provider === 'aliyun-esa'
        ? 'AccessKey ID'
        : '腾讯云 API 密钥 ID'
    "
  >
    <el-input
      v-model="formData.cdn.secretID"
      :placeholder="
        formData.cdn.provider === 'aliyun-esa'
          ? '请输入 AccessKey ID'
          : '请输入 SecretId'
      "
      show-password
    />
    <div class="form-item-help">
      <template v-if="formData.cdn.provider === 'aliyun-esa'">
        阿里云 API 密钥的 AccessKey ID。<br />
        <strong> 可在阿里云控制台的"AccessKey 管理"中创建和获取。 </strong>
      </template>
      <template v-else>
        腾讯云 API 密钥的 SecretId。<br />
        <strong>
          可在腾讯云控制台的"访问管理 > 访问密钥 > API密钥管理"中获取。
        </strong>
      </template>
    </div>
  </el-form-item>

  <el-form-item
    :label="
      formData.cdn.provider === 'aliyun-esa'
        ? 'AccessKey Secret'
        : '腾讯云 API 密钥 Key'
    "
  >
    <el-input
      v-model="formData.cdn.secretKey"
      :placeholder="
        formData.cdn.provider === 'aliyun-esa'
          ? '请输入 AccessKey Secret'
          : '请输入 SecretKey'
      "
      show-password
    />
    <div class="form-item-help">
      <template v-if="formData.cdn.provider === 'aliyun-esa'">
        阿里云 API 密钥的 AccessKey Secret。<br />
      </template>
      <template v-else> 腾讯云 API 密钥的 SecretKey。<br /> </template>
      <strong>请妥善保管，不要泄露给他人。</strong>
    </div>
  </el-form-item>

  <el-form-item
    v-if="formData.cdn.provider !== 'aliyun-esa'"
    label="腾讯云地域"
  >
    <el-input v-model="formData.cdn.region" placeholder="例如：ap-beijing" />
    <div class="form-item-help">
      腾讯云服务地域标识。<br />
      常用地域：ap-beijing（北京）、ap-shanghai（上海）、ap-guangzhou（广州）、ap-singapore（新加坡）。<br />
      <strong>EdgeOne 默认使用 ap-singapore。</strong>
    </div>
  </el-form-item>

  <el-form-item v-if="formData.cdn.provider === 'tencent'" label="CDN 加速域名">
    <el-input
      v-model="formData.cdn.domain"
      placeholder="例如：blog.example.com"
    />
    <div class="form-item-help">
      腾讯云 CDN 的加速域名（不含 http:// 或 https://）。<br />
      <strong>仅腾讯云 CDN 需要配置此项。</strong>
    </div>
  </el-form-item>

  <el-form-item
    v-if="formData.cdn.provider === 'edgeone'"
    label="EdgeOne 站点 ID"
  >
    <el-input
      v-model="formData.cdn.zoneID"
      placeholder="例如：zone-xxxxxxxxxxxx"
    />
    <div class="form-item-help">
      EdgeOne 站点的 Zone ID。<br />
      可在 EdgeOne 控制台的"站点列表"中查看。<br />
      <strong>仅 EdgeOne 需要配置此项。</strong>
    </div>
  </el-form-item>

  <el-form-item
    v-if="formData.cdn.provider === 'aliyun-esa'"
    label="阿里云 ESA 站点 ID"
  >
    <el-input v-model="formData.cdn.zoneID" placeholder="例如：123456789" />
    <div class="form-item-help">
      阿里云 ESA 的站点 ID（Site ID）。<br />
      可在阿里云 ESA 控制台的"站点管理"中查看。<br />
      <strong>仅阿里云 ESA 需要配置此项。</strong>
    </div>
  </el-form-item>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PostSettingsInfo } from "../../type";
const props = defineProps<{
  modelValue: PostSettingsInfo;
}>();

const emit = defineEmits(["update:modelValue"]);

const formData = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});
</script>

<style scoped lang="scss">
.el-form-item {
  margin-bottom: 24px;
}

.form-item-help {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: #909399;
}

.el-divider {
  margin: 40px 0 28px;

  h3 {
    margin: 0;
    color: #606266;
  }
}
</style>
