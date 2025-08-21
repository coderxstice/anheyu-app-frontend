<!--
 * @Description: 本地存储配置表单
 * @Author: 安知鱼
 * @Date: 2025-07-15 15:36:48
 * @LastEditTime: 2025-07-16 16:52:55
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { type StoragePolicy } from "@/api/sys-policy";
const formData = defineModel<Partial<StoragePolicy>>({ required: true });
</script>
<template>
  <el-form-item label="Blob 挂载目录" prop="virtual_path">
    <el-input
      v-model="formData.virtual_path"
      placeholder="例如: /uploads"
      disabled
    />
    <div class="form-item-help">
      存储到本系统内对应的挂载路径，需要确保唯一。
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
  color: #999;
}
</style>
