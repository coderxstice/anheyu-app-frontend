<template>
  <div>
    <Transition name="slide-down">
      <div v-if="visible" class="download-bar">
        <div
          class="progress-bar"
          :style="{ width: progress + '%', background: mainColor }"
        />
        <span class="text">{{ text }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from "vue";

const visible = ref(false);
const progress = ref(0);
const text = ref("正在下载图片...");
const mainColor = ref("#00c48f");
let currentDownload: XMLHttpRequest | null = null;

/**
 * 外部调用下载方法
 */
async function downloadImageWithProgress(imageUrl: string) {
  if (!imageUrl) return;

  // 停掉上一个未完成的下载
  if (currentDownload) {
    currentDownload.abort();
    currentDownload = null;
  }

  visible.value = true;
  progress.value = 0;
  text.value = "正在下载图片...";

  await fetchMainColor(imageUrl);
  await downloadImage(imageUrl);
}

/**
 * 获取主色调
 */
async function fetchMainColor(imageUrl: string) {
  try {
    const colorApiUrl = `${imageUrl}?x-oss-process=image/average-hue`;
    const res = await fetch(colorApiUrl);
    const json = await res.json();
    if (json && json.RGB) {
      mainColor.value = "#" + json.RGB.slice(2);
    } else {
      mainColor.value = "#00c48f";
    }
  } catch (e) {
    console.warn("主色调获取失败，使用默认颜色");
    mainColor.value = "#00c48f";
  }
}

/**
 * 下载图片并实时更新进度
 */
function downloadImage(url: string) {
  return new Promise<void>((resolve, reject) => {
    // 策略1: 尝试直接下载（XMLHttpRequest + 进度条）
    tryDirectDownload(url)
      .then(() => resolve())
      .catch(error => {
        console.warn("直接下载失败，尝试后端代理:", error);

        // 策略2: 使用后端代理下载
        tryBackendProxy(url)
          .then(() => resolve())
          .catch(error2 => {
            console.error("所有下载方案都失败:", error2);
            text.value = "下载失败";
            visible.value = false;
            reject(error2);
          });
      });
  });
}

/**
 * 策略1: 尝试直接下载（XMLHttpRequest + 进度条）
 */
function tryDirectDownload(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log("尝试直接下载:", url);

    // 检查URL是否可访问
    if (!isUrlAccessible(url)) {
      reject(new Error("URL不可访问"));
      return;
    }

    const xhr = new XMLHttpRequest();
    currentDownload = xhr;
    xhr.open("GET", url, true);
    xhr.responseType = "blob";
    xhr.timeout = 30000; // 30秒超时

    // 设置请求头
    xhr.setRequestHeader("Accept", "image/webp,image/apng,image/*,*/*;q=0.8");
    xhr.setRequestHeader("Cache-Control", "no-cache");

    xhr.onprogress = event => {
      if (event.lengthComputable) {
        progress.value = Math.floor((event.loaded / event.total) * 100);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const blob = xhr.response;

        // 验证下载的文件
        if (blob.size === 0) {
          reject(new Error("下载的文件为空"));
          return;
        }

        // 验证文件类型
        if (!blob.type.startsWith("image/")) {
          reject(new Error("下载的不是图片文件"));
          return;
        }

        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = url.split("/").pop() || "image.jpg";
        a.click();
        URL.revokeObjectURL(blobUrl);

        text.value = "下载成功！";
        setTimeout(() => {
          visible.value = false;
        }, 1500);

        resolve();
      } else {
        text.value = "下载失败";
        visible.value = false;
        reject(new Error(`HTTP ${xhr.status}`));
      }
      currentDownload = null;
    };

    xhr.onerror = () => {
      text.value = "下载失败";
      visible.value = false;
      reject(new Error("Network error"));
      currentDownload = null;
    };

    xhr.ontimeout = () => {
      text.value = "下载超时";
      visible.value = false;
      reject(new Error("Timeout"));
      currentDownload = null;
    };

    xhr.send();
  });
}

/**
 * 检查URL是否可访问
 */
function isUrlAccessible(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * 策略2: 使用后端代理下载
 */
function tryBackendProxy(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log("使用后端代理下载:", url);

    // 重置进度条
    progress.value = 0;
    text.value = "正在通过代理下载...";

    // 调用后端代理接口
    const proxyUrl = `/api/proxy/download?url=${encodeURIComponent(url)}`;

    const xhr = new XMLHttpRequest();
    currentDownload = xhr;
    xhr.open("GET", proxyUrl, true);
    xhr.responseType = "blob";
    xhr.timeout = 60000; // 60秒超时（代理下载可能较慢）

    xhr.onprogress = event => {
      if (event.lengthComputable) {
        progress.value = Math.floor((event.loaded / event.total) * 100);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const blob = xhr.response;

        // 验证下载的文件
        if (blob.size === 0) {
          reject(new Error("代理下载的文件为空"));
          return;
        }

        // 验证文件类型
        if (!blob.type.startsWith("image/")) {
          reject(new Error("代理下载的不是图片文件"));
          return;
        }

        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = url.split("/").pop() || "image.jpg";
        a.click();
        URL.revokeObjectURL(blobUrl);

        text.value = "代理下载成功！";
        setTimeout(() => {
          visible.value = false;
        }, 1500);

        resolve();
      } else {
        text.value = "代理下载失败";
        visible.value = false;
        reject(new Error(`Proxy HTTP ${xhr.status}`));
      }
      currentDownload = null;
    };

    xhr.onerror = () => {
      text.value = "代理下载失败";
      visible.value = false;
      reject(new Error("Proxy network error"));
      currentDownload = null;
    };

    xhr.ontimeout = () => {
      text.value = "代理下载超时";
      visible.value = false;
      reject(new Error("Proxy timeout"));
      currentDownload = null;
    };

    xhr.send();
  });
}

onUnmounted(() => {
  if (currentDownload) currentDownload.abort();
});

// ✅ 导出方法
defineExpose({
  downloadImageWithProgress
});
</script>

<style scoped lang="scss">
.download-bar {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 999999;
  display: flex;
  align-items: center;
  width: 100%;
  height: 60px;
  padding: 0 16px;
  overflow: hidden;
  color: white;
  background: #2c2c2c;
  box-shadow: 0 2px 6px rgb(0 0 0 / 20%);

  .text {
    z-index: 2;
    margin-left: 10px;
    font-size: 16px;
    font-weight: 500;
    color: #fff;
  }
}

.progress-bar {
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 100%;
  transition: width 0.2s ease;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
