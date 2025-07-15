<script setup lang="ts">
import { type StoragePolicy } from "@/api/sys-policy";
const formData = defineModel<Partial<StoragePolicy>>({ required: true });
if (!formData.value.settings) formData.value.settings = {};
</script>
<template>
  <div>
    <el-divider><h2 class="divider-title">账号设置</h2></el-divider>
    <el-form-item label="Microsoft Graph 端点" prop="settings.endpoint">
      <el-select
        v-model="formData.settings.endpoint"
        placeholder="请选择 Graph API 端点"
      >
        <el-option
          label="公有 (国际版)"
          value="https://graph.microsoft.com/v1.0"
        />
        <el-option
          label="世纪互联"
          value="https://microsoftgraph.chinacloudapi.cn/v1.0"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="应用(客户端) ID" prop="settings.client_id">
      <el-input
        v-model="formData.settings.client_id"
        placeholder="请输入在 Azure AD 申请的ID"
      />
    </el-form-item>
    <el-form-item label="客户端密码" prop="settings.client_secret">
      <el-input
        v-model="formData.settings.client_secret"
        type="password"
        show-password
        placeholder="请输入客户端密码"
      />
    </el-form-item>
  </div>
</template>
<style scoped>
.divider-title {
  font-size: 16px;
  font-weight: bold;
}
</style>
