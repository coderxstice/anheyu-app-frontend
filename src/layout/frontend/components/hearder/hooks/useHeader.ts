/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-07 15:37:04
 * @LastEditTime: 2025-08-07 15:37:15
 * @LastEditors: 安知鱼
 */
import { ref, onMounted, onUnmounted } from "vue";
import { throttle } from "lodash-es"; // 引入节流函数以优化性能

/**
 * 一个处理 Header 滚动样式的 Hook
 */
export function useHeader() {
  // 创建一个 ref 来追踪 Header 是否应该为透明状态
  const isHeaderTransparent = ref(true);

  // 这是滚动事件的处理函数
  const handleScroll = () => {
    // window.scrollY 获取页面垂直滚动的距离
    // 如果滚动距离为 0，则说明在页面顶部
    const scrollTop = window.scrollY;
    isHeaderTransparent.value = scrollTop === 0;
  };

  // 使用 lodash 的 throttle 函数对 handleScroll 进行节流
  // 这意味着滚动事件处理函数每 100 毫秒最多执行一次，避免性能问题
  const throttledScrollHandler = throttle(handleScroll, 100);

  // onMounted 钩子：在组件挂载后，添加滚动事件监听器
  onMounted(() => {
    // 立即执行一次，以设置初始状态
    handleScroll();
    window.addEventListener("scroll", throttledScrollHandler);
  });

  // onUnmounted 钩子：在组件卸载前，移除事件监听器，防止内存泄漏
  onUnmounted(() => {
    window.removeEventListener("scroll", throttledScrollHandler);
  });

  // 返回响应式状态，以便组件可以使用
  return {
    isHeaderTransparent
  };
}
