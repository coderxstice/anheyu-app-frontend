<template>
  <view />
</template>
<script setup lang="ts">
import { useRegisterSW } from "virtual:pwa-register/vue";
import { watch } from "vue";
import { ElMessageBox, ElNotification } from "element-plus";

const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW();

// 监听 `needRefresh` 状态的变化
watch(needRefresh, newValue => {
  if (newValue) {
    // 当有新内容可用时，弹出确认对话框
    ElMessageBox.confirm("应用有新版本可用，请刷新以体验新功能。", "更新提示", {
      confirmButtonText: "立即刷新",
      cancelButtonText: "稍后提醒",
      type: "info",
      center: true
    })
      .then(() => {
        // 用户点击“立即刷新”
        updateServiceWorker();
      })
      .catch(() => {
        // 用户点击“稍后提醒”或关闭了对话框，本次不做任何事。
        // 下次用户重新加载页面时，如果还有新版本，提示会再次出现。
      });
  }
});

// 这是一个锦上添花的功能：当应用首次被缓存，可以离线使用时，给出一个提示。
watch(offlineReady, newValue => {
  if (newValue) {
    ElNotification({
      title: "应用已就绪",
      message: "当前应用已可在离线状态下使用。",
      type: "success",
      duration: 3000
    });
  }
});
</script>
