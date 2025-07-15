<script setup lang="ts">
import { computed } from "vue";
import { type StoragePolicy, getOneDriveAuthUrl } from "@/api/sys-policy";
import { message } from "@/utils/message";
const props = defineProps<{ policy: Partial<StoragePolicy> }>();
const isNotAuthorized = computed(() => !props.policy.settings?.refresh_token);
async function handleAuthorize() {
  const { data } = await getOneDriveAuthUrl(props.policy.id);
  window.location.href = data.url;
}
</script>
<template>
  <el-alert
    v-if="isNotAuthorized"
    title="账号授权"
    type="warning"
    show-icon
    :closable="false"
    style="margin-bottom: 20px"
  >
    <p>当前策略尚未授权，请保存配置后点击下方按钮授权。</p>
    <el-button type="primary" style="margin-top: 10px" @click="handleAuthorize"
      >立即授权</el-button
    >
  </el-alert>
  <el-alert
    v-else
    title="账号授权"
    type="success"
    description="此策略已成功授权。"
    show-icon
    :closable="false"
    style="margin-bottom: 20px"
  />
</template>
