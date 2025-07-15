<script setup lang="ts">
import { ref, onMounted, computed, shallowRef } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  getPolicyById,
  updatePolicy,
  type StoragePolicy
} from "@/api/sys-policy";
import { message } from "@/utils/message";
import Form from "./form.vue";

// --- 动态导入授权组件 ---
import OneDriveAuthorization from "./components/onedrive/Authorization.vue";
// import S3Authorization from "./components/s3/Authorization.vue"; // 未来

defineOptions({
  name: "StoragePolicyEdit"
});

// --- 注册授权组件 ---
// 只有需要特殊授权流程的策略才需要在这里注册
const providerAuthorizations = shallowRef({
  onedrive: OneDriveAuthorization
  // s3: S3Authorization, // 比如 S3 的“测试连接”组件
});

// --- 页面核心逻辑 ---
const route = useRoute();
const router = useRouter();
const formRef = ref();
const policyId: string = String(route.params.id);
const formData = ref<Partial<StoragePolicy>>({});
const isLoading = ref(true);

// 动态选择当前策略需要的授权组件
const providerAuthComponent = computed(() => {
  if (!formData.value.type) return null;
  return providerAuthorizations.value[formData.value.type] || null;
});

// 获取策略数据
async function fetchData() {
  if (!policyId) return;
  isLoading.value = true;
  try {
    const { data } = await getPolicyById(policyId);
    formData.value = data;
  } finally {
    isLoading.value = false;
  }
}

// 保存修改
async function onSave() {
  const form = formRef.value.getRef();
  if (!form) return;
  await form.validate();
  await updatePolicy(formData.value);
  message("保存成功", { type: "success" });
  // 保存后刷新一下数据，确保状态正确
  fetchData();
}

// 返回列表页
function goBack() {
  router.push({ name: "StoragePolicyManagement" });
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="card-header">
        <span class="font-medium">
          编辑存储策略 - {{ formData.name || "加载中..." }}
        </span>
        <div>
          <el-button @click="goBack">返回</el-button>
          <el-button type="primary" @click="onSave">保存</el-button>
        </div>
      </div>
    </template>
    <div v-loading="isLoading">
      <!-- 动态加载特定策略的授权组件 -->
      <component
        :is="providerAuthComponent"
        v-if="providerAuthComponent && formData.id"
        :policy="formData"
      />

      <!-- 加载主表单 -->
      <Form v-if="formData.id" ref="formRef" v-model="formData" />
    </div>
  </el-card>
</template>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
