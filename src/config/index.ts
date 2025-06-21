// config/index.ts
import axios from "axios";
import type { App } from "vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig"; // 引入 siteConfig store

let config: object = {};
const { VITE_PUBLIC_PATH } = import.meta.env;

const setConfig = (cfg?: unknown) => {
  config = Object.assign(config, cfg);
};

const getConfig = (key?: string): any => {
  // 更改为 any 或更具体的类型
  if (typeof key === "string") {
    const arr = key.split(".");
    if (arr && arr.length) {
      let data: any = config; // 明确类型
      arr.forEach(v => {
        if (data && typeof data[v] !== "undefined") {
          data = data[v];
        } else {
          data = null;
        }
      });
      return data;
    }
  }
  return config;
};

/**
 * 获取项目所有全局配置：包括前端静态配置和后端动态站点配置
 * 这个函数应该在 Pinia store 被初始化之后调用
 */
export const initializeConfigs = async (app: App): Promise<void> => {
  // 确保 $config 在 app.config.globalProperties 上可用
  app.config.globalProperties.$config = getConfig();

  try {
    // 1. 获取前端静态配置文件 platform-config.json
    const { data: frontConfig } = await axios({
      method: "get",
      url: `${VITE_PUBLIC_PATH}platform-config.json`
    });

    // 合并前端静态配置到全局 $config
    if (
      app &&
      app.config.globalProperties.$config &&
      typeof frontConfig === "object"
    ) {
      app.config.globalProperties.$config = Object.assign(
        app.config.globalProperties.$config,
        frontConfig
      );
      setConfig(app.config.globalProperties.$config); // 更新内部 config 变量
      console.log("前端平台配置已加载并合并:", frontConfig);
    } else {
      console.warn("未找到或前端平台配置格式不正确");
    }

    // 2. 获取后端动态站点配置（通过 Pinia Store）
    const siteConfigStore = useSiteConfigStore();
    await siteConfigStore.fetchSiteConfig(); // 这个函数内部已处理缓存逻辑
    const siteConfig = siteConfigStore.getSiteConfig;

    // 3. 动态更新页面元信息（从后端配置中获取）
    if (siteConfig) {
      // 更新页面标题
      if (siteConfig.APP_NAME) {
        document.title = siteConfig.APP_NAME;
      } else {
        document.title = "鱼鱼相册";
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
      faviconLink.href = siteConfig.ICON_URL || "/logo.svg";

      // 更新 Windows Tile Logo
      let msTileImageMeta = document.querySelector(
        'meta[name="msapplication-TileImage"]'
      ) as HTMLMetaElement;
      if (!msTileImageMeta) {
        msTileImageMeta = document.createElement("meta");
        msTileImageMeta.name = "msapplication-TileImage";
        document.head.appendChild(msTileImageMeta);
      }
      msTileImageMeta.content = siteConfig.LOGO_URL || "/logo.svg";

      console.log("后端站点配置已获取并更新页面元信息:", siteConfig);
    } else {
      console.warn("后端站点配置获取失败或为空。");
      // 如果后端配置失败，可以设置一个默认的页面元信息
      document.title = "鱼鱼相册";
      let faviconLink = document.querySelector(
        'link[rel="icon"]'
      ) as HTMLLinkElement;
      if (!faviconLink) {
        faviconLink = document.createElement("link");
        faviconLink.rel = "icon";
        document.head.appendChild(faviconLink);
      }
      faviconLink.href = "/logo.svg";
      let msTileImageMeta = document.querySelector(
        'meta[name="msapplication-TileImage"]'
      ) as HTMLMetaElement;
      if (!msTileImageMeta) {
        msTileImageMeta = document.createElement("meta");
        msTileImageMeta.name = "msapplication-TileImage";
        document.head.appendChild(msTileImageMeta);
      }
      msTileImageMeta.content = "/logo.svg";
    }
  } catch (error) {
    console.error("加载配置时出错:", error);
    // 抛出错误以阻止应用继续启动，或者设置默认值
    throw new Error("初始化项目配置失败，请检查配置文件或后端服务。");
  }
};

/** 本地响应式存储的命名空间 */
const responsiveStorageNameSpace = () => getConfig().ResponsiveStorageNameSpace;

export { getConfig, setConfig, responsiveStorageNameSpace };
