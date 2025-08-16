/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-07 15:37:04
 * @LastEditTime: 2025-08-16 14:44:53
 * @LastEditors: 安知鱼
 */
// hooks/useHeader.ts

import { ref, onMounted, onUnmounted } from "vue";
import { throttle } from "lodash-es";

export function useHeader() {
  const isHeaderTransparent = ref(true);
  const isScrolled = ref(false);
  const lastScrollTop = ref(0);

  const scrollPercent = ref(0);
  const isFooterVisible = ref(false);

  const handleScroll = () => {
    const scrollTop = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    isHeaderTransparent.value = scrollTop === 0;

    if (scrollTop > 60) {
      isScrolled.value = scrollTop > lastScrollTop.value;
    } else {
      isScrolled.value = false;
    }
    lastScrollTop.value = scrollTop <= 0 ? 0 : scrollTop;

    if (scrollHeight > clientHeight) {
      scrollPercent.value = Math.round(
        (scrollTop / (scrollHeight - clientHeight)) * 100
      );
    } else {
      scrollPercent.value = 0;
    }

    const footerEl = document.getElementById("footer-container");
    if (footerEl) {
      isFooterVisible.value = scrollTop + clientHeight >= footerEl.offsetTop;
    } else {
      isFooterVisible.value = false;
    }
  };

  const throttledScrollHandler = throttle(handleScroll, 72);

  onMounted(() => {
    window.addEventListener("scroll", throttledScrollHandler);
    handleScroll();
  });

  onUnmounted(() => {
    window.removeEventListener("scroll", throttledScrollHandler);
  });

  return {
    isHeaderTransparent,
    isScrolled,
    scrollPercent,
    isFooterVisible
  };
}
