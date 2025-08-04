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

  <el-form-item label="文章列表分页大小">
    <el-input-number
      v-model="formData.default.pageSize"
      :min="1"
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
      placeholder="例如：Kq1pRjB3WyDja7rhKcWV9f5QU8"
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
