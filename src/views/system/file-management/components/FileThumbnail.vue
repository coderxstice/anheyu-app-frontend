<template>
  <!-- 根元素，用于 IntersectionObserver 观察 -->
  <div ref="thumbnailRef" class="thumbnail-container">
    <!-- 状态 1: 正在加载或轮询中，显示加载动画 -->
    <div v-if="isLoading" class="thumbnail-placeholder is-loading">
      <el-icon><Loading /></el-icon>
    </div>

    <!-- 状态 2: 成功获取图片URL (Blob URL)，显示图片 -->
    <img
      v-else-if="imageUrl"
      :src="imageUrl"
      class="thumbnail-image"
      @error="handleImageError"
    />

    <!-- 状态 3: 回退状态 (初始、不支持预览、加载失败)，显示原始文件类型图标 -->
    <div v-else class="thumbnail-placeholder">
      <component :is="getFileIcon(file)" class="file-icon-fallback" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import type { PropType } from "vue";
import { FileItem, FileType } from "@/api/sys-file/type";
import { useFileIcons } from "../hooks/useFileIcons";
import { Loading } from "@element-plus/icons-vue";
import { getToken } from "@/utils/auth";

const props = defineProps({
  file: {
    type: Object as PropType<FileItem>,
    required: true
  }
});

const thumbnailRef = ref<HTMLElement | null>(null);
const { getFileIcon } = useFileIcons();

const isLoading = ref(false);
const imageUrl = ref<string | null>(null); // 将存储 Blob URL
let timeoutId: number | null = null;
const POLLING_INTERVAL = 5000; // 5秒轮询间隔

/**
 * 清理上一个Blob URL，防止内存泄漏。
 * 这是使用 Blob URL 方案时至关重要的一步。
 */
const cleanupBlobUrl = () => {
  if (imageUrl.value && imageUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(imageUrl.value);
  }
  imageUrl.value = null;
};

/**
 * 检查文件类型是否支持生成预览。
 * @returns {boolean}
 */
const isPreviewSupported = (): boolean => {
  if (props.file.type === FileType.Dir) return false;
  const supportedExtensions = [
    "jpg",
    "jpeg",
    "png",
    "webp",
    "gif",
    "svg",
    "bmp",
    "ico"
  ];
  const fileExt = props.file.name.split(".").pop()?.toLowerCase() ?? "";
  return supportedExtensions.includes(fileExt);
};

/**
 * 开始获取预览的入口函数，由 IntersectionObserver 调用。
 */
const startFetchingPreview = async () => {
  if (!isPreviewSupported()) return;
  isLoading.value = true;
  await fetchPreview();
};

/**
 * 执行API请求、轮询和处理响应的核心逻辑。
 */
const fetchPreview = async () => {
  const token = getToken();

  // 在发送请求前，对 Token 进行严格、安全的检查
  if (!token || !token.accessToken) {
    console.warn(
      `预览请求 [${props.file.name}] 中止：Token 或 accessToken 无效。`
    );
    isLoading.value = false;
    return; // 阻止发送没有认证的请求
  }

  const previewUrl = `/api/preview/${props.file.id}`;

  try {
    const response = await fetch(previewUrl, {
      headers: {
        Authorization: `Bearer ${token.accessToken}`
      }
    });

    switch (response.status) {
      case 200: {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("image")) {
          // 成功获取图片数据，转换为 Blob URL
          const imageBlob = await response.blob();
          cleanupBlobUrl(); // 清理可能存在的旧 URL
          imageUrl.value = URL.createObjectURL(imageBlob);
        } else {
          // 处理 SVG 等直接服务类型
          const data = await response.json();
          if (data.status === "ready_direct_serve" && props.file.url) {
            // 假设 props.file.url 是一个公开可访问的链接
            cleanupBlobUrl();
            imageUrl.value = props.file.url;
          }
        }
        isLoading.value = false;
        break;
      }
      case 202:
        // 正在处理中，继续轮询
        isLoading.value = true;
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = window.setTimeout(fetchPreview, POLLING_INTERVAL);
        break;
      default:
        // 处理所有其他错误情况 (4xx, 5xx)
        isLoading.value = false;
        break;
    }
  } catch (error) {
    console.error(`获取文件 [${props.file.name}] 预览失败:`, error);
    isLoading.value = false;
  }
};

/**
 * 当 <img> 标签的 src 加载失败时调用（例如，URL有效但内容损坏）。
 */
const handleImageError = () => {
  cleanupBlobUrl();
  isLoading.value = false;
};

// --- 生命周期与观察者 ---
let observer: IntersectionObserver | null = null;

onMounted(() => {
  // 仅对支持预览的文件设置观察者
  if (thumbnailRef.value && isPreviewSupported()) {
    observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          startFetchingPreview();
          // 开始加载后就停止观察，避免重复触发
          if (observer && thumbnailRef.value) {
            observer.unobserve(thumbnailRef.value);
          }
        }
      },
      {
        // 元素距离视口底部 200px 时开始加载，提升体验
        rootMargin: "200px"
      }
    );
    observer.observe(thumbnailRef.value);
  }
});

onUnmounted(() => {
  // 组件销毁时，必须清理所有资源
  if (timeoutId) clearTimeout(timeoutId);
  cleanupBlobUrl(); // 清理 Blob URL
  if (observer && thumbnailRef.value) {
    observer.unobserve(thumbnailRef.value);
  }
  observer = null;
});

// 监听 file.id 的变化，以支持在组件复用时重新加载
watch(
  () => props.file.id,
  (newId, oldId) => {
    if (newId === oldId) return;

    // 重置所有状态
    cleanupBlobUrl();
    isLoading.value = false;
    if (timeoutId) clearTimeout(timeoutId);

    // 重新设置观察者
    if (observer && thumbnailRef.value) {
      observer.unobserve(thumbnailRef.value);
      if (isPreviewSupported()) {
        observer.observe(thumbnailRef.value);
      }
    }
  }
);
</script>

<style scoped>
.thumbnail-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f7f8fa;
  border-radius: 6px;
  overflow: hidden;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease-in-out;
}

.thumbnail-image:hover {
  transform: scale(1.1);
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.thumbnail-placeholder.is-loading .el-icon {
  font-size: 32px;
  color: var(--el-color-primary);
  animation: spin 1.5s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.file-icon-fallback {
  width: 50px;
  height: 50px;
  font-size: 50px;
  color: #8c939d;
}
</style>
