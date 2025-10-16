/*
 * @Description: 图片懒加载工具
 * @Author: 安知鱼
 * @Date: 2025-10-15 10:32:18
 * @LastEditTime: 2025-10-16 10:59:50
 * @LastEditors: 安知鱼
 */
/**
 * 图片懒加载工具
 * 使用data-src属性实现懒加载
 */

export interface LazyLoadOptions {
  /** 触发加载的阈值 */
  threshold?: number;
  /** 提前加载的距离（像素） */
  rootMargin?: string;
  /** 选择器，默认为 img[data-src] */
  selector?: string;
  /** 加载完成后添加的类名 */
  loadedClass?: string;
  /** 加载中的类名 */
  loadingClass?: string;
}

/**
 * 初始化懒加载
 * @param container 容器元素，默认为 document
 * @param options 配置选项
 * @returns IntersectionObserver 实例
 */
export function initLazyLoad(
  container: HTMLElement | Document = document,
  options: LazyLoadOptions = {}
): IntersectionObserver {
  const {
    threshold = 0.1,
    rootMargin = "100px",
    selector = "img[data-src]",
    loadedClass = "lazy-loaded",
    loadingClass = "lazy-loading"
  } = options;

  // 选择所有带有 data-src 的图片
  const lazyImages = container.querySelectorAll(selector);

  console.log(`[LazyLoad] 初始化懒加载，找到 ${lazyImages.length} 个图片元素`, {
    selector,
    threshold,
    rootMargin,
    images: Array.from(lazyImages).map(img => ({
      src: (img as HTMLImageElement).src,
      dataSrc: (img as HTMLImageElement).dataset.src,
      alt: (img as HTMLImageElement).alt
    }))
  });

  const observer = new IntersectionObserver(
    entries => {
      console.log(`[LazyLoad] 收到 ${entries.length} 个交叉观察回调`);

      entries.forEach(entry => {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;

        console.log(`[LazyLoad] 图片状态:`, {
          alt: img.alt,
          isIntersecting: entry.isIntersecting,
          intersectionRatio: entry.intersectionRatio,
          dataSrc: src,
          currentSrc: img.src,
          hasDataSrc: !!src,
          hasSrc: !!img.src
        });

        if (entry.isIntersecting) {
          if (src && !img.src) {
            console.log(`[LazyLoad] 开始加载图片:`, src);

            // 先移除 loading 类，但保持透明度为 0
            img.classList.remove(loadingClass);

            // 设置图片源
            img.src = src;
            img.removeAttribute("data-src");

            // 监听图片加载完成事件，加载完成后再添加 loaded 类触发过渡动画
            img.onload = () => {
              // 使用 requestAnimationFrame 确保浏览器已经渲染了图片
              requestAnimationFrame(() => {
                img.classList.add(loadedClass);
                console.log(`[LazyLoad] 图片加载完成:`, {
                  src,
                  classList: Array.from(img.classList)
                });
              });
            };

            // 如果图片加载失败，也添加 loaded 类（可以根据需求调整）
            img.onerror = () => {
              img.classList.add(loadedClass);
              console.error(`[LazyLoad] 图片加载失败:`, src);
            };

            // 停止观察已加载的图片
            observer.unobserve(img);
          } else {
            console.warn(`[LazyLoad] 跳过加载:`, {
              reason: !src ? "没有data-src" : "已有src",
              dataSrc: src,
              currentSrc: img.src
            });
          }
        }
      });
    },
    {
      threshold,
      rootMargin
    }
  );

  // 观察所有懒加载图片
  lazyImages.forEach(img => {
    observer.observe(img);
    console.log(`[LazyLoad] 开始观察图片:`, {
      alt: (img as HTMLImageElement).alt,
      dataSrc: (img as HTMLImageElement).dataset.src
    });
  });

  return observer;
}

/**
 * 销毁懒加载观察器
 * @param observer IntersectionObserver 实例
 */
export function destroyLazyLoad(observer: IntersectionObserver | null): void {
  if (observer) {
    observer.disconnect();
  }
}

/**
 * 手动触发图片加载
 * @param img 图片元素
 * @param loadedClass 加载完成后添加的类名
 */
export function loadImage(
  img: HTMLImageElement,
  loadedClass = "lazy-loaded"
): void {
  const src = img.dataset.src;
  if (src && !img.src) {
    // 设置图片源
    img.src = src;
    img.removeAttribute("data-src");

    // 监听图片加载完成事件
    img.onload = () => {
      requestAnimationFrame(() => {
        img.classList.add(loadedClass);
      });
    };

    img.onerror = () => {
      img.classList.add(loadedClass);
    };
  }
}
