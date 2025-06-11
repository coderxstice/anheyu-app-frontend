// src/store/modules/siteConfig.ts
import { defineStore } from "pinia";
import { getSiteConfigApi } from "@/api/user";
import type { SiteConfig } from "@/api/user";

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
      if (this.isLoaded && this.siteConfig) {
        console.log("站点配置已缓存，直接使用。");
        return;
      }
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
          console.log("站点配置已获取并存储到 Pinia:", this.siteConfig);
        } else {
          console.error("获取站点配置失败:", res.msg);
          this.siteConfig = null;
          this.isLoaded = false;
        }
      } catch (error) {
        console.error("请求站点配置出错:", error);
        this.siteConfig = null;
        this.isLoaded = false;
      }
    }
  }
});
