/*
 * @Description: 负责应用启动时的配置初始化工作。
 * 它从前端静态文件和后端API获取配置，并将其设置到全局状态中。
 * 这个模块依赖 store，必须在 Pinia 初始化后才能调用其函数。
 * @Author: 安知鱼
 * @Date: 2025-06-15 11:31:00
 * @LastEditTime: 2025-10-19 23:04:13
 * @LastEditors: 安知鱼
 */

import type { App } from "vue";
import axios from "axios";

// 从纯净的配置基础模块导入配置的存取函数
import { getConfig, setConfig } from "./base";
// 导入需要用到的 store
import { useSiteConfigStore } from "@/store/modules/siteConfig";

const { VITE_PUBLIC_PATH } = import.meta.env;

/**
 * 获取项目所有全局配置：包括前端静态配置和后端动态站点配置。
 * 这个函数应该在 Pinia store 被初始化之后，在挂载应用之前调用。
 * @param app Vue 应用实例
 */
export const initializeConfigs = async (app: App): Promise<void> => {
  // 1. 设置初始的全局 $config 对象，让它在应用中可用
  app.config.globalProperties.$config = getConfig();

  try {
    // 2. 获取并合并前端静态配置文件 platform-config.json
    try {
      const { data: frontConfig } = await axios({
        method: "get",
        url: `${VITE_PUBLIC_PATH}platform-config.json`
      });

      if (frontConfig && typeof frontConfig === "object") {
        // 使用 setConfig 合并前端配置
        setConfig(frontConfig);
        console.log("前端平台配置已加载:", frontConfig);
      } else {
        console.warn("未找到或前端平台配置格式不正确");
      }
    } catch (frontError) {
      console.error("加载前端平台配置 platform-config.json 失败:", frontError);
    }

    // 3. 通过 Pinia Store 获取并合并后端动态站点配置
    const siteConfigStore = useSiteConfigStore();
    // fetchSiteConfig 内部会处理从 API 获取数据并更新 store 状态
    await siteConfigStore.fetchSiteConfig();
    const siteConfig = siteConfigStore.getSiteConfig;

    // 4. 将后端配置也合并到全局配置状态中
    // 这确保了无论何处调用 getConfig() 都能取到最新、最全的配置
    if (siteConfig && Object.keys(siteConfig).length > 0) {
      setConfig(siteConfig);
      console.log("后端站点配置已加载:", siteConfig);
    }

    // 5. 再次更新 Vue 全局属性 $config，确保它引用的是合并后的最新配置
    app.config.globalProperties.$config = getConfig();

    // 6. 使用最终的配置来动态更新页面元信息（标题、Favicon等）
    const finalConfig = getConfig();
    if (finalConfig) {
      // SSR场景：如果是直接访问（非SPA导航）且有初始数据，保留服务端渲染的标题
      const hasInitialData =
        window.__INITIAL_DATA__ && window.__INITIAL_DATA__.data;
      const isFirstLoad = !window.history.state; // 首次加载时 history.state 为 null

      // 只有在非SSR场景或后续的客户端导航时才更新标题
      if (!hasInitialData || !isFirstLoad) {
        document.title = finalConfig.APP_NAME || finalConfig.title || "安和鱼";
      }

      // 更新 Favicon
      let faviconLink = document.querySelector(
        'link[rel="icon"]'
      ) as HTMLLinkElement;
      if (!faviconLink) {
        faviconLink = document.createElement("link");
        faviconLink.rel = "icon";
        document.head.appendChild(faviconLink);
      }
      faviconLink.href = finalConfig.ICON_URL || "/logo.svg";

      // 更新 Windows Tile Logo
      let msTileImageMeta = document.querySelector(
        'meta[name="msapplication-TileImage"]'
      ) as HTMLMetaElement;
      if (!msTileImageMeta) {
        msTileImageMeta = document.createElement("meta");
        msTileImageMeta.name = "msapplication-TileImage";
        document.head.appendChild(msTileImageMeta);
      }
      msTileImageMeta.content = finalConfig.LOGO_URL || "/logo.svg";
    }
  } catch (error) {
    console.error("初始化项目配置时发生严重错误:", error);
    // 抛出错误以通知调用方，例如在 main.ts 中捕获并处理
    throw new Error("初始化项目配置失败，请检查配置文件或后端服务。");
  }
};
