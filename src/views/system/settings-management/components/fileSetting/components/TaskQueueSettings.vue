<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-07-24 18:08:26
 * @LastEditTime: 2025-07-24 18:08:30
 * @LastEditors: 安知鱼
-->
<!-- src/components/file-settings/TaskQueueSettings.vue -->
<template>
  <h2>任务队列</h2>
  <el-form-item label="队列并发数" class="short-input">
    <el-input-number v-model="formData.queueThumbConcurrency" :min="1" />
    <div class="form-item-help">同时处理任务的最大工作线程数。</div>
  </el-form-item>
  <el-form-item label="任务最大执行时间（秒）" class="short-input">
    <el-input-number v-model="formData.queueThumbMaxExecTime" :min="1" />
    <div class="form-item-help">单个任务超时前可以运行的最长时间。</div>
  </el-form-item>
  <el-form-item label="任务最大重试次数" class="short-input">
    <el-input-number v-model="formData.queueThumbMaxRetries" :min="0" />
    <div class="form-item-help">任务失败后的最大重试次数（0表示不重试）。</div>
  </el-form-item>
  <el-form-item label="任务重试初始延迟（秒）" class="short-input">
    <el-input-number v-model="formData.queueThumbRetryDelay" :min="1" />
    <div class="form-item-help">任务首次重试前的等待时间。</div>
  </el-form-item>
  <el-form-item label="任务重试退避因子" class="short-input">
    <el-input-number v-model="formData.queueThumbBackoffFactor" :min="1" />
    <div class="form-item-help">后续重试时间间隔的指数增长因子。</div>
  </el-form-item>
  <el-form-item label="任务重试最大退避时间（秒）" class="short-input">
    <el-input-number v-model="formData.queueThumbMaxBackoff" :min="1" />
    <div class="form-item-help">任务重试间隔的最长时间。</div>
  </el-form-item>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElFormItem, ElInputNumber } from "element-plus";
import type { FileSettingsInfo } from "../../../type";

const props = defineProps<{
  modelValue: FileSettingsInfo;
}>();

const emit = defineEmits(["update:modelValue"]);

const formData = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});
</script>

<style scoped>
.short-input {
  max-width: 400px;
}

h2 {
  padding-bottom: 8px;
  margin-top: 40px;
  margin-bottom: 20px;
  font-size: 1.2em;
  font-weight: 600;
  border-bottom: var(--style-border-always);

  &:first-child {
    margin-top: 10px;
  }
}
</style>
