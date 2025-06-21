<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-21 18:36:57
 * @LastEditTime: 2025-06-21 18:39:51
 * @LastEditors: 安知鱼
-->
<template>
  <el-divider content-position="left">
    <h3>用户设置</h3>
  </el-divider>

  <el-form-item>
    <template #label>
      <span>开放新用户注册</span>
      <div class="form-item-help">关闭后，将无法通过注册页面创建新用户。</div>
    </template>
    <el-switch
      v-model="formData.enableRegistration"
      active-text="开启"
      inactive-text="关闭"
    />
  </el-form-item>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { UserSessionInfo } from "../index.vue";

const props = defineProps<{
  modelValue: UserSessionInfo;
}>();

const emit = defineEmits(["update:modelValue"]);

const formData = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});
</script>

<style scoped lang="scss">
// 样式与 BaseInfoForm 和 IconSettingsForm 相同
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
