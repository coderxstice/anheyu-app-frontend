<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-07-15 15:31:47
 * @LastEditTime: 2025-07-15 16:23:17
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { completeOneDriveAuth } from "@/api/sys-policy";
import { message } from "@/utils/message";

defineOptions({
  name: "StoragePolicyOAuth"
});

const route = useRoute();
const router = useRouter();
const loadingText = ref("正在处理授权回调，请稍候...");

onMounted(async () => {
  const { code, state } = route.query;

  console.log("回调参数:", { code, state });

  if (!code || !state) {
    loadingText.value = "授权失败：回调参数不完整。";
    message("无效的回调请求，缺少 code 或 state 参数。", { type: "error" });
    // 3秒后返回列表页
    setTimeout(() => {
      router.push({ name: "StoragePolicyManagement" });
    }, 3000);
    return;
  }

  try {
    await completeOneDriveAuth({
      code: String(code),
      state: String(state)
    });
    message("OneDrive 授权成功！", { type: "success" });
    loadingText.value = "授权成功！正在跳转回策略列表...";
    // 跳转回策略列表页
    setTimeout(() => {
      router.push({ name: "StoragePolicyManagement" });
    }, 1500);
  } catch (error) {
    // 后端会返回详细的错误信息
    loadingText.value = `授权失败：${error.message || "未知错误"}`;
    message(`授权时发生错误: ${error.message}`, { type: "error" });
    setTimeout(() => {
      router.push({ name: "StoragePolicyManagement" });
    }, 3000);
  }
});
</script>

<template>
  <div
    v-loading="true"
    :element-loading-text="loadingText"
    class="callback-container"
  />
</template>

<style scoped>
.callback-container {
  width: 100%;
  height: calc(100vh - 120px);
}
</style>
