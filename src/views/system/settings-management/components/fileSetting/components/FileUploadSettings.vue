<!-- src/components/file-settings/FileUploadSettings.vue -->
<template>
  <h2>文件上传</h2>
  <el-form-item label="允许上传的扩展名">
    <el-input
      v-model="formData.uploadAllowedExtensions"
      type="textarea"
      :rows="3"
      placeholder="例如: jpg,jpeg,png,gif"
    />
    <div class="form-item-help">
      白名单模式，仅允许列表中的文件类型上传。留空则允许所有类型（黑名单生效时除外）。多个请使用半角逗号
      , 隔开。
    </div>
  </el-form-item>
  <el-form-item label="禁止上传的扩展名">
    <el-input
      v-model="formData.uploadDeniedExtensions"
      type="textarea"
      :rows="3"
      placeholder="例如: exe,bat,sh"
    />
    <div class="form-item-help">
      黑名单模式，在白名单未设置时生效。多个请使用半角逗号 , 隔开。
    </div>
  </el-form-item>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElInput, ElFormItem } from "element-plus";
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
