<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  getPolicyById,
  updatePolicy,
  type StoragePolicy
} from "@/api/sys-policy";
import { message } from "@/utils/message";
import Form from "./form.vue";

defineOptions({
  name: "StoragePolicyEdit"
});

const route = useRoute();
const router = useRouter();
const formRef = ref();
const policyId = Number(route.params.id);
const formData = ref<Partial<StoragePolicy>>({});
const isLoading = ref(true);

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
  await form.validate();
  await updatePolicy(formData.value);
  message("保存成功", { type: "success" });
  goBack();
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
