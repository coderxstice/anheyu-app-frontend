<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { type StoragePolicy } from "@/api/sys-policy";

const myInput = ref(null);

const emit = defineEmits<{
  (e: "submit", payload: Partial<StoragePolicy>): void;
}>();

const formRef = ref<FormInstance>();
const formData = ref<Partial<StoragePolicy>>({
  type: "onedrive",
  name: "",
  server: "https://graph.microsoft.com/v1.0", // 对应 server
  bucket_name: "", // 对应 bucket_name (Client ID)
  secret_key: "", // 对应 secret_key (Client Secret)
  base_path: "/YuyuAlbum", // OneDrive 内根目录
  virtual_path: "/onedrive", // 应用内挂载点
  settings: {
    drive_type: "default",
    chunk_size: 52428800 // 50MB 默认值
  }
});

const units = [
  { label: "MB", value: 1024 * 1024 },
  { label: "GB", value: 1024 * 1024 * 1024 }
];
const chunkSizeValue = ref(50);
const chunkSizeUnit = ref(1024 * 1024);
watch([chunkSizeValue, chunkSizeUnit], ([newSize, newUnit]) => {
  if (!formData.value.settings) formData.value.settings = {};
  formData.value.settings.chunk_size = Math.round(newSize * newUnit);
});

const portalLinks = {
  "https://graph.microsoft.com/v1.0":
    "https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/Overview",
  "https://microsoftgraph.chinacloudapi.cn/v1.0":
    "https://portal.azure.cn/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/Overview"
};

const dynamicPortalLink = computed(() => {
  // 修正：依赖顶层的 server 字段
  return (
    portalLinks[formData.value.server] ||
    portalLinks["https://graph.microsoft.com/v1.0"]
  );
});

const rules = reactive<FormRules>({
  name: [{ required: true, message: "策略名称不能为空", trigger: "blur" }],
  bucket_name: [
    { required: true, message: "应用(客户端) ID 不能为空", trigger: "blur" }
  ],
  secret_key: [
    { required: true, message: "客户端密码不能为空", trigger: "blur" }
  ],
  base_path: [
    { required: true, message: "云端存储根目录不能为空", trigger: "blur" }
  ],
  virtual_path: [
    { required: true, message: "应用内挂载路径不能为空", trigger: "blur" }
  ],
  "settings.drive_id": [
    { required: true, message: "SharePoint Drive ID 不能为空", trigger: "blur" }
  ]
});

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(valid => {
    if (valid) {
      emit("submit", formData.value);
    }
  });
};

onMounted(() => {
  setTimeout(() => myInput.value?.focus(), 100);
});

defineExpose({ submitForm });
</script>

<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-position="top"
    class="create-form"
  >
    <el-form-item label="名称" prop="name">
      <el-input ref="myInput" v-model="formData.name" />
      <div class="form-item-help">存储策略的展示名，也会用于向用户展示。</div>
    </el-form-item>

    <el-form-item label="应用内挂载路径" prop="virtual_path">
      <el-input
        v-model="formData.virtual_path"
        placeholder="例如 /my-onedrive"
      />
      <div class="form-item-help">此策略在应用内部的访问路径，需保证唯一。</div>
    </el-form-item>

    <el-form-item label="云端存储根目录" prop="base_path">
      <el-input
        v-model="formData.base_path"
        placeholder="例如 /YuyuAlbum/Work"
      />
      <div class="form-item-help">
        文件在 OneDrive 中的存放根目录，以 / 开头。
      </div>
    </el-form-item>

    <el-form-item label="Microsoft Graph 端点" prop="server">
      <el-select v-model="formData.server" style="width: 100%">
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

    <div class="info-block">
      <h3>Entra ID 应用信息</h3>
      <p>
        前往
        <el-link type="primary" :href="dynamicPortalLink" target="_blank"
          >Microsoft Entra ID 控制台</el-link
        >
        并登录，进行应用注册。
      </p>
    </div>

    <el-form-item label="应用(客户端) ID" prop="bucket_name">
      <el-input v-model="formData.bucket_name" />
      <div class="form-item-help">
        即您在 Azure AD 中申请的应用的 Client ID。
      </div>
    </el-form-item>

    <el-form-item label="客户端密码" prop="secret_key">
      <el-input v-model="formData.secret_key" />
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

    <div class="info-block">
      <h3>账号授权</h3>
      <p>点击下方按钮创建存储策略后，还需要在存储策略设置页面进行账号授权。</p>
    </div>
  </el-form>
</template>

<style lang="scss" scoped>
.create-form {
  padding: 0 10px;
}
.form-item-help {
  color: #999;
  font-size: 12px;
  line-height: 1.5;
  margin-top: 4px;
}
.info-block {
  margin-bottom: 22px;
  h3 {
    font-size: 16px;
    margin-bottom: 8px;
    font-weight: 600;
  }
  p {
    font-size: 14px;
    color: var(--el-text-color-regular);
    line-height: 1.7;
    margin: 0 0 8px 0;
  }
  code {
    background: var(--el-fill-color-light);
    border-radius: 4px;
    padding: 2px 6px;
    color: var(--el-text-color-primary);
    border: 1px solid var(--el-border-color-light);
    font-size: 0.9em;
  }
  .el-link {
    font-size: 14px;
    vertical-align: baseline;
  }
}
:deep(.el-form-item__label) {
  font-size: 16px;
  font-weight: 600;
  color: #000;
}
</style>
