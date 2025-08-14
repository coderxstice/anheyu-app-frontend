<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-14 10:18:35
 * @LastEditTime: 2025-08-14 10:18:41
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { Setting } from "@element-plus/icons-vue";

defineProps<{
  isSubmitting: boolean;
  isEditMode: boolean;
  status?: string;
}>();

const emit = defineEmits(["save", "publish", "open-settings"]);
</script>

<template>
  <div class="action-buttons">
    <el-button :loading="isSubmitting" @click="emit('save')"
      >存为草稿</el-button
    >
    <el-button type="primary" :loading="isSubmitting" @click="emit('publish')">
      {{ isEditMode && status === "PUBLISHED" ? "更新发布" : "直接发布" }}
    </el-button>
    <el-divider direction="vertical" />
    <el-tooltip content="文章设置" placement="bottom">
      <el-button :icon="Setting" circle @click="emit('open-settings')" />
    </el-tooltip>
  </div>
</template>

<style lang="scss" scoped>
.action-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
