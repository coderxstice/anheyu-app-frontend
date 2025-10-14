import type { Ref } from "vue";
import { ElMessage } from "element-plus";
import type { FileItem } from "@/api/sys-file/type";
import { getFilePreviewUrlsApi } from "@/api/sys-file/sys-file";
import type AzImagePreview from "@/components/AzImagePreview";
import type AzVideoPreview from "@/components/AzVideoPreview";
import type AzTextPreview from "@/components/AzTextPreview";
import { createFullScreenLoading } from "../utils/loadingService";

/**
 * 这是一个文件预览的函数工厂。
 * 它返回一个 previewFile 函数，该函数在调用时才接收所有依赖。
 * 这种无状态设计避免了闭包和 ref 的时序问题。
 * @returns {{ previewFile: Function }}
 */
export function useFilePreview() {
  // 辅助函数，用于判断文件类型
  const isImageFile = (fileName: string): boolean => {
    const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg|avif)$/i;
    return imageExtensions.test(fileName);
  };

  const isVideoFile = (fileName: string): boolean => {
    const videoExtensions = /\.(mp4|webm|ogg|mov|avi|flv)$/i;
    return videoExtensions.test(fileName);
  };

  const isTextFile = (filename: string): boolean => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const textFileExtensions = new Set([
      "txt",
      "md",
      "markdown",
      "json",
      "xml",
      "yaml",
      "yml",
      "csv",
      "html",
      "css",
      "js",
      "ts",
      "jsx",
      "tsx",
      "vue",
      "go",
      "py",
      "java",
      "c",
      "cpp",
      "h",
      "cs",
      "sh",
      "rb",
      "rs"
    ]);
    return textFileExtensions.has(ext);
  };

  /**
   * 预览图片文件 (在调用时接收 ref)
   */
  const previewImage = async (
    item: FileItem,
    imagePreviewRef: Ref<InstanceType<typeof AzImagePreview> | null>
  ) => {
    if (!imagePreviewRef.value) {
      return ElMessage.error("图片预览组件不可用。");
    }

    const loadingInstance = createFullScreenLoading("正在准备图片预览...");
    try {
      const res = await getFilePreviewUrlsApi(item.id);
      const { urls, initialIndex } = res.data ?? {};
      if (res.code === 200 && urls) {
        // 使用后端返回的文件信息构建预览列表
        const imageListForPreview = urls.map(urlItem => {
          return {
            imageUrl: urlItem.url,
            downloadUrl: urlItem.url,
            fileSize: urlItem.file_size,
            createTime: new Date(),
            viewCount: 0,
            downloadCount: 0
          };
        });

        if (imagePreviewRef.value) {
          // 使用后端返回的initialIndex
          imagePreviewRef.value.open(
            imageListForPreview,
            initialIndex >= 0 ? initialIndex : 0
          );
        }
      } else {
        ElMessage.error(res.message || "获取图片预览链接失败");
      }
    } catch (error) {
      console.error("图片预览失败:", error);
      ElMessage.error("准备图片预览时发生错误。");
    } finally {
      loadingInstance.close();
    }
  };

  /**
   * 预览视频文件 (在调用时接收 ref)
   */
  const previewVideo = async (
    item: FileItem,
    videoPreviewRef: Ref<InstanceType<typeof AzVideoPreview> | null>
  ) => {
    if (!videoPreviewRef.value) {
      return ElMessage.error("视频预览组件不可用。");
    }
    try {
      const res = await getFilePreviewUrlsApi(item.id);
      if (res.code === 200 && res.data.urls.length > 0) {
        const videoUrl = res.data.urls[res.data.initialIndex].url;
        if (videoPreviewRef.value) {
          videoPreviewRef.value.open(videoUrl);
        }
      } else {
        ElMessage.error(res.message || "获取视频预览链接失败");
      }
    } catch (error) {
      console.error("获取视频预览链接失败:", error);
      ElMessage.error("获取预览链接时发生错误。");
    }
  };

  /**
   * 预览文本文件 (在调用时接收 ref 和 theme)
   */
  const previewText = async (
    item: FileItem,
    textPreviewRef: Ref<InstanceType<typeof AzTextPreview> | null>,
    theme: "light" | "dark",
    onSave: (
      file: FileItem,
      content: string,
      etag?: string
    ) => Promise<boolean | Partial<FileItem>>
  ) => {
    if (!textPreviewRef.value) {
      return ElMessage.error("文本预览组件不可用。");
    }
    try {
      const res = await getFilePreviewUrlsApi(item.id);
      if (res.code === 200 && res.data?.urls?.length > 0) {
        const textUrl = res.data.urls[res.data.initialIndex].url;
        if (textPreviewRef.value) {
          textPreviewRef.value.open(item, textUrl, onSave);
        }
      } else {
        ElMessage.error(res.message || "获取文本预览链接失败");
      }
    } catch (error) {
      console.error("获取文本预览链接失败:", error);
      ElMessage.error("获取预览链接时发生错误。");
    }
  };

  /**
   * 主预览函数 (在调用时接收 item, refs 和 theme)
   */
  const previewFile = async (
    item: FileItem,
    refs: {
      imagePreviewRef: Ref<InstanceType<typeof AzImagePreview> | null>;
      videoPreviewRef: Ref<InstanceType<typeof AzVideoPreview> | null>;
      textPreviewRef: Ref<InstanceType<typeof AzTextPreview> | null>;
    },
    theme: "light" | "dark",
    onSave: (
      file: FileItem,
      content: string,
      etag?: string
    ) => Promise<boolean | Partial<FileItem>>
  ) => {
    if (isImageFile(item.name)) {
      await previewImage(item, refs.imagePreviewRef);
    } else if (isVideoFile(item.name)) {
      await previewVideo(item, refs.videoPreviewRef);
    } else if (isTextFile(item.name)) {
      await previewText(item, refs.textPreviewRef, theme, onSave);
    } else {
      ElMessage.info("暂不支持预览此类型的文件。");
    }
  };

  // 返回主函数
  return {
    previewFile
  };
}
