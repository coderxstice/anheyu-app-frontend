/*
 * @Description: 滚动相关工具函数
 * @Author: 安知鱼
 * @Date: 2025-07-26 14:25:49
 * @LastEditTime: 2025-07-26 14:25:55
 * @LastEditors: 安知鱼
 */
/**
 * @description 平滑滚动到页面顶部
 */
export const scrollToTop = (): void => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};

/**
 * @description 平滑滚动到页面底部
 */
export const scrollToBottom = (): void => {
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: "smooth"
  });
};

/**
 * @description 平滑滚动到指定元素
 * @param {string | HTMLElement} element - 目标元素的选择器或DOM节点
 */
export const scrollToElement = (element: string | HTMLElement): void => {
  const targetElement =
    typeof element === "string" ? document.querySelector(element) : element;

  if (targetElement) {
    targetElement.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
};
