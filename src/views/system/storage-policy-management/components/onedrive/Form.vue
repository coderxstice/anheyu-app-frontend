<script setup lang="ts">
import { ref, watch } from "vue";
import { type StoragePolicy } from "@/api/sys-policy";

const formData = defineModel<Partial<StoragePolicy>>({ required: true });
if (!formData.value.settings) {
  formData.value.settings = {};
}

// --- chunk_size 单位换算逻辑 ---
const units = [
  { label: "MB", value: 1024 * 1024 },
  { label: "GB", value: 1024 * 1024 * 1024 }
];
const chunkSizeValue = ref(50);
const chunkSizeUnit = ref(1024 * 1024);

function bytesToHuman(bytes: number): [number, number] {
  // 如果未设置或为0，默认显示为 50 MB (后端默认值)
  if (!bytes) return [50, 1024 * 1024];
  for (let i = units.length - 1; i >= 0; i--) {
    const unit = units[i];
    if (bytes >= unit.value && bytes % unit.value === 0) {
      return [bytes / unit.value, unit.value];
    }
  }
  const mbValue = 1024 * 1024;
  return [parseFloat((bytes / mbValue).toFixed(2)), mbValue];
}

// 监听UI变化，更新 formData
watch([chunkSizeValue, chunkSizeUnit], ([newSize, newUnit]) => {
  if (!formData.value.settings) formData.value.settings = {};
  formData.value.settings.chunk_size = Math.round(newSize * newUnit);
});

// 监听 formData 变化，更新UI (关键：用于初始化编辑数据)
watch(
  () => formData.value.settings?.chunk_size,
  newChunkSize => {
    [chunkSizeValue.value, chunkSizeUnit.value] = bytesToHuman(
      newChunkSize ?? 0
    );
  },
  { immediate: true }
);
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
      <el-input
        v-model="formData.secret_key"
        type="password"
        show-password
        placeholder="请输入客户端密码"
      />
      <div class="form-item-help">
        密码在保存后将不会再次显示。如需修改，请直接输入新密码。
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

    <el-divider><h2 class="divider-title">路径与性能</h2></el-divider>

    <el-form-item label="云端存储根目录" prop="base_path">
      <el-input
        v-model="formData.base_path"
        placeholder="例如 /YuyuAlbum/Work"
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

    <el-form-item label="上传分块大小" prop="settings.chunk_size">
      <el-input v-model.number="chunkSizeValue" :min="0" style="width: 180px">
        <template #append>
          <el-select v-model="chunkSizeUnit" style="width: 80px">
            <el-option
              v-for="u in units"
              :key="u.value"
              :label="u.label"
              :value="u.value"
            />
          </el-select>
        </template>
      </el-input>
      <div class="form-item-help">
        上传大文件时的分块大小，0 表示使用后端默认值。
      </div>
    </el-form-item>
  </div>
</template>

<style scoped>
.divider-title {
  font-size: 16px;
  font-weight: bold;
}
.form-item-help {
  color: #999;
  font-size: 12px;
  line-height: 1.5;
  margin-top: 4px;
}
</style>
