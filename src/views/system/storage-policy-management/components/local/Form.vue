<!--
 * @Description: 本地存储配置表单
 * @Author: 安知鱼
 * @Date: 2025-07-15 15:36:48
 * @LastEditTime: 2025-07-16 16:52:55
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { computed } from "vue";
import { type StoragePolicy } from "@/api/sys-policy";
const formData = defineModel<Partial<StoragePolicy>>({ required: true });

// 如果 virtual_path 为 "/"，则禁用编辑
const isVirtualPathDisabled = computed(() => {
  return formData.value.virtual_path === "/";
});
</script>
<template>
  <el-form-item label="Blob 挂载目录" prop="virtual_path">
    <el-input
      v-model="formData.virtual_path"
      placeholder="例如: /uploads"
      :disabled="isVirtualPathDisabled"
    />
    <div class="form-item-help">
      存储到本系统内对应的挂载路径，需要确保唯一。
      <span v-if="isVirtualPathDisabled" style="color: #f56c6c">
        （根目录挂载策略不允许修改挂载路径）
      </span>
    </div>
  </el-form-item>
  <el-form-item label="Blob 存储目录" prop="base_path">
    <el-input
      v-model="formData.base_path"
      placeholder="例如: /www/storage/uploads"
    />
    <div class="form-item-help">文件 Blob 的实际存放物理目录。</div>
  </el-form-item>
</template>
<style scoped>
.form-item-help {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--anzhiyu-secondfontcolor);
}
</style>
