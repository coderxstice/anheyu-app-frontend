<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { type StoragePolicy } from "@/api/sys-policy";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

const myInput = ref(null);

const emit = defineEmits<{
  (e: "submit", payload: Partial<StoragePolicy>): void;
}>();

const siteConfigStore = useSiteConfigStore();
const SiteUrl = siteConfigStore.getSiteUrl;

const formRef = ref<FormInstance>();
const formData = ref<Partial<StoragePolicy>>({
  type: "onedrive",
  name: "",
  server: "https://graph.microsoft.com/v1.0",
  bucket_name: "",
  secret_key: "",
  base_path: "/anheyuAlbum",
  virtual_path: "/onedrive",
  is_private: true,
  settings: {
    drive_type: "default"
  }
});

const portalLinks = {
  "https://graph.microsoft.com/v1.0":
    "https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/Overview",
  "https://microsoftgraph.chinacloudapi.cn/v1.0":
    "https://portal.azure.cn/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/Overview"
};

const dynamicPortalLink = computed(() => {
  return (
    portalLinks[formData.value.server] ||
    portalLinks["https://graph.microsoft.com/v1.0"]
  );
});

const rules = reactive<FormRules>({
  name: [{ required: true, message: "策略名称不能为空", trigger: "blur" }],
  server: [
    {
      required: true,
      message: "Microsoft Graph 端点为必选项",
      trigger: "change"
    }
  ],
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
    { required: true, message: "应用内挂载路径不能为空", trigger: "blur" },
    {
      pattern: /^\/[a-zA-Z0-9_-]+$/,
      message:
        "路径必须以 / 开头，只能包含字母、数字、下划线和连字符，且只能是一级目录（如 /onedrive）",
      trigger: "blur"
    },
    {
      validator: (rule, value, callback) => {
        const pathWithoutSlash = value.replace(/^\//, "");
        if (pathWithoutSlash.includes("/")) {
          callback(
            new Error(
              "只允许一级路径，不能包含多级目录（如 /data/onedrive 是不允许的）"
            )
          );
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
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
      <div class="form-item-help">
        此策略在应用内部的访问路径，<strong>需保证唯一</strong>，<strong
          style="color: var(--anzhiyu-yellow)"
          >只允许一级路径</strong
        >。<br />
        <span style="color: var(--anzhiyu-green)"
          >✓ 正确示例：/onedrive、/my-onedrive</span
        ><br />
        <span style="color: var(--anzhiyu-red)"
          >✗ 错误示例：/data/onedrive、/storage/onedrive</span
        >
      </div>
    </el-form-item>

    <el-form-item label="云端存储根目录" prop="base_path">
      <el-input
        v-model="formData.base_path"
        placeholder="例如 /anheyuAlbum/Work"
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
        并登录，登录后进入<code>Microsoft Entra ID</code>
        管理面板，这里登录使用的账号和最终存储使用的 OneDrive 所属账号可以不同。
        进入左侧 <code>应用注册</code> 菜单，并点击 <code>新注册</code>
        按钮。填写应用注册表单。其中，名称可任取；受支持的帐户类型 选择为
        <code
          >任何组织目录(任何 Azure AD 目录 - 多租户)中的帐户和个人 Microsoft
          帐户(例如，Skype、Xbox)</code
        >；重定向 URI (可选) 请选择 Web，并填写
        <code>{{ SiteUrl + "/admin/storage-policy/oauth" }}</code
        >； 其他保持默认即可。
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

    <!-- 此处不再有 chunk_size 的设置 -->

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
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--anzhiyu-secondfontcolor);
}

.info-block {
  margin-bottom: 22px;

  h3 {
    margin-bottom: 8px;
    font-size: 16px;
    font-weight: 600;
  }

  p {
    margin: 0 0 8px;
    font-size: 14px;
    line-height: 1.7;
    color: var(--anzhiyu-fontcolor);
  }

  code {
    padding: 2px 6px;
    font-size: 0.9em;
    color: var(--anzhiyu-fontcolor);
    background: var(--anzhiyu-secondbg);
    border: 1px solid var(--el-border-color-light);
    border-radius: 4px;
  }

  .el-link {
    font-size: 14px;
    vertical-align: baseline;
  }
}

:deep(.el-form-item__label) {
  font-size: 16px;
  font-weight: 600;
  color: var(--anzhiyu-fontcolor);
}
</style>
