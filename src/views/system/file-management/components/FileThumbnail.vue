<template>
  <!-- 根元素，用于 IntersectionObserver 观察 -->
  <div ref="thumbnailRef" class="thumbnail-container">
    <!-- 状态 1: 正在加载或轮询中，显示加载动画 -->
    <div v-if="isLoading" class="thumbnail-placeholder is-loading">
      <el-icon><Loading /></el-icon>
    </div>

    <!-- 状态 2: 成功获取图片URL，显示图片 -->
    <img
      v-else-if="imageUrl"
      :src="imageUrl"
      class="thumbnail-image"
      loading="lazy"
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
import { getThumbnailCredentialApi } from "@/api/sys-file/sys-file"; // 1. 导入新的 API 函数
import { baseUrlApi } from "@/utils/http/config";

const props = defineProps({
  file: {
    type: Object as PropType<FileItem>,
    required: true
  }
});

const thumbnailRef = ref<HTMLElement | null>(null);
const { getFileIcon } = useFileIcons();

const isLoading = ref(false);
const imageUrl = ref<string | null>(null); // 存储完整的、可访问的缩略图 URL
let timeoutId: number | null = null;
const POLLING_INTERVAL = 5000; // 5秒轮询间隔

/**
 * 检查文件类型是否支持生成预览。
 */
const isPreviewSupported = (): boolean => {
  if (props.file.type === FileType.Dir) return false;
  // 可以根据后端支持的类型扩展此列表
  const supportedExtensions = [
    "jpg",
    "jpeg",
    "png",
    "webp",
    "gif",
    "svg",
    "bmp",
    "ico",
    "heic",
    "heif",
    "tiff",
    "tif"
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
  try {
    // 2. 调用新的、类型安全的 API 函数
    const res = await getThumbnailCredentialApi(props.file.id);

    // 3. 处理响应
    if (res.code === 200 && res.data?.url) {
      // 成功获取凭证
      // 将后端返回的相对 URL (/t/...) 与域名拼接成完整 URL
      const apiBase = baseUrlApi("").replace("/api", ""); // 获取域名部分
      imageUrl.value = `${apiBase}${res.data.url}`;
      isLoading.value = false;
    } else if (res.code === 202) {
      // 正在处理中，继续轮询
      isLoading.value = true;
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = window.setTimeout(fetchPreview, POLLING_INTERVAL);
    } else {
      // API 返回了其他错误
      handleImageError();
    }
  } catch (error) {
    // 网络请求本身失败
    console.error(`获取文件 [${props.file.name}] 预览凭证失败:`, error);
    handleImageError();
  }
};

/**
 * 当 <img> 标签的 src 加载失败时调用。
 */
const handleImageError = () => {
  imageUrl.value = null;
  isLoading.value = false;
};

// --- 生命周期与观察者 ---
let observer: IntersectionObserver | null = null;

onMounted(() => {
  if (thumbnailRef.value && isPreviewSupported()) {
    observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          startFetchingPreview();
          if (observer && thumbnailRef.value) {
            observer.unobserve(thumbnailRef.value);
          }
        }
      },
      { rootMargin: "200px" } // 预加载
    );
    observer.observe(thumbnailRef.value);
  }
});

onUnmounted(() => {
  if (timeoutId) clearTimeout(timeoutId);
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
    imageUrl.value = null;
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
  border-radius: 6px;
  overflow: hidden;
  background-color: var(--el-fill-color-light);
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
  color: var(--el-color-primary-light-3);
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
  color: #a8abb2;
}
</style>
