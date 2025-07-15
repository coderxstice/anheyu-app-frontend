<script setup lang="ts">
// 1. 从 vue 引入 computed
import { ref, reactive, onMounted, computed } from "vue";
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
  settings: {
    endpoint: "https://graph.microsoft.com/v1.0",
    client_id: "",
    client_secret: ""
  }
});

// 2. 创建端点与控制台链接的映射
const portalLinks = {
  "https://graph.microsoft.com/v1.0":
    "https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/Overview",
  "https://microsoftgraph.chinacloudapi.cn/v1.0":
    "https://portal.azure.cn/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/Overview"
};

// 3. 创建一个计算属性来动态生成链接
const dynamicPortalLink = computed(() => {
  const endpoint = formData.value.settings.endpoint;
  // 如果找不到匹配的端点，默认返回国际版链接
  return (
    portalLinks[endpoint] || portalLinks["https://graph.microsoft.com/v1.0"]
  );
});

const rules = reactive<FormRules>({
  name: [{ required: true, message: "策略名称不能为空", trigger: "blur" }],
  "settings.client_id": [
    { required: true, message: "应用(客户端) ID 不能为空", trigger: "blur" }
  ],
  "settings.client_secret": [
    { required: true, message: "客户端密码不能为空", trigger: "blur" }
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
  // 使用 setTimeout 延迟聚焦，确保动画完成后元素可见
  setTimeout(() => {
    if (myInput.value) {
      myInput.value.focus();
    }
  }, 100);
});

defineExpose({
  submitForm
});
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

    <el-form-item label="Microsoft Graph 端点" prop="settings.endpoint">
      <el-select v-model="formData.settings.endpoint" style="width: 100%">
        <el-option
          label="公有 (国际版)"
          value="https://graph.microsoft.com/v1.0"
        />
        <el-option
          label="世纪互联"
          value="https://microsoftgraph.chinacloudapi.cn/v1.0"
        />
      </el-select>
      <div class="form-item-help">
        请根据你使用的 Microsoft 365 账号类型选择对应的端点。
      </div>
    </el-form-item>

    <div class="info-block">
      <h3>Entra ID 应用信息</h3>
      <p>
        前往
        <!-- 4. 将 href 动态绑定到计算属性 -->
        <el-link type="primary" :href="dynamicPortalLink" target="_blank">
          Microsoft Entra ID 控制台
        </el-link>
        并登录，登录后进入
        <code>Microsoft Entra ID</code>
        管理面板，这里登录使用的账号和最终存储使用的 OneDrive 所属账号可以不同。
      </p>
      <p>
        进入左侧
        <code>应用注册</code>
        菜单，并点击
        <code>新注册</code>
        按钮。填写应用注册表单。其中，名称可任取；
        <code>受支持的帐户类型</code>
        选择为
        <code
          >任何组织目录(任何 Azure AD 目录 - 多租户)和个人 Microsoft
          帐户(例如，Skype、Xbox)</code
        >；
        <code>重定向 URI (可选)</code>
        请选择
        <code>Web</code>
        ，并填写
        <code>https://cloud.anzhiyu.site/admin/policy/oauth</code>
        ；其他保持默认即可。
      </p>
    </div>

    <el-form-item label="应用程序(客户端) ID" prop="settings.client_id">
      <el-input v-model="formData.settings.client_id" />
      <div class="form-item-help">
        进入应用管理的
        <code>概览</code>
        页面，看到的
        <code>应用程序(客户端) ID</code>
        的值。
      </div>
    </el-form-item>

    <el-form-item label="客户端密码" prop="settings.client_secret">
      <el-input v-model="formData.settings.client_secret" />
      <div class="form-item-help">
        客户端密码的创建方式：进入应用管理页面左侧的
        <code>证书和密码</code>
        菜单，单击
        <code>新建客户端密码</code>
        按钮，
        <code>截止期限</code>
        选择为最长时间。客户端密码过期后，需要重新创建并将其填入存储策略设置中。
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
