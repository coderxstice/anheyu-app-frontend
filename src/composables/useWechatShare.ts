/**
 * @Description: 微信分享 composable
 * @Author: 安知鱼
 * @Date: 2025-01-24
 */

import { ref, onMounted, watch } from "vue";
import { useRoute } from "vue-router";

// 微信 JS-SDK 配置
interface JSSDKConfig {
  appId: string;
  timestamp: number;
  nonceStr: string;
  signature: string;
}

// 分享配置
interface ShareConfig {
  title: string; // 分享标题
  desc: string; // 分享描述
  link: string; // 分享链接
  imgUrl: string; // 分享图标
}

// 声明微信 JS-SDK 全局类型
declare global {
  interface Window {
    wx?: {
      config: (config: {
        debug?: boolean;
        appId: string;
        timestamp: number;
        nonceStr: string;
        signature: string;
        jsApiList: string[];
      }) => void;
      ready: (callback: () => void) => void;
      error: (callback: (res: { errMsg: string }) => void) => void;
      updateAppMessageShareData: (
        config: ShareConfig & {
          success?: () => void;
          fail?: (res: { errMsg: string }) => void;
        }
      ) => void;
      updateTimelineShareData: (
        config: ShareConfig & {
          success?: () => void;
          fail?: (res: { errMsg: string }) => void;
        }
      ) => void;
    };
  }
}

// 微信分享相关的 JS-SDK API 列表
const JS_API_LIST = [
  "updateAppMessageShareData", // 自定义"分享给朋友"及"分享到QQ"按钮的分享内容
  "updateTimelineShareData" // 自定义"分享到朋友圈"及"分享到QQ空间"按钮的分享内容
];

// 微信 JS-SDK 脚本 URL
const WECHAT_JSSDK_URL = "https://res.wx.qq.com/open/js/jweixin-1.6.0.js";

/**
 * 微信分享 composable
 */
