// src/store/modules/siteConfig.ts

import { defineStore } from "pinia";
import { getConfig } from "@/config/base";
import { getSiteConfigApi, type SiteConfig } from "@/api/site";
import {
  getSettingsApi,
  updateSettingsApi,
  type SettingsMap
} from "@/api/sys-settings";
import { message } from "@/utils/message";

// 引入公告相关的函数
import { checkAndShowAnnouncementByConfig } from "@/components/AnNouncement";

// 定义了 localStorage 存储的键名
export const LOCAL_STORAGE_KEY = "site_config_cache";
// 定义了缓存的有效期（24小时）
const CACHE_EXPIRATION_TIME = 24 * 60 * 60 * 1000;

// 将 SiteConfig 的所有属性设为可选，并允许包含来自 sys-settings 的任意键值对
// 这样它就能容纳所有类型的配置了
interface CombinedSiteSettings extends Partial<SiteConfig> {
  title?: string;
  fixedHeader?: boolean;
  hiddenSideBar?: boolean;
  SiteAnnouncement?: string; // 添加公告内容的键名
  [key: string]: any;
}

export const useSiteConfigStore = defineStore("yuyu-site-config", {
  // 定义了 store 的统一状态
  state: (): {
    siteConfig: CombinedSiteSettings;
    isLoaded: boolean; // 标记公共配置是否已加载
    loading: boolean; // 用于在请求系统设置时显示加载状态
  } => ({
    siteConfig: {},
    isLoaded: false,
    loading: false
  }),

  // 定义了 store 的 getters
  getters: {
    // 获取完整的站点配置对象
    getSiteConfig(state): CombinedSiteSettings {
      return state.siteConfig;
    },
    // 获取相册图片后端 API 地址
    getWallpaperBackendApiUrl(state): string | null {
      if (state.siteConfig?.API_URL) {
        let apiUrl = state.siteConfig.API_URL;
        if (!apiUrl.endsWith("/")) {
          apiUrl += "/";
        }
        return apiUrl;
      }
      return null;
    },
    getTitle(state): string {
      return state.siteConfig?.APP_NAME || "安和鱼";
    },
    getFixedHeader(state): boolean {
      return typeof state.siteConfig?.fixedHeader === "boolean"
        ? state.siteConfig.fixedHeader
        : getConfig().FixedHeader;
    },
    getHiddenSideBar(state): boolean {
      return typeof state.siteConfig?.hiddenSideBar === "boolean"
        ? state.siteConfig.hiddenSideBar
        : getConfig().HiddenSideBar;
    },
    getLogo(state): string {
      return state.siteConfig?.LOGO_URL_192x192 || "/logo.svg";
    },
    getSiteUrl(state): string | null {
      if (state.siteConfig?.SITE_URL) {
        let siteURL = state.siteConfig.SITE_URL;
        if (siteURL.endsWith("/")) {
          siteURL = siteURL.slice(0, -1); // 去掉末尾的斜杠
        }
        return siteURL;
      }
      return null;
    }
  },

  actions: {
    /**
     * @description 一个内部方法，用于更新状态并同步到 localStorage，避免代码重复
     * @param newSettings - 需要合并到 state 的新配置
     */
    _updateStateAndCache(newSettings: Partial<CombinedSiteSettings>) {
      // 将新旧配置合并
      this.siteConfig = { ...this.siteConfig, ...newSettings };

      // 确保 API_URL 总是以斜杠结尾
      if (this.siteConfig.API_URL && !this.siteConfig.API_URL.endsWith("/")) {
        this.siteConfig.API_URL += "/";
      }

      // 传递 SiteAnnouncement 给公告函数
      if (this.siteConfig.SITE_ANNOUNCEMENT !== undefined) {
        checkAndShowAnnouncementByConfig(this.siteConfig.SITE_ANNOUNCEMENT);
      }

      // 将合并后的最新配置存入缓存
      const dataToCache = {
        config: this.siteConfig,
        timestamp: Date.now()
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToCache));
    },

    // 异步获取并合并站点公共配置（用于应用初始化）
    async fetchSiteConfig() {
      if (this.isLoaded) return; // 如果已加载，直接返回

      const initialConfig = {
        fixedHeader: getConfig().FixedHeader,
        hiddenSideBar: getConfig().HiddenSideBar
      };
      this.siteConfig = { ...initialConfig, ...this.siteConfig };

      const cachedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cachedData) {
        try {
          const { config: cachedConfig, timestamp } = JSON.parse(cachedData);
          if (Date.now() - timestamp < CACHE_EXPIRATION_TIME) {
            this._updateStateAndCache(cachedConfig);
            this.isLoaded = true;
            return;
          } else {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
          }
        } catch (error) {
          console.log("缓存数据解析失败，清除缓存:", error);

          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
      }

      try {
        const res = await getSiteConfigApi();
        if (res.code === 200 && res.data) {
          this._updateStateAndCache(res.data);
          this.isLoaded = true;
        }
      } catch (error) {
        console.error("请求站点公共配置出错:", error);
      }
    },

    /**
     * @description 专门用于从后台管理页面获取详细的系统设置
     * @param keys - 需要获取的设置项的键名数组
     */
    async fetchSystemSettings(keys: string[]) {
      this.loading = true;
      try {
        const res = await getSettingsApi(keys);
        if (res.code === 200 && res.data) {
          this._updateStateAndCache(res.data);
        } else {
          return Promise.reject(new Error(res.message));
        }
      } catch (error) {
        return Promise.reject(error);
      } finally {
        this.loading = false;
      }
    },

    /**
     * @description 用于保存系统设置到后端，并智能更新缓存
     */
    async saveSystemSettings(settingsToUpdate: SettingsMap) {
      this.loading = true;
      try {
        const updateRes = await updateSettingsApi(settingsToUpdate);
        if (updateRes.code !== 200) {
          return Promise.reject(new Error(updateRes.message));
        }

        try {
          const configRes = await getSiteConfigApi();
          if (configRes.code === 200 && configRes.data) {
            // 使用最新的完整配置来更新状态和缓存，确保数据结构正确
            this._updateStateAndCache(configRes.data);
            message("设置已保存成功", { type: "success" });
            return Promise.resolve();
          } else {
            // 如果获取最新配置失败，降级为清除缓存，强制下次刷新时重新获取
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            this.isLoaded = false;
            return Promise.reject(
              new Error("设置保存成功，但刷新缓存失败，请手动刷新页面。")
            );
          }
        } catch (fetchError) {
          // 如果网络请求失败，同样降级处理
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          this.isLoaded = false;
          console.error("刷新站点配置缓存时出错:", fetchError);
          return Promise.reject(
            new Error("设置保存成功，但刷新缓存时出错，请手动刷新页面。")
          );
        }
      } catch (error) {
        return Promise.reject(error);
      } finally {
        this.loading = false;
      }
    },

    // 用于在客户端修改如 fixedHeader 等不需持久化到后端的设置
    changeSetting(data: { key: keyof CombinedSiteSettings; value: any }) {
      const { key, value } = data;
      const changes: Partial<CombinedSiteSettings> = {};
      changes[key] = value;
      this._updateStateAndCache(changes);
    }
  }
});
