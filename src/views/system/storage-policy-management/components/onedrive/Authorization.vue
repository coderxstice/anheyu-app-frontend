<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-07-15 15:37:15
 * @LastEditTime: 2025-07-15 19:53:20
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { computed } from "vue";
import { type StoragePolicy, getOneDriveAuthUrl } from "@/api/sys-policy";
import { message } from "@/utils/message";

const props = defineProps<{ policy: Partial<StoragePolicy> }>();

// [CRITICAL CHANGE] 修改授权状态的判断逻辑
// 现在检查顶级的 access_key 字段是否存在
const isNotAuthorized = computed(() => !props.policy.access_key);

async function handleAuthorize() {
  try {
    const { data } = await getOneDriveAuthUrl(props.policy.id);
    console.log("OneDrive auth URL:", data.url);

    message("正在跳转到微软授权页面...", { type: "info" });
    window.location.href = data.url;
  } catch (error) {
    message("获取授权链接失败，请检查网络或联系管理员。", { type: "error" });
    console.error("Failed to get OneDrive auth URL:", error);
  }
}
</script>

<template>
  <div>
    <!-- isNotAuthorized 的逻辑已更新，模板会自动响应 -->
    <el-alert
      v-if="isNotAuthorized"
      title="账号授权"
      type="warning"
      show-icon
      :closable="false"
      style="margin-bottom: 20px"
    >
      <p>当前策略尚未授权，请保存配置后点击下方按钮授权。</p>
      <el-button
        type="primary"
        style="margin-top: 10px"
        @click="handleAuthorize"
      >
        立即授权
      </el-button>
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
  </div>
</template>
