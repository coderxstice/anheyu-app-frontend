<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-07-10 11:28:27
 * @LastEditTime: 2025-08-19 10:36:54
 * @LastEditors: 安知鱼
-->
<template>
  <view />
</template>
<script setup lang="ts">
import { onMounted } from "vue";
import { ElNotification } from "element-plus";

// 🔧 PWA状态检查：开发环境禁用，生产环境保守策略
onMounted(() => {
  if (import.meta.env.DEV) {
    console.log("🔍 开发环境：PWA已禁用，避免干扰登录流程");
  } else {
    // 生产环境：检查Service Worker是否可用
    if ("serviceWorker" in navigator) {
      console.log("🔍 生产环境：PWA可用，采用保守更新策略");

      // 监听Service Worker的状态变化
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("🔄 Service Worker已更新，建议刷新页面获取最新版本");

        // 显示温和的更新提示，不强制刷新
        ElNotification({
          title: "应用已更新",
          message: "新版本已就绪，建议刷新页面以获取最新功能。",
          type: "info",
          duration: 5000
        });
      });

      // 检查是否有Service Worker已注册
      navigator.serviceWorker.ready
        .then(() => {
          ElNotification({
            title: "应用已就绪",
            message: "当前应用已可在离线状态下使用。",
            type: "success",
            duration: 3000
          });
        })
        .catch(() => {
          console.log("📱 PWA未完全就绪，使用标准浏览器模式");
        });
    } else {
      console.log("📱 当前浏览器不支持Service Worker");
    }
  }
});
</script>