export function useWechatShare() {
  const route = useRoute();

  const isWechatBrowser = ref(false);
  const isInitialized = ref(false);
  const isEnabled = ref(false);
  const error = ref<string | null>(null);

  let currentShareConfig: ShareConfig | null = null;

  /**
   * 检测是否为微信浏览器
   */
  const checkWechatBrowser = (): boolean => {
    if (typeof window === "undefined") return false;
    const ua = window.navigator.userAgent.toLowerCase();
    return ua.includes("micromessenger");
  };

  /**
   * 加载微信 JS-SDK 脚本
   */
  const loadJSSDK = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // 如果已经加载过，直接返回
      if (window.wx) {
        resolve();
        return;
      }

      // 检查是否已经存在脚本标签
      const existingScript = document.querySelector(
        `script[src="${WECHAT_JSSDK_URL}"]`
      );
      if (existingScript) {
        // 等待脚本加载完成
        existingScript.addEventListener("load", () => resolve());
        existingScript.addEventListener("error", () =>
          reject(new Error("微信JS-SDK加载失败"))
        );
        return;
      }

      // 创建并加载脚本
      const script = document.createElement("script");
      script.src = WECHAT_JSSDK_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("微信JS-SDK加载失败"));
      document.head.appendChild(script);
    });
  };

  /**
   * 获取 JS-SDK 配置
   */
  const getJSSDKConfig = async (url: string): Promise<JSSDKConfig | null> => {
    try {
      const response = await fetch(
        `/api/wechat/jssdk/config?url=${encodeURIComponent(url)}`
      );
      const result = await response.json();

      if (result.code === 0 && result.data) {
        return result.data;
      }

      console.warn("[微信分享] 获取JS-SDK配置失败:", result.msg);
      return null;
    } catch (err) {
      console.error("[微信分享] 获取JS-SDK配置异常:", err);
      return null;
    }
  };

  /**
   * 检查分享功能是否启用
   */
  const checkShareEnabled = async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/wechat/jssdk/status");
      const result = await response.json();
      return result.code === 0 && result.data?.enabled === true;
    } catch (err) {
      console.error("[微信分享] 检查分享功能状态失败:", err);
      return false;
    }
  };

  /**
   * 初始化微信 JS-SDK
   */
  const initJSSDK = async (): Promise<void> => {
    // 获取当前页面URL（不包含hash）
    const url = window.location.href.split("#")[0];

    // 获取配置
    const config = await getJSSDKConfig(url);
    if (!config) {
      throw new Error("获取JS-SDK配置失败");
    }

    // 配置 JS-SDK
    window.wx?.config({
      debug: false,
      appId: config.appId,
      timestamp: config.timestamp,
      nonceStr: config.nonceStr,
      signature: config.signature,
      jsApiList: JS_API_LIST
    });

    // 等待 JS-SDK ready
    return new Promise((resolve, reject) => {
      window.wx?.ready(() => {
        console.log("[微信分享] JS-SDK初始化成功");
        isInitialized.value = true;

        // 如果有待设置的分享配置，立即应用
        if (currentShareConfig) {
          applyShareConfig(currentShareConfig);
        }

        resolve();
      });

      window.wx?.error(res => {
        console.error("[微信分享] JS-SDK初始化失败:", res.errMsg);
        reject(new Error(res.errMsg));
      });
    });
  };

  /**
   * 应用分享配置
   */
  const applyShareConfig = (config: ShareConfig): void => {
    if (!window.wx) return;

    // 设置"分享给朋友"及"分享到QQ"
    window.wx.updateAppMessageShareData({
      ...config,
      success: () => {
        console.log("[微信分享] 设置分享给朋友成功");
      },
      fail: res => {
        console.warn("[微信分享] 设置分享给朋友失败:", res.errMsg);
      }
    });

    // 设置"分享到朋友圈"及"分享到QQ空间"
    window.wx.updateTimelineShareData({
      title: config.title, // 朋友圈分享只显示标题
      desc: config.desc,
      link: config.link,
      imgUrl: config.imgUrl,
      success: () => {
        console.log("[微信分享] 设置分享到朋友圈成功");
      },
      fail: res => {
        console.warn("[微信分享] 设置分享到朋友圈失败:", res.errMsg);
      }
    });
  };

  /**
   * 设置分享配置
   */
  const setShareConfig = (config: ShareConfig): void => {
    currentShareConfig = config;

    if (isInitialized.value) {
      applyShareConfig(config);
    }
  };

  /**
   * 初始化
   */
  const initialize = async (): Promise<void> => {
    try {
      // 检测是否为微信浏览器
      isWechatBrowser.value = checkWechatBrowser();
      if (!isWechatBrowser.value) {
        console.log("[微信分享] 非微信浏览器，跳过初始化");
        return;
      }

      // 检查分享功能是否启用
      isEnabled.value = await checkShareEnabled();
      if (!isEnabled.value) {
        console.log("[微信分享] 分享功能未启用，跳过初始化");
        return;
      }

      // 加载 JS-SDK
      await loadJSSDK();

      // 初始化 JS-SDK
      await initJSSDK();
    } catch (err) {
      console.error("[微信分享] 初始化失败:", err);
      error.value = err instanceof Error ? err.message : "初始化失败";
    }
  };

  /**
   * 路由变化时重新初始化（SPA路由变化需要重新签名）
   */
  const handleRouteChange = async (): Promise<void> => {
    if (!isWechatBrowser.value || !isEnabled.value) return;

    try {
      // 重新初始化 JS-SDK（获取新的签名）
      await initJSSDK();
    } catch (err) {
      console.error("[微信分享] 路由变化后重新初始化失败:", err);
    }
  };

  // 监听路由变化
  watch(
    () => route.fullPath,
    () => {
      // 延迟执行，确保页面已经更新
      setTimeout(handleRouteChange, 100);
    }
  );

  // 组件挂载时初始化
  onMounted(() => {
    initialize();
  });

  return {
    isWechatBrowser,
    isInitialized,
    isEnabled,
    error,
    setShareConfig,
    initialize
  };
}

/**
 * 快捷方法：设置文章分享配置
 */
export function setArticleShare(article: {
  title: string;
  description?: string;
  cover?: string;
  slug?: string;
}): ShareConfig {
  const baseUrl = window.location.origin;
  const articleUrl = article.slug
    ? `${baseUrl}/posts/${article.slug}`
    : window.location.href;

  return {
    title: article.title,
    desc: article.description || article.title,
    link: articleUrl,
    imgUrl: article.cover || `${baseUrl}/logo.png`
  };
}

/**
 * 快捷方法：设置页面分享配置
 */
export function setPageShare(page: {
  title: string;
  description?: string;
  cover?: string;
}): ShareConfig {
  const baseUrl = window.location.origin;

  return {
    title: page.title,
    desc: page.description || page.title,
    link: window.location.href,
    imgUrl: page.cover || `${baseUrl}/logo.png`
  };
}
