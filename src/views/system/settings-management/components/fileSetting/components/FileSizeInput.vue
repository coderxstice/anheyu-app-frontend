<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-07-24 17:55:10
 * @LastEditTime: 2025-08-12 14:32:39
 * @LastEditors: 安知鱼
-->
<!-- src/components/file-settings/FileSizeInput.vue -->
<template>
  <el-input v-model="size.value" :placeholder="placeholder">
    <template #append>
      <el-select v-model="size.unit" style="width: 80px">
        <el-option label="MB" value="MB" />
        <el-option label="GB" value="GB" />
      </el-select>
    </template>
  </el-input>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElInput, ElSelect, ElOption } from "element-plus";

const props = defineProps<{
  modelValue: string; // The value is always in bytes as a string
  placeholder?: string;
}>();

const emit = defineEmits(["update:modelValue"]);

const MB_BYTES = 1024 * 1024;
const GB_BYTES = 1024 * 1024 * 1024;

// Converts bytes to { value, unit } and back, for the UI
const size = computed({
  get() {
    const bytes = Number(props.modelValue);
    if (isNaN(bytes) || bytes === 0) {
      return { value: "0", unit: "MB" };
    }
    // Prefer GB if it's a clean multiple
    if (bytes >= GB_BYTES && bytes % GB_BYTES === 0) {
      return { value: String(bytes / GB_BYTES), unit: "GB" };
    }
    // Default to MB
    return { value: String(bytes / MB_BYTES), unit: "MB" };
  },
  set(newValue) {
    const numValue = Number(newValue.value);
    if (isNaN(numValue) || numValue <= 0) {
      emit("update:modelValue", "0");
      return;
    }
    const bytes =
      newValue.unit === "GB"
        ? String(numValue * GB_BYTES)
        : String(numValue * MB_BYTES);
    emit("update:modelValue", bytes);
  }
});
</script>

<style scoped>
:deep(.el-input-group__append .el-select .el-input__wrapper) {
  box-shadow: none !important;
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
