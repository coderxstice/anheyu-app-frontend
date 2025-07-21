// src/views/system/file-management/hooks/useFilePreview.ts

import type { Ref } from "vue";
import { ElMessage } from "element-plus";
import type { FileItem } from "@/api/sys-file/type";
import { getFilePreviewUrlsApi } from "@/api/sys-file/sys-file";
import type AzImagePreview from "@/components/AzImagePreview";
import type AzVideoPreview from "@/components/AzVideoPreview";
import { useFileStore } from "@/store/modules/fileStore";
import { createFullScreenLoading } from "../utils/loadingService";

/**
 * 封装文件预览的逻辑
 * @param imagePreviewRef 对 AzImagePreview 组件实例的引用
 * @param videoPreviewRef 对 AzVideoPreview 组件实例的引用
 */
export function useFilePreview(
  imagePreviewRef: Ref<InstanceType<typeof AzImagePreview> | null>,
  videoPreviewRef: Ref<InstanceType<typeof AzVideoPreview> | null> // +++ 增加 videoPreviewRef 参数
) {
  const fileStore = useFileStore();

  const isImageFile = (fileName: string): boolean => {
    const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg|avif)$/i;
    return imageExtensions.test(fileName);
  };

  const isVideoFile = (fileName: string): boolean => {
    const videoExtensions = /\.(mp4|webm|ogg|mov|avi|flv)$/i;
    return videoExtensions.test(fileName);
  };

  /**
   * 预览图片文件
   */
  const previewImage = async (item: FileItem) => {
    const allImageFilesInDir = fileStore.sortedFiles.filter(f =>
      isImageFile(f.name)
    );
    if (allImageFilesInDir.length === 0) return;

    const loadingInstance = createFullScreenLoading("正在准备图片预览...");
    try {
      const res = await getFilePreviewUrlsApi(item.id);
      const { urls } = res.data ?? {};
      if (res.code === 200 && urls) {
        if (!imagePreviewRef.value) {
          ElMessage.error("图片预览组件尚未准备好。");
          return;
        }
        const imageListForPreview = urls.map((url, index) => {
          const correspondingFile = allImageFilesInDir[index];
          return {
            imageUrl: url,
            downloadUrl: url,
            fileSize: correspondingFile?.size ?? 0,
            createTime: correspondingFile?.created_at ?? new Date(),
            viewCount: 0,
            downloadCount: 0
          };
        });
        const finalInitialIndex = allImageFilesInDir.findIndex(
          f => f.id === item.id
        );
        imagePreviewRef.value.open(
          imageListForPreview,
          finalInitialIndex >= 0 ? finalInitialIndex : 0
        );
      } else {
        ElMessage.error(res.message || "获取图片预览链接失败");
      }
    } finally {
      loadingInstance.close();
    }
  };

  /**
   * 预览视频文件
   */
  const previewVideo = async (item: FileItem) => {
    const loadingInstance = createFullScreenLoading("正在准备视频预览...");
    try {
      const res = await getFilePreviewUrlsApi(item.id);
      if (res.code === 200 && res.data.urls.length > 0) {
        if (!videoPreviewRef.value) {
          ElMessage.error("视频预览组件尚未准备好。");
          return;
        }
        // 视频预览通常只预览当前点击的这一个
        const videoUrl = res.data.urls[res.data.initialIndex];
        videoPreviewRef.value.open(videoUrl);
      } else {
        ElMessage.error(res.message || "获取视频预览链接失败");
      }
    } finally {
      loadingInstance.close();
    }
  };

  /**
   * 主预览函数，根据文件类型分发
   */
  const previewFile = async (item: FileItem) => {
    if (isImageFile(item.name)) {
      await previewImage(item);
    } else if (isVideoFile(item.name)) {
      await previewVideo(item);
    } else {
      ElMessage.info("暂不支持预览此类型的文件。");
    }
  };

  return {
    previewFile
  };
}
