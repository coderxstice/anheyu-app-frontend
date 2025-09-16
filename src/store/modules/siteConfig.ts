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
import { set, merge } from "lodash-es";
import { LOCAL_STORAGE_KEY } from "@/constant/index";

import { checkAndShowAnnouncementByConfig } from "@/components/AnNouncement/index";

const CACHE_EXPIRATION_TIME = 24 * 60 * 60 * 1000;

interface CombinedSiteSettings extends Partial<SiteConfig> {
  title?: string;
  fixedHeader?: boolean;
  hiddenSideBar?: boolean;
  SiteAnnouncement?: string;
  [key: string]: any;
}

export const useSiteConfigStore = defineStore("anheyu-site-config", {
  state: (): {
    siteConfig: CombinedSiteSettings;
    isLoaded: boolean;
    loading: boolean;
  } => ({
    siteConfig: {},
    isLoaded: false,
    loading: false
  }),

  getters: {
    getSiteConfig: state => state.siteConfig,
    getWallpaperBackendApiUrl: state => {
      if (state.siteConfig?.API_URL) {
        let apiUrl = state.siteConfig.API_URL;
        if (!apiUrl.endsWith("/")) apiUrl += "/";
        return apiUrl;
      }
      return null;
    },
    getTitle: state => state.siteConfig?.APP_NAME || "安和鱼",
    getFixedHeader: state =>
      typeof state.siteConfig?.fixedHeader === "boolean"
        ? state.siteConfig.fixedHeader
        : getConfig().FixedHeader,
    getHiddenSideBar: state =>
      typeof state.siteConfig?.hiddenSideBar === "boolean"
        ? state.siteConfig.hiddenSideBar
        : getConfig().HiddenSideBar,
    getLogo: state => state.siteConfig?.LOGO_URL_192x192 || "/logo.svg",
    getSiteUrl: state => {
      if (state.siteConfig?.SITE_URL) {
        let siteURL = state.siteConfig.SITE_URL;
        if (siteURL.endsWith("/")) siteURL = siteURL.slice(0, -1);
        return siteURL;
      }
      return null;
    }
  },

  actions: {
    _updateStateAndCache(newSettings: Partial<CombinedSiteSettings>) {
      // 1. 创建当前状态的深拷贝以获取普通JS对象
      const currentStatePlain = JSON.parse(JSON.stringify(this.siteConfig));
      // 2. 在普通对象上执行合并操作
      const mergedState = merge(currentStatePlain, newSettings);
      // 3. 用合并后的普通对象替换整个状态
      this.siteConfig = mergedState;

      if (this.siteConfig.API_URL && !this.siteConfig.API_URL.endsWith("/")) {
        this.siteConfig.API_URL += "/";
      }

      if (this.siteConfig.SITE_ANNOUNCEMENT !== undefined) {
        checkAndShowAnnouncementByConfig(this.siteConfig.SITE_ANNOUNCEMENT);
      }

      const dataToCache = {
        config: this.siteConfig,
        timestamp: Date.now()
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToCache));
    },

    updateSettingsByDotKeys(flatSettings: Record<string, any>) {
      // 更新内存状态
      for (const dotKey in flatSettings) {
        if (Object.prototype.hasOwnProperty.call(flatSettings, dotKey)) {
          set(this.siteConfig, dotKey, flatSettings[dotKey]);
        }
      }

      // 安全地更新localStorage缓存
      try {
        const cachedDataRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
        let configToCache = {};
        if (cachedDataRaw) {
          configToCache = JSON.parse(cachedDataRaw).config || {};
        }

        for (const dotKey in flatSettings) {
          if (Object.prototype.hasOwnProperty.call(flatSettings, dotKey)) {
            set(configToCache, dotKey, flatSettings[dotKey]);
          }
        }

        const dataToCache = {
          config: configToCache,
          timestamp: Date.now()
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToCache));
      } catch (error) {
        console.error("Failed to update site config in localStorage:", error);
      }
    },

    async fetchSiteConfig() {
      if (this.isLoaded) return;

      const initialConfig = {
        fixedHeader: getConfig().FixedHeader,
        hiddenSideBar: getConfig().HiddenSideBar
      };
      // 初始化时合并，以防siteConfig为空
      merge(this.siteConfig, initialConfig);

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
          console.error("Failed to parse cached data:", error);
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

    async fetchSystemSettings(keys: string[]) {
      this.loading = true;
      try {
        const res = await getSettingsApi(keys);
        if (res.code === 200 && res.data) {
          // 返回的是嵌套对象，调用_updateStateAndCache
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

    async saveSystemSettings(settingsToUpdate: SettingsMap) {
      this.loading = true;
      try {
        const updateRes = await updateSettingsApi(settingsToUpdate);

        if (updateRes.code !== 200) {
          message(`保存失败: ${updateRes.message}`, { type: "error" });
          return Promise.reject(new Error(updateRes.message));
        }

        const stateUpdatePayload: Record<string, any> = {};
        // 只对已知的 JSON 类型配置项进行解析，确保 store 中存储的是正确的数据类型
        const jsonConfigKeys = new Set([
          "HOME_TOP",
          "FOOTER_BADGE",
          "FOOTER_SOCIAL_BAR_LEFT",
          "FOOTER_SOCIAL_BAR_RIGHT",
          "FOOTER_LIST",
          "FOOTER_BAR_LINK_LIST",
          "HEADER_MENU",
          "HEADER_NAV_MENU",
          "SIDEBAR_AUTHOR_SKILLS",
          "SIDEBAR_AUTHOR_SOCIAL",
          "SIDEBAR_TAGS_HIGHLIGHT",
          "POST_EQUIPMENT_LIST",
          "ABOUT_PAGE_AVATAR_SKILLS_LEFT",
          "ABOUT_PAGE_AVATAR_SKILLS_RIGHT",
          "ABOUT_PAGE_ABOUT_SITE_TIPS",
          "ABOUT_PAGE_MAP",
          "ABOUT_PAGE_SELF_INFO",
          "ABOUT_PAGE_PERSONALITIES",
          "ABOUT_PAGE_MAXIM",
          "ABOUT_PAGE_BUFF",
          "ABOUT_PAGE_GAME",
          "ABOUT_PAGE_COMIC",
          "ABOUT_PAGE_LIKE",
          "ABOUT_PAGE_MUSIC",
          "ABOUT_PAGE_CAREERS",
          "ABOUT_PAGE_SKILLS_TIPS",
          "FRIEND_LINK_APPLY_CONDITION"
        ]);

        for (const [key, value] of Object.entries(settingsToUpdate)) {
          if (typeof value === "string" && jsonConfigKeys.has(key)) {
            try {
              // 只对已知的 JSON 配置项进行解析
              const parsed = JSON.parse(value);
              stateUpdatePayload[key] = parsed;
            } catch {
              // 解析失败，保持原字符串（可能是格式错误的 JSON）
              stateUpdatePayload[key] = value;
            }
          } else {
            stateUpdatePayload[key] = value;
          }
        }

        // 是扁平点路径对象，调用updateSettingsByDotKeys
        this.updateSettingsByDotKeys(stateUpdatePayload);

        message("设置已保存成功", { type: "success" });
        return Promise.resolve();
      } catch (error: any) {
        message(`保存失败: ${error.message || "未知网络错误"}`, {
          type: "error"
        });
        return Promise.reject(error);
      } finally {
        this.loading = false;
      }
    },

    changeSetting(data: { key: keyof CombinedSiteSettings; value: any }) {
      const { key, value } = data;
      const changes: Partial<CombinedSiteSettings> = {};
      set(changes, key, value);
      this._updateStateAndCache(changes);
    }
  }
});
