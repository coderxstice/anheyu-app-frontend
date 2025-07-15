<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { completeOneDriveAuth } from "@/api/sys-policy";

defineOptions({
  name: "StoragePolicyOAuth"
});

const route = useRoute();
const router = useRouter();

// 1. 引入状态管理
type Status = "processing" | "success" | "error";
const status = ref<Status>("processing");

// 用于存储错误信息和失败时关联的策略ID
const errorMessage = ref("处理中，请稍候...");
const failedPolicyId = ref<string | null>(null);

function goToList() {
  router.push({ name: "StoragePolicyManagement" });
}

function goToEdit() {
  if (failedPolicyId.value) {
    router.push({
      name: "StoragePolicyEdit",
      params: { id: failedPolicyId.value }
    });
  }
}

onMounted(async () => {
  const { code, state } = route.query;

  if (!code || !state) {
    status.value = "error";
    errorMessage.value = "授权失败：回调参数不完整，缺少 code 或 state。";
    return;
  }

  try {
    await completeOneDriveAuth({
      code: String(code),
      state: String(state)
    });

    // 授权成功
    status.value = "success";
    // 成功后延时跳转，给用户看一眼成功提示
    setTimeout(goToList, 2000);
  } catch (error) {
    // 授权失败
    status.value = "error";
    errorMessage.value = error.message || "发生未知错误，请联系管理员。";

    // 检查后端是否在错误响应中返回了 policyId
    if (error.data && error.data.policyId) {
      failedPolicyId.value = error.data.policyId;
    }
  }
});
</script>

<template>
  <div class="callback-container">
    <!-- 处理中状态 -->
    <div
      v-if="status === 'processing'"
      v-loading="true"
      :element-loading-text="errorMessage"
      class="loading-view"
    />

    <!-- 成功状态 -->
    <el-result
      v-if="status === 'success'"
      icon="success"
      title="授权成功"
      sub-title="恭喜！您的 OneDrive 策略已成功授权，页面将在 2 秒后自动跳转..."
    >
      <template #extra>
        <el-button type="primary" @click="goToList">立即跳转</el-button>
      </template>
    </el-result>

    <!-- 失败状态 -->
    <el-result
      v-if="status === 'error'"
      icon="error"
      title="授权失败"
      :sub-title="errorMessage"
    >
      <template #extra>
        <el-button @click="goToList">返回策略列表</el-button>
        <!-- 只有当后端返回了 policyId 时，才显示“重新配置”按钮 -->
        <el-button v-if="failedPolicyId" type="primary" @click="goToEdit">
          重新配置
        </el-button>
      </template>
    </el-result>
  </div>
</template>

<style scoped>
.callback-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 180px);
  width: 100%;
}
.loading-view {
  width: 100%;
  height: 100%;
}
</style>
