/**
 * @description: 瀑布流布局 composable
 * @author: 安知鱼
 * @date: 2025-12-29
 */

import {
  ref,
  nextTick,
  onBeforeUnmount,
  type Ref,
  type CSSProperties
} from "vue";

export interface WaterfallOptions {
  /**
   * 不同屏幕尺寸的列数配置
   */
  columnCount?: {
    large: number; // >= 1200px
    medium: number; // >= 768px
    small: number; // < 768px
  };
  /**
   * 元素之间的间距（像素）
   */
  gap?: number;
}

export interface WaterfallReturn {
  /**
   * 瀑布流容器的 ref
   */
  waterfallRef: Ref<HTMLElement | null>;
  /**
   * 每个元素的位置样式
   */
  itemPositions: Ref<Record<number, CSSProperties>>;
  /**
   * 瀑布流容器的计算高度
   */
  waterfallHeight: Ref<number>;
  /**
   * 当前的列数
   */
  columnCount: Ref<number>;
  /**
   * 布局是否已就绪
   */
  layoutReady: Ref<boolean>;
  /**
   * 设置元素 ref 的函数
   */
  setItemRef: (el: HTMLElement | null, index: number) => void;
  /**
   * 计算瀑布流布局
   */
  calculateLayout: () => void;
  /**
   * 等待图片加载后重新计算布局
   */
  recalculateAfterImagesLoaded: () => Promise<void>;
  /**
   * 重置布局状态
   */
  resetLayout: () => void;
}

/**
 * 瀑布流布局 composable
 * @param options 配置选项
 * @returns 瀑布流布局相关的响应式数据和方法
 */
