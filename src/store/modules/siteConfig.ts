// src/store/modules/siteConfig.ts
import { defineStore } from "pinia";
import { getSiteConfigApi } from "@/api/user";
import type { SiteConfig } from "@/api/user";

// 定义 localStorage 存储的键名
const LOCAL_STORAGE_KEY = "site_config_cache";
// 定义缓存的有效期（例如：24小时，单位毫秒）
const CACHE_EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24小时

export const useSiteConfigStore = defineStore("pure-site-config", {
  state: () => ({
    siteConfig: null as SiteConfig | null,
    isLoaded: false
  }),
  getters: {
    getSiteConfig(state): SiteConfig | null {
      return state.siteConfig;
    },
    getWallpaperBackendApiUrl(state): string | null {
      if (state.siteConfig?.API_URL) {
        let apiUrl = state.siteConfig.API_URL;
        // 确保以斜杠结尾
        if (!apiUrl.endsWith("/")) {
          apiUrl += "/";
        }
        return apiUrl;
      }
      return null;
    }
  },
  actions: {
    async fetchSiteConfig() {
      // 1. 尝试从 localStorage 读取缓存
      const cachedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cachedData) {
        try {
          const { config, timestamp } = JSON.parse(cachedData);
          const now = Date.now();

          // 检查缓存是否过期
          if (now - timestamp < CACHE_EXPIRATION_TIME) {
            this.siteConfig = config;
            // 确保 API_URL 以斜杠结尾，因为这是业务逻辑，与缓存无关
            if (
              this.siteConfig.API_URL &&
              !this.siteConfig.API_URL.endsWith("/")
            ) {
              this.siteConfig.API_URL += "/";
            }
            this.isLoaded = true;
            console.log(
              "站点配置已从 localStorage 缓存中加载:",
              this.siteConfig
            );
            return; // 成功从缓存加载，直接返回
          } else {
            console.log("站点配置缓存已过期，将重新请求。");
            localStorage.removeItem(LOCAL_STORAGE_KEY); // 清除过期缓存
          }
        } catch (e) {
          console.error("解析 localStorage 中的站点配置失败:", e);
          localStorage.removeItem(LOCAL_STORAGE_KEY); // 清除损坏的缓存
        }
      }

      // 2. 如果缓存无效或不存在，则发起网络请求
      try {
        const res = await getSiteConfigApi();
        console.log(res);

        if (res.code === 200 && res.data) {
          this.siteConfig = res.data;
          // 处理 API_URL，确保以斜杠结尾
          if (
            this.siteConfig.API_URL &&
            !this.siteConfig.API_URL.endsWith("/")
          ) {
            this.siteConfig.API_URL += "/";
          }
          this.isLoaded = true;
          console.log("站点配置已通过网络获取并存储到 Pinia:", this.siteConfig);

          // 3. 将新获取的数据存储到 localStorage
          const dataToCache = {
            config: this.siteConfig,
            timestamp: Date.now() // 记录存储时间
          };
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToCache));
          console.log("站点配置已缓存到 localStorage。");
        } else {
          console.error("获取站点配置失败:", res.msg);
          this.siteConfig = null;
          this.isLoaded = false;
          // 可以在这里加载一个默认的本地配置，以防万一后端请求失败
          // 例如：this.siteConfig = { APP_NAME: "默认应用", ICON_URL: "/default.svg", ... };
        }
      } catch (error) {
        console.error("请求站点配置出错:", error);
        this.siteConfig = null;
        this.isLoaded = false;
        // 可以在这里加载一个默认的本地配置，以防万一请求抛出异常
      }
    }
  }
});
