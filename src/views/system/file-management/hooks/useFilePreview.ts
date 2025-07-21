import type { Ref } from "vue";
import { ElMessage } from "element-plus";
import type { FileItem } from "@/api/sys-file/type";
import { getFilePreviewUrlsApi } from "@/api/sys-file/sys-file";
import type AzImagePreview from "@/components/AzImagePreview";
import type AzVideoPreview from "@/components/AzVideoPreview";
import type AzTextPreview from "@/components/AzTextPreview";
import { useFileStore } from "@/store/modules/fileStore";
import { createFullScreenLoading } from "../utils/loadingService";

/**
 * 这是一个文件预览的函数工厂。
 * 它返回一个 previewFile 函数，该函数在调用时才接收所有依赖。
 * 这种无状态设计避免了闭包和 ref 的时序问题。
 * @returns {{ previewFile: Function }}
 */
export function useFilePreview() {
  const fileStore = useFileStore();

  // --- 辅助函数 ---
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
   * 图片预览仍然使用全屏加载，因为图片列表可能需要时间准备。
   */
  const previewImage = async (
    item: FileItem,
    imagePreviewRef: Ref<InstanceType<typeof AzImagePreview> | null>
  ) => {
    if (!imagePreviewRef.value) {
      return ElMessage.error("图片预览组件不可用。");
    }

    const allImageFilesInDir = fileStore.sortedFiles.filter(f =>
      isImageFile(f.name)
    );
    if (allImageFilesInDir.length === 0) {
      // 理论上不会发生，因为我们已经检查了 item 是图片
      return;
    }

    const loadingInstance = createFullScreenLoading("正在准备图片预览...");
    try {
      const res = await getFilePreviewUrlsApi(item.id);
      const { urls } = res.data ?? {};
      if (res.code === 200 && urls) {
        // 使用后端返回的 URL 列表，但与前端筛选出的图片文件列表进行匹配
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

        if (imagePreviewRef.value) {
          imagePreviewRef.value.open(
            imageListForPreview,
            finalInitialIndex >= 0 ? finalInitialIndex : 0
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
   * 视频也采用组件内加载的模式，先打开外壳，再加载视频。
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
        const videoUrl = res.data.urls[res.data.initialIndex];
        if (videoPreviewRef.value) {
          // 直接调用 open，让组件自己处理加载
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
   * 预览文本文件 (在调用时接收 ref)
   * 只获取 URL，并将 item 和 URL 交给组件处理
   */
  const previewText = async (
    item: FileItem,
    textPreviewRef: Ref<InstanceType<typeof AzTextPreview> | null>
  ) => {
    if (!textPreviewRef.value) {
      return ElMessage.error("文本预览组件不可用。");
    }

    try {
      const res = await getFilePreviewUrlsApi(item.id);
      if (res.code === 200 && res.data?.urls?.length > 0) {
        const textUrl = res.data.urls[res.data.initialIndex];
        if (textPreviewRef.value) {
          textPreviewRef.value.open(item, textUrl);
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
   * 主预览函数 (在调用时接收 item 和所有需要的 refs)
   */
  const previewFile = async (
    item: FileItem,
    refs: {
      imagePreviewRef: Ref<InstanceType<typeof AzImagePreview> | null>;
      videoPreviewRef: Ref<InstanceType<typeof AzVideoPreview> | null>;
      textPreviewRef: Ref<InstanceType<typeof AzTextPreview> | null>;
    }
  ) => {
    if (isImageFile(item.name)) {
      await previewImage(item, refs.imagePreviewRef);
    } else if (isVideoFile(item.name)) {
      await previewVideo(item, refs.videoPreviewRef);
    } else if (isTextFile(item.name)) {
      await previewText(item, refs.textPreviewRef);
    } else {
      ElMessage.info("暂不支持预览此类型的文件。");
    }
  };

  // 返回主函数
  return {
    previewFile
  };
}
