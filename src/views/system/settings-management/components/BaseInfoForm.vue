<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-21 18:04:30
 * @LastEditTime: 2025-06-22 00:32:46
 * @LastEditors: 安知鱼
-->
<template>
  <h1>基本信息</h1>

  <el-form-item label="站点名称">
    <el-input v-model="formData.siteName" placeholder="请输入站点名称" />
    <div class="form-item-help">站点的名称。</div>
  </el-form-item>

  <el-form-item label="站点描述">
    <el-input
      v-model="formData.siteDescription"
      type="textarea"
      :rows="3"
      placeholder="请输入站点描述"
    />
    <div class="form-item-help">站点描述信息，可能会在分享页面摘要内展示。</div>
  </el-form-item>

  <el-form-item>
    <template #label>
      <span>站点 URL</span>
      <div class="form-item-help" style="margin-top: 0">
        主要站点 URL 用于与外部服务通信和接受回调，请使用能被公网访问的 URL。
      </div>
    </template>
    <el-input
      v-model="formData.primaryUrl"
      placeholder="例如：https://album.anheyu.com"
    />
  </el-form-item>

  <el-form-item label="页脚代码">
    <el-input
      v-model="formData.footerCode"
      type="textarea"
      :rows="4"
      placeholder="可在此处添加网站统计代码等"
    />
    <div class="form-item-help">在页面底部插入的自定义 HTML 代码。</div>
  </el-form-item>

  <el-form-item label="站点公告">
    <el-input
      v-model="formData.announcement"
      type="textarea"
      :rows="3"
      placeholder="请输入站点公告"
    />
    <div class="form-item-help">
      展示给全体用户（包括匿名用户）的公告，留空不展示。当此项内容更改时，所有用户会重新看到公告。
    </div>
  </el-form-item>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { SiteInfo } from "../index.vue";

const props = defineProps<{
  modelValue: SiteInfo;
}>();

const emit = defineEmits(["update:modelValue"]);

// 使用 computed 来实现 props 和本地数据状态的双向绑定
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
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
  margin-top: 4px;
}

.el-divider {
  margin: 40px 0 28px 0;
  h3 {
    margin: 0;
    color: #606266;
  }
}
</style>