export function useWaterfallLayout(
  options: WaterfallOptions = {}
): WaterfallReturn {
  const {
    columnCount: columnConfig = { large: 4, medium: 3, small: 1 },
    gap = 16
  } = options;

  // 响应式状态
  const waterfallRef = ref<HTMLElement | null>(null);
  const itemRefs = ref<(HTMLElement | null)[]>([]);
  const itemPositions = ref<Record<number, CSSProperties>>({});
  const waterfallHeight = ref(0);
  const columnCount = ref(columnConfig.large);
  const layoutReady = ref(false);

  // resize 防抖定时器
  let resizeTimer: ReturnType<typeof setTimeout>;

  /**
   * 设置元素 ref
   */
  const setItemRef = (el: HTMLElement | null, index: number) => {
    if (el) {
      itemRefs.value[index] = el;
    }
  };

  /**
   * 计算瀑布流布局（性能优化版）
   */
  const calculateLayout = () => {
    if (!waterfallRef.value || itemRefs.value.length === 0) {
      return;
    }

    const containerWidth = waterfallRef.value.offsetWidth;

    // 根据容器宽度计算列数
    if (containerWidth >= 1200) {
      columnCount.value = columnConfig.large;
    } else if (containerWidth >= 768) {
      columnCount.value = columnConfig.medium;
    } else {
      columnCount.value = columnConfig.small;
    }

    const itemWidth =
      (containerWidth - gap * (columnCount.value - 1)) / columnCount.value;
    const columnHeights = new Array(columnCount.value).fill(0);
    const columnsUsed = new Set<number>();

    // 性能优化：批量读取高度，减少重排
    // 创建索引映射，避免在循环中重复查找
    const validItemsWithIndex: Array<{ item: HTMLElement; index: number }> = [];
    itemRefs.value.forEach((item, index) => {
      if (item) {
        validItemsWithIndex.push({ item, index });
      }
    });

    if (validItemsWithIndex.length === 0) return;

    // 批量读取高度，减少重排次数
    const heights: number[] = [];
    validItemsWithIndex.forEach(({ item }) => {
      // 由于已使用 aspectRatio 预设高度，直接读取即可
      heights.push(item.getBoundingClientRect().height);
    });

    // 批量计算位置
    validItemsWithIndex.forEach(({ index }, arrayIndex) => {
      // 找到最短的列
      const minHeight = Math.min(...columnHeights);
      const minColumnIndex = columnHeights.indexOf(minHeight);
      columnsUsed.add(minColumnIndex);

      // 计算位置
      const left = minColumnIndex * (itemWidth + gap);
      const top = columnHeights[minColumnIndex];

      // 设置位置（不带过渡动画，避免初始渲染时的"飞入"效果）
      itemPositions.value[index] = {
        position: "absolute",
        width: `${itemWidth}px`,
        left: `${left}px`,
        top: `${top}px`
      };

      // 使用缓存的高度
      const itemHeight = heights[arrayIndex];
      columnHeights[minColumnIndex] = top + itemHeight + gap;
    });

    // 设置容器高度：只取被使用的列中的最大高度
    const usedColumnHeights = Array.from(columnsUsed).map(
      i => columnHeights[i]
    );
    const maxHeight =
      usedColumnHeights.length > 0 ? Math.max(...usedColumnHeights) : 0;
    waterfallHeight.value = maxHeight > 0 ? maxHeight - gap : 0;
  };

  /**
   * 等待所有图片加载（包含错误处理）
   * 注意：当前未使用，但保留以备将来需要
   */
  const _waitForImages = async (): Promise<void> => {
    const images = waterfallRef.value?.querySelectorAll("img");

    if (!images || images.length === 0) {
      return;
    }

    const imagePromises = Array.from(images).map(img => {
      // 如果图片已经加载完成且有有效尺寸
      if (img.complete && img.naturalHeight !== 0) {
        return Promise.resolve();
      }

      // 如果图片已完成但没有有效尺寸（可能是加载失败或 src 为空）
      if (img.complete && img.naturalHeight === 0) {
        // 检查是否有 src
        if (!img.src || img.src === window.location.href) {
          // 没有 src，可能是懒加载未触发，跳过等待
          return Promise.resolve();
        }
        // 有 src 但加载失败
        return Promise.resolve();
      }

      return new Promise<void>(resolve => {
        const handleLoad = () => {
          cleanup();
          resolve();
        };

        const handleError = () => {
          cleanup();
          resolve(); // 即使失败也继续，不阻塞其他图片
        };

        const cleanup = () => {
          img.removeEventListener("load", handleLoad);
          img.removeEventListener("error", handleError);
        };

        img.addEventListener("load", handleLoad);
        img.addEventListener("error", handleError);

        // 设置超时，避免某些图片一直不加载
        setTimeout(() => {
          cleanup();
          resolve();
        }, 3000);
      });
    });

    await Promise.all(imagePromises);
  };

  /**
   * 使用元数据立即计算布局（不等待图片加载）
   */
  const recalculateAfterImagesLoaded = async (): Promise<void> => {
    layoutReady.value = false;

    // 等待 DOM 更新，确保所有元素都已渲染
    await nextTick();

    // 立即计算布局（使用 aspectRatio 预设的高度）
    calculateLayout();

    // 等待浏览器完成位置样式的应用（等待下一帧）
    await new Promise(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    );

    // 标记布局就绪，立即显示
    layoutReady.value = true;

    // 不再在图片加载完成后重新计算布局，避免位置闪烁
    // aspectRatio 已经预设了正确的高度，不需要重新计算
  };

  /**
   * 重置布局状态
   */
  const resetLayout = () => {
    itemRefs.value = [];
    itemPositions.value = {};
    waterfallHeight.value = 0;
    layoutReady.value = false;
  };

  /**
   * 处理窗口大小变化（性能优化：不需要等待图片加载）
   */
  const handleResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (layoutReady.value) {
        // 性能优化：resize 时不需要等待图片，aspectRatio 已经预设了高度
        calculateLayout();
      }
    }, 200);
  };

  // 监听窗口大小变化
  if (typeof window !== "undefined") {
    window.addEventListener("resize", handleResize);
  }

  // 组件卸载时清理
  onBeforeUnmount(() => {
    if (typeof window !== "undefined") {
      window.removeEventListener("resize", handleResize);
    }
    if (resizeTimer) {
      clearTimeout(resizeTimer);
    }
  });

  return {
    waterfallRef,
    itemPositions,
    waterfallHeight,
    columnCount,
    layoutReady,
    setItemRef,
    calculateLayout,
    recalculateAfterImagesLoaded,
    resetLayout
  };
}
