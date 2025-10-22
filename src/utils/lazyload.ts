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
      console.log(`[LazyLoad] 收到 ${entries.length} 个交叉观察回调`, {
        timestamp: new Date().toISOString(),
        scrollY: window.scrollY,
        viewportHeight: window.innerHeight
      });

      entries.forEach(entry => {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;
        const rect = img.getBoundingClientRect();

        console.log(`[LazyLoad] 图片状态:`, {
          alt: img.alt,
          isIntersecting: entry.isIntersecting,
          intersectionRatio: entry.intersectionRatio,
          dataSrc: src,
          currentSrc: img.src,
          hasDataSrc: !!src,
          hasSrc: !!img.src,
          // 详细的位置信息
          boundingRect: {
            top: rect.top,
            bottom: rect.bottom,
            left: rect.left,
            right: rect.right,
            width: rect.width,
            height: rect.height
          },
          intersectionRect: {
            top: entry.intersectionRect.top,
            bottom: entry.intersectionRect.bottom,
            left: entry.intersectionRect.left,
            right: entry.intersectionRect.right,
            width: entry.intersectionRect.width,
            height: entry.intersectionRect.height
          },
          rootBounds: entry.rootBounds
            ? {
                top: entry.rootBounds.top,
                bottom: entry.rootBounds.bottom,
                left: entry.rootBounds.left,
                right: entry.rootBounds.right,
                width: entry.rootBounds.width,
                height: entry.rootBounds.height
              }
            : null,
          // 可见性信息
          isVisible: rect.top < window.innerHeight && rect.bottom > 0,
          distanceFromViewport: rect.top - window.innerHeight,
          classList: Array.from(img.classList),
          parentElement: img.parentElement?.tagName,
          offsetParent: img.offsetParent?.tagName
        });

        if (entry.isIntersecting) {
          // 判断是否需要加载：有 data-src 且当前 src 不等于 data-src（避免重复加载）
          if (src && img.src !== src) {
            console.log(`[LazyLoad] ✅ 开始加载图片:`, {
              src,
              reason: "isIntersecting = true",
              intersectionRatio: entry.intersectionRatio,
              distanceFromViewport: rect.top - window.innerHeight
            });

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
                console.log(`[LazyLoad] ✅ 图片加载完成:`, {
                  src,
                  alt: img.alt,
                  classList: Array.from(img.classList),
                  naturalWidth: img.naturalWidth,
                  naturalHeight: img.naturalHeight
                });
              });
            };

            // 如果图片加载失败，也添加 loaded 类（可以根据需求调整）
            img.onerror = () => {
              img.classList.add(loadedClass);
              console.error(`[LazyLoad] ❌ 图片加载失败:`, {
                src,
                alt: img.alt
              });
            };

            // 停止观察已加载的图片
            observer.unobserve(img);
            console.log(`[LazyLoad] 停止观察图片:`, { alt: img.alt, src });
          } else if (!src) {
            console.warn(`[LazyLoad] ⚠️ 图片没有data-src属性:`, {
              alt: img.alt,
              currentSrc: img.src
            });
          } else if (img.src === src) {
            console.log(`[LazyLoad] ℹ️ 图片已加载，跳过:`, {
              alt: img.alt,
              src
            });
          }
        } else {
          console.log(`[LazyLoad] 图片不在视口内，等待滚动:`, {
            alt: img.alt,
            dataSrc: src,
            distanceFromViewport: Math.round(rect.top - window.innerHeight),
            needScrollDown: rect.top > window.innerHeight
          });
        }
      });
    },
    {
      threshold,
      rootMargin
    }
  );

  // 观察所有懒加载图片
  lazyImages.forEach((img, index) => {
    const htmlImg = img as HTMLImageElement;
    const rect = htmlImg.getBoundingClientRect();
    observer.observe(img);
    console.log(
      `[LazyLoad] 开始观察图片 [${index + 1}/${lazyImages.length}]:`,
      {
        alt: htmlImg.alt,
        dataSrc: htmlImg.dataset.src,
        currentSrc: htmlImg.src,
        position: {
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
          width: rect.width,
          height: rect.height
        },
        visibility: {
          isInViewport: rect.top < window.innerHeight && rect.bottom > 0,
          distanceFromViewport: Math.round(rect.top - window.innerHeight),
          scrollY: window.scrollY,
          viewportHeight: window.innerHeight
        },
        classList: Array.from(htmlImg.classList),
        parentElement: htmlImg.parentElement?.tagName,
        offsetParent: htmlImg.offsetParent?.tagName
      }
    );
  });

  console.log(`[LazyLoad] 观察器创建完成:`, {
    totalImages: lazyImages.length,
    threshold,
    rootMargin,
    selector
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
  if (src && img.src !== src) {
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
