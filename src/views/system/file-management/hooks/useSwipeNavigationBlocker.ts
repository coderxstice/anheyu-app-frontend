/*
 * @Description: 阻止在特定容器内的滑动导航
 * @Author: 安知鱼
 * @Date: 2025-07-05 11:32:52
 * @LastEditTime: 2025-07-05 11:32:56
 * @LastEditors: 安知鱼
 */
// src/views/system/file-management/hooks/useSwipeNavigationBlocker.ts
import { onMounted, onUnmounted, type Ref } from "vue";

export function useSwipeNavigationBlocker(
  containerRef: Ref<HTMLElement | null>
) {
  const preventSwipeNavigation = (event: WheelEvent) => {
    if (!containerRef.value?.contains(event.target as Node)) {
      return;
    }

    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
      let currentTarget = event.target as HTMLElement | null;

      while (currentTarget && currentTarget !== containerRef.value) {
        const canScrollHorizontally =
          currentTarget.scrollWidth > currentTarget.clientWidth;
        const { overflowX } = window.getComputedStyle(currentTarget);

        if (
          (overflowX === "auto" || overflowX === "scroll") &&
          canScrollHorizontally
        ) {
          return;
        }
        currentTarget = currentTarget.parentElement;
      }

      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      event.preventDefault();
    }
  };

  onMounted(() => {
    window.addEventListener("wheel", preventSwipeNavigation, {
      passive: false
    });
  });

  onUnmounted(() => {
    window.removeEventListener("wheel", preventSwipeNavigation);
  });
}
