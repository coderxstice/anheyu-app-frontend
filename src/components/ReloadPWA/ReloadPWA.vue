<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-07-10 11:28:27
 * @LastEditTime: 2025-10-07 10:44:39
 * @LastEditors: 安知鱼
-->
<template>
  <view />
</template>
<script setup lang="ts">
import { watch } from "vue";
import { ElNotification, ElMessageBox } from "element-plus";
import { onPWAUpdated } from "@/utils/versionManager";
import { useRegisterSW } from "virtual:pwa-register/vue";

// 🔧 PWA状态检查：开发环境禁用，生产环境智能更新
if (import.meta.env.DEV) {
  console.log("🔍 开发环境：PWA已禁用，避免干扰登录流程");
} else if ("serviceWorker" in navigator) {
  console.log("🔍 生产环境：PWA可用，采用智能更新策略");

  // 使用 vite-plugin-pwa 的注册钩子
  const { needRefresh, updateServiceWorker } = useRegisterSW({
    immediate: true,
    onRegisteredSW(swUrl, r) {
      console.log("✅ Service Worker 已注册", swUrl);

      // 定期检查更新（每小时检查一次）
      if (r) {
        setInterval(
          () => {
            console.log("🔄 检查 Service Worker 更新...");
            r.update();
          },
          60 * 60 * 1000
        ); // 每小时检查一次
      }
    },
    onRegisterError(error) {
      console.error("❌ Service Worker 注册失败", error);
    }
  });

  // 监听更新可用事件
  watch(needRefresh, value => {
    if (value) {
      showUpdatePrompt(updateServiceWorker);
    }
  });

  // 监听Service Worker的状态变化
  navigator.serviceWorker.addEventListener("controllerchange", async () => {
    console.log("🔄 Service Worker已更新，正在刷新版本信息...");

    // PWA 更新时刷新版本缓存
    await onPWAUpdated();

    // 显示温和的更新提示
    ElNotification({
      title: "应用已更新",
      message: "应用已更新到最新版本，可离线使用。",
      type: "success",
      duration: 3000
    });
  });
} else {
  console.log("📱 当前浏览器不支持Service Worker");
}

// 清除所有缓存
async function clearAllCaches() {
  if ("caches" in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => {
          console.log("🗑️ 清除缓存:", cacheName);
          return caches.delete(cacheName);
        })
      );
      console.log("✅ 所有缓存已清除");
    } catch (error) {
      console.error("❌ 清除缓存失败:", error);
    }
  }
}

// 显示更新提示弹窗
function showUpdatePrompt(updateServiceWorker: () => Promise<void>) {
  ElMessageBox.confirm(
    "发现新版本，是否立即刷新页面以获取最新内容？",
    "版本更新",
    {
      confirmButtonText: "立即刷新",
      cancelButtonText: "稍后再说",
      type: "info",
      closeOnClickModal: false,
      closeOnPressEscape: false,
      showClose: false
    }
  )
    .then(async () => {
      console.log("🔄 用户确认更新，开始清除缓存并刷新...");

      // 1. 清除所有缓存
      await clearAllCaches();

      // 2. 激活新的 Service Worker
      await updateServiceWorker();

      // 3. 强制刷新页面（跳过缓存）
      window.location.reload();
    })
    .catch(() => {
      // 用户选择稍后再说
      ElNotification({
        title: "提示",
        message: "您可以稍后手动刷新页面以获取最新版本。",
        type: "info",
        duration: 3000
      });
    });
}
</script>
