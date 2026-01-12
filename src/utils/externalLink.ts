/*
 * @Description: 外链检测和处理工具
 * @Author: 安知鱼
 * @Date: 2025-11-18
 */

import { useSiteConfigStore } from "@/store/modules/siteConfig";

/**
 * 检查URL是否为外部链接
 * @param url 要检查的URL
 * @returns 是否为外部链接
 */
export function isExternalLink(url: string): boolean {
  if (!url) return false;

  // 处理相对路径
  if (url.startsWith("/") || url.startsWith("#") || url.startsWith("?")) {
    return false;
  }

  // 处理 mailto: tel: 等协议
  if (
    url.startsWith("mailto:") ||
    url.startsWith("tel:") ||
    url.startsWith("sms:")
  ) {
    return false;
  }

  try {
    const urlObj = new URL(url, window.location.origin);
    const currentHost = window.location.host;

    // 如果协议是 javascript: 或 data:，不认为是外链
    if (
      urlObj.protocol === "javascript:" ||
      urlObj.protocol === "data:" ||
      urlObj.protocol === "blob:"
    ) {
      return false;
    }

    // 比较host是否相同
    return urlObj.host !== currentHost;
  } catch {
    // 如果URL解析失败，保守地认为不是外链
    return false;
  }
}

/**
 * 处理链接点击，根据配置决定是否显示警告页面
 * @param url 目标URL
 * @param event 原始点击事件（可选，用于阻止默认行为）
 */
export function handleLinkClick(url: string, event?: Event): void {
  // 检查是否启用了外链警告
  const siteConfigStore = useSiteConfigStore();
  const enableWarning =
    siteConfigStore.siteConfig?.ENABLE_EXTERNAL_LINK_WARNING;

  // 如果未启用警告或不是外链，直接跳转
  if (!enableWarning || !isExternalLink(url)) {
    if (event) {
      // 阻止默认行为，改为新标签页打开
      event.preventDefault();
      window.open(url, "_blank");
    } else {
      // 编程式跳转 - 新标签页打开
      window.open(url, "_blank");
    }
    return;
  }

  // 检查是否在本次会话中选择了跳过警告
  const skipWarning = sessionStorage.getItem("skip-external-link-warning");
  if (skipWarning === "true") {
    if (event) {
      event.preventDefault();
      window.open(url, "_blank");
    } else {
      window.open(url, "_blank");
    }
    return;
  }

  // 阻止默认行为
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  // 在新 tab 打开警告页面
  const encodedUrl = encodeURIComponent(url);
  window.open(`/external-link-warning?url=${encodedUrl}`, "_blank");
}

/**
 * 初始化外链拦截监听器
 * 在应用启动时调用，自动拦截所有外链点击
 */
export function initExternalLinkInterceptor(): void {
  // 使用事件委托在document上监听所有链接点击
  document.addEventListener(
    "click",
    (event: MouseEvent) => {
      // 获取点击的元素
      let target = event.target as HTMLElement;

      // 向上查找最近的a标签
      while (target && target.tagName !== "A") {
        target = target.parentElement as HTMLElement;
        if (!target || target === document.body) {
          return;
        }
      }

      const link = target as HTMLAnchorElement;

      // 确保是a标签且有href
      if (!link || !link.href) {
        return;
      }

      // 如果是新窗口打开或下载链接，不拦截
      if (link.target === "_blank" || link.download) {
        return;
      }

      // 如果按住了 Ctrl/Cmd 或 Shift 键，不拦截（用户想在新标签打开）
      if (event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }

      // 检查并处理外链
      const href = link.href;
      if (isExternalLink(href)) {
        handleLinkClick(href, event);
      }
    },
    true // 使用捕获阶段，确保能拦截到所有链接点击
  );
}

/**
 * 清除本次会话的跳过警告标记
 */
export function clearSkipWarning(): void {
  sessionStorage.removeItem("skip-external-link-warning");
}
