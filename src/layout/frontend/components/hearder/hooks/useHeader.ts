/*
 * @Description: 一个处理 Header 滚动样式的 Hook
 * @Author: 安知鱼
 * @Date: 2025-08-07 15:37:04
 * @LastEditTime: 2025-08-16 13:46:18
 * @LastEditors: 安知鱼
 */
import { ref, onMounted, onUnmounted } from "vue";
import { throttle } from "lodash-es";

/**
 * 一个处理 Header 滚动样式的 Hook
 */
export function useHeader() {
  // --- 状态定义 ---
  // 追踪 Header 是否应该为透明状态
  const isHeaderTransparent = ref(true);
  // 追踪页面是否向下滚动，用于触发菜单切换动画
  const isScrolled = ref(false);
  // 记录上一次的滚动位置，用于判断滚动方向
  const lastScrollTop = ref(0);

  // --- 滚动事件处理函数 ---
  const handleScroll = () => {
    const scrollTop = window.scrollY;

    // 1. 处理透明状态：只有在页面最顶部时才透明
    isHeaderTransparent.value = scrollTop === 0;

    // 2. 处理菜单切换动画：根据滚动方向和阈值
    // 设置一个阈值，比如滚动超过 60px 才触发效果
    if (scrollTop > 60) {
      // 向下滚动
      if (scrollTop > lastScrollTop.value) {
        isScrolled.value = true;
      } else {
        // 向上滚动
        isScrolled.value = false;
      }
    } else {
      // 在页面顶部附近时，恢复默认菜单状态
      isScrolled.value = false;
    }
    // 更新上一次的滚动位置
    lastScrollTop.value = scrollTop <= 0 ? 0 : scrollTop;
  };

  // 使用 lodash 的 throttle 函数对 handleScroll 进行节流
  // 这意味着滚动事件处理函数每 100 毫秒最多执行一次，避免性能问题
  const throttledScrollHandler = throttle(handleScroll, 100);

  // --- 生命周期钩子 ---
  onMounted(() => {
    handleScroll();
    window.addEventListener("scroll", throttledScrollHandler);
  });

  onUnmounted(() => {
    // 在组件卸载前，移除事件监听器，防止内存泄漏
    window.removeEventListener("scroll", throttledScrollHandler);
  });

  return {
    isHeaderTransparent,
    isScrolled
  };
}
