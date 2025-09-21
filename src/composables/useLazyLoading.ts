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

    loadingImages.value.add(img);

    // 添加加载状态类
    if (showLoading) {
      img.classList.add("lazy-loading");
    }

    // 创建新的图片对象来预加载
    const imageLoader = new Image();

    imageLoader.onload = () => {
      // 图片加载成功
      img.src = src;
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
    };

    imageLoader.onerror = () => {
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
    };

    // 开始加载图片
    imageLoader.src = src;
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

    // 跳过没有 src 的图片或已经是 data: URL 的图片
    if (!img.src || img.src.startsWith("data:")) {
      return;
    }

    // 跳过在 a 标签内的图片（避免影响 Fancybox）
    if (img.closest("a")) {
      return;
    }

    // 将原始 src 保存到 data-src
    img.setAttribute("data-src", img.src);

    // 设置占位符
    img.src = placeholder;

    // 添加懒加载相关的类
    img.classList.add("lazy-image");

    // 标记为已处理
    img.setAttribute("data-lazy-processed", "true");

    // 设置初始样式
    if (showLoading) {
      img.style.filter = "blur(5px)";
      img.style.transition = "filter 0.3s ease";
    }

    // 开始观察
    observer.value?.observe(img);

    // 监听加载完成事件，移除模糊效果
    if (showLoading) {
      img.addEventListener(
        "lazyloaded",
        () => {
          img.style.filter = "none";
        },
        { once: true }
      );
    }
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
