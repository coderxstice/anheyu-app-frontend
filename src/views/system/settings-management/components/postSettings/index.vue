<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-02 18:04:48
 * @LastEditTime: 2025-08-20 13:17:25
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

  <el-form-item label="文章主色调 API 地址">
    <el-input
      v-model="formData.theme.primaryColorApiUrl"
      placeholder="例如：https://api.nsmao.net/api/img2color/query"
    />
    <div class="form-item-help">
      用于在发布/更新文章时获取主色调信息的 API 地址。
    </div>
  </el-form-item>

  <el-form-item label="文章主色调 API Token">
    <el-input
      v-model="formData.theme.primaryColorApiToken"
      placeholder="请输入文章主色调 API Token"
      show-password
    />
    <div class="form-item-help">
      配合文章主色调 API 使用的 Token (如有)。
      <br />
      <strong
        >注意：当 API 地址和 Token 均被配置时，发布和更新文章才会调用此 API
        来获取主色调信息。</strong
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
