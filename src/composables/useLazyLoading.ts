import { ref, onUnmounted } from "vue";

// 占位符图片 - 1x1 透明像素的 base64 编码
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSJ0cmFuc3BhcmVudCIvPgo8L3N2Zz4=";

export interface LazyLoadingOptions {
  /** 根边距，用于提前加载图片 */
  rootMargin?: string;
  /** 可见性阈值 */
  threshold?: number | number[];
  /** 占位符图片 URL */
  placeholder?: string;
  /** 是否显示加载状态 */
  showLoading?: boolean;
  /** 错误时的占位图片 */
  errorPlaceholder?: string;
}

export function useLazyLoading(options: LazyLoadingOptions = {}) {
  const {
    rootMargin = "50px",
    threshold = 0.1,
    placeholder = PLACEHOLDER_IMAGE,
    showLoading = true,
    errorPlaceholder = PLACEHOLDER_IMAGE
  } = options;

  const observer = ref<IntersectionObserver | null>(null);
  const loadingImages = ref<Set<HTMLImageElement>>(new Set());
  const loadedImages = ref<Set<HTMLImageElement>>(new Set());
  const failedImages = ref<Set<HTMLImageElement>>(new Set());

  /**
   * 创建 Intersection Observer
   */
  const createObserver = (): IntersectionObserver => {
    return new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            loadImage(img);
            observer.value?.unobserve(img);
          }
        });
      },
      {
        rootMargin,
        threshold
      }
    );
  };

  /**
   * 加载图片
   */
  const loadImage = (img: HTMLImageElement): void => {
    const src = img.dataset.src;
    if (!src || loadedImages.value.has(img) || loadingImages.value.has(img)) {
      return;
    }

    // 如果图片的 src 已经是目标 src，说明已经加载过了
    if (img.src === src) {
      loadedImages.value.add(img);
      img.classList.remove("lazy-loading");
      img.classList.add("lazy-loaded");
      return;
    }

    loadingImages.value.add(img);

    // 添加加载状态类
    if (showLoading) {
      img.classList.add("lazy-loading");
    }

    // 直接设置图片源，避免双重加载
    img.src = src;

    // 监听实际img元素的加载事件
    const handleLoad = () => {
      loadingImages.value.delete(img);
      loadedImages.value.add(img);

      // 移除加载状态，添加加载完成状态
      img.classList.remove("lazy-loading");
      img.classList.add("lazy-loaded");

      // 触发自定义事件
      img.dispatchEvent(
        new CustomEvent("lazyloaded", {
          detail: { src }
        })
      );

      // 清理事件监听器
      img.removeEventListener("load", handleLoad);
      img.removeEventListener("error", handleError);
    };

    const handleError = () => {
      // 图片加载失败
      loadingImages.value.delete(img);
      failedImages.value.add(img);

      // 设置错误占位符
      if (errorPlaceholder) {
        img.src = errorPlaceholder;
      }

      // 移除加载状态，添加错误状态
      img.classList.remove("lazy-loading");
      img.classList.add("lazy-error");

      // 触发自定义事件
      img.dispatchEvent(
        new CustomEvent("lazyerror", {
          detail: { src, error: "Failed to load image" }
        })
      );

      // 清理事件监听器
      img.removeEventListener("load", handleLoad);
      img.removeEventListener("error", handleError);
    };

    // 添加事件监听器
    img.addEventListener("load", handleLoad);
    img.addEventListener("error", handleError);

    // 检查图片是否已经加载完成（从缓存中）
    if (img.complete) {
      if (img.naturalHeight !== 0) {
        // 图片已成功加载
        handleLoad();
      } else {
        // 图片加载失败
        handleError();
      }
    }
  };

  /**
   * 初始化懒加载
   */
  const initLazyLoading = (container: HTMLElement): void => {
    if (!container) return;

    // 创建 observer
    if (!observer.value) {
      observer.value = createObserver();
    }

    // 查找所有图片
    const images = container.querySelectorAll<HTMLImageElement>("img");

    images.forEach(img => {
      processImage(img);
    });
  };

  /**
   * 处理单个图片元素
   */
  const processImage = (img: HTMLImageElement): void => {
    // 跳过已经处理过的图片
    if (img.hasAttribute("data-lazy-processed")) {
      return;
    }

    // 跳过在 a 标签内的图片（避免影响 Fancybox）
    if (img.closest("a")) {
      return;
    }

    // 如果图片已经有 data-src，说明是预设的懒加载图片
    if (img.hasAttribute("data-src")) {
      // 确保 src 是占位符（只有在不是 data: URL 时才设置，避免重复设置）
      if (!img.src.startsWith("data:")) {
        img.src = placeholder;
      }
      // 如果已经是正确的占位符或其他 data: URL，不需要额外处理
    } else {
      // 跳过没有 src 的图片或已经是 data: URL 的图片
      if (!img.src || img.src.startsWith("data:")) {
        return;
      }

      // 检查图片是否已经加载或正在加载
      // 如果图片已经完成加载，说明浏览器已经加载过了，不再进行懒加载处理
      if (img.complete && img.naturalHeight !== 0) {
        // 图片已经成功加载，跳过懒加载处理
        console.log("[LazyLoad] 跳过已加载的图片:", img.src);
        return;
      }

      // 将原始 src 保存到 data-src
      img.setAttribute("data-src", img.src);

      // 设置占位符
      img.src = placeholder;
    }

    // 添加懒加载相关的类
    img.classList.add("lazy-image");

    // 标记为已处理
    img.setAttribute("data-lazy-processed", "true");

    // 开始观察
    observer.value?.observe(img);
  };

  /**
   * 强制加载所有图片（用于调试或特殊情况）
   */
  const loadAllImages = (container: HTMLElement): void => {
    const lazyImages =
      container.querySelectorAll<HTMLImageElement>("img[data-src]");
    lazyImages.forEach(img => {
      loadImage(img);
      observer.value?.unobserve(img);
    });
  };

  /**
   * 重新初始化懒加载（当内容发生变化时）
   */
  const reinitialize = (container: HTMLElement): void => {
    // 清理现有的观察
    cleanup();

    // 🔧 清理所有图片的懒加载标记，允许重新处理
    const processedImages = container.querySelectorAll<HTMLImageElement>(
      "img[data-lazy-processed]"
    );
    processedImages.forEach(img => {
      // 移除懒加载标记，允许重新处理
      img.removeAttribute("data-lazy-processed");
      img.classList.remove(
        "lazy-image",
        "lazy-loading",
        "lazy-loaded",
        "lazy-error"
      );

      // 🔧 关键修复：保留 data-src 属性，让 processImage 重新处理
      // 不要移除 data-src，也不要改变 src
      // 这样 processImage 会检测到 data-src 并重新设置占位符、重新观察
    });

    console.log(
      `🔄 [LazyLoad] 已清理 ${processedImages.length} 个图片的懒加载标记`
    );

    // 重新初始化
    initLazyLoading(container);
  };

  /**
   * 清理资源
   */
  const cleanup = (): void => {
    if (observer.value) {
      observer.value.disconnect();
      observer.value = null;
    }
    loadingImages.value.clear();
    loadedImages.value.clear();
    failedImages.value.clear();
  };

  /**
   * 获取加载统计信息
   */
  const getStats = () => ({
    loading: loadingImages.value.size,
    loaded: loadedImages.value.size,
    failed: failedImages.value.size,
    total:
      loadingImages.value.size +
      loadedImages.value.size +
      failedImages.value.size
  });

  // 组件卸载时清理资源
  onUnmounted(() => {
    cleanup();
  });

  return {
    initLazyLoading,
    processImage,
    loadAllImages,
    reinitialize,
    cleanup,
    getStats,
    // 响应式状态
    loadingImages: loadingImages.value,
    loadedImages: loadedImages.value,
    failedImages: failedImages.value
  };
}
