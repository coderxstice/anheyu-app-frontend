<script setup lang="ts">
import { type StoragePolicy } from "@/api/sys-policy";

// [FIXED] 将 defineModel 的返回值赋给一个变量 (例如 formData)，
// 这个变量就是一个带有正确类型的 ref。
const formData = defineModel<Partial<StoragePolicy>>({ required: true });

// 确保 settings 对象存在，防止模板中访问 undefined.xxx 而报错
if (!formData.value.settings) {
  formData.value.settings = {};
}
</script>

<template>
  <div>
    <el-divider><h2 class="divider-title">账号设置</h2></el-divider>

    <el-form-item label="Microsoft Graph 端点" prop="server">
      <el-select v-model="formData.server" placeholder="请选择 Graph API 端点">
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

    <el-form-item label="应用(客户端) ID" prop="bucket_name">
      <el-input
        v-model="formData.bucket_name"
        placeholder="请输入在 Azure AD 申请的ID"
      />
    </el-form-item>

    <el-form-item label="客户端密码" prop="secret_key">
      <el-input v-model="formData.secret_key" placeholder="请输入客户端密码" />
      <div class="form-item-help">
        即您在 Azure AD 中申请的应用的 Client Secret。
      </div>
    </el-form-item>

    <el-form-item label="OneDrive 类型" prop="settings.drive_type">
      <el-radio-group v-model="formData.settings.drive_type">
        <el-radio-button value="default">个人/商业版 Drive</el-radio-button>
        <el-radio-button value="sharepoint">SharePoint 文档库</el-radio-button>
      </el-radio-group>
    </el-form-item>

    <el-form-item
      v-if="formData.settings.drive_type === 'sharepoint'"
      label="SharePoint Drive ID"
      prop="settings.drive_id"
    >
      <el-input v-model="formData.settings.drive_id" />
      <div class="form-item-help">
        如果类型为 SharePoint，则需要提供目标文档库的 Drive ID。
      </div>
    </el-form-item>

    <el-divider><h2 class="divider-title">路径设置</h2></el-divider>

    <el-form-item label="云端存储根目录" prop="base_path">
      <el-input
        v-model="formData.base_path"
        placeholder="例如 /anheyuAlbum/Work"
      />
      <div class="form-item-help">
        文件在 OneDrive 中的存放根目录，以 / 开头。
      </div>
    </el-form-item>

    <el-form-item label="应用内挂载路径" prop="virtual_path">
      <el-input
        v-model="formData.virtual_path"
        placeholder="例如 /my-onedrive"
      />
      <div class="form-item-help">此策略在应用内部的访问路径，需保证唯一。</div>
    </el-form-item>
  </div>
</template>

<style scoped>
.divider-title {
  font-size: 16px;
  font-weight: bold;
}

.form-item-help {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: #999;
}
</style>
