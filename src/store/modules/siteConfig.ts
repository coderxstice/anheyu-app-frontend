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
import { set, merge, cloneDeep } from "lodash-es";
import { LOCAL_STORAGE_KEY } from "@/constant/index";
import { createOptimisticUpdate } from "@/views/system/settings-management/utils";
import type { SettingDescriptor } from "@/views/system/settings-management/settings.descriptor";
import { allSettingDescriptors } from "@/views/system/settings-management/settings.descriptor";

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
    rollbackState: CombinedSiteSettings | null;
    optimisticUpdateActive: boolean;
    lastSaveError: string | null;
  } => ({
    siteConfig: {},
    isLoaded: false,
    loading: false,
    rollbackState: null,
    optimisticUpdateActive: false,
    lastSaveError: null
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
    },
    // 是否开启注册功能
    enableRegistration: state => {
      const value = state.siteConfig?.ENABLE_REGISTRATION;
      // 支持布尔值和字符串类型
      return value === true || value === "true";
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

    /**
     * 从服务器获取系统设置，并完全替换本地状态（不是合并）
     * 用于设置页面加载时，确保显示的是服务器最新数据，避免数组合并导致的重复问题
     */
    async fetchSystemSettingsFresh(keys: string[]) {
      this.loading = true;
      try {
        // 先清除本地缓存
        localStorage.removeItem(LOCAL_STORAGE_KEY);

        const res = await getSettingsApi(keys);
        if (res.code === 200 && res.data) {
          // 直接用服务器数据替换整个 siteConfig，而不是合并
          // 这样可以避免 lodash.merge 对数组的按索引合并问题
          this.siteConfig = res.data;

          // 更新缓存
          const dataToCache = {
            config: this.siteConfig,
            timestamp: Date.now()
          };
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToCache));
        } else {
          return Promise.reject(new Error(res.message));
        }
      } catch (error) {
        return Promise.reject(error);
      } finally {
        this.loading = false;
      }
    },

    async saveSystemSettings(
      settingsToUpdate: SettingsMap,
      descriptors: SettingDescriptor[] = allSettingDescriptors
    ) {
      this.loading = true;
      this.lastSaveError = null;

      // 保存当前状态用于回滚
      this.rollbackState = cloneDeep(this.siteConfig);

      // 执行乐观更新
      if (descriptors.length > 0) {
        try {
          this.optimisticUpdateActive = true;
          const optimisticState = createOptimisticUpdate(
            settingsToUpdate,
            descriptors
          );
          this.updateSettingsByDotKeys(optimisticState);
          console.info("乐观更新已应用，等待服务器确认...");
        } catch (error) {
          console.warn("乐观更新失败:", error);
          this.optimisticUpdateActive = false;
          // 乐观更新失败不应阻断保存流程
        }
      }

      try {
        const updateRes = await updateSettingsApi(settingsToUpdate);

        if (updateRes.code !== 200) {
          // 保存失败，回滚状态
          this.lastSaveError = updateRes.message || "未知服务器错误";
          this.rollbackToSavedState();
          message(`保存失败: ${this.lastSaveError}`, { type: "error" });
          return Promise.reject(new Error(this.lastSaveError));
        }

        // 保存成功，清理回滚状态
        this.rollbackState = null;
        this.optimisticUpdateActive = false;
        this.lastSaveError = null;
        console.info("设置保存成功，服务器已确认");

        // 备用：如果乐观更新没有执行（描述符为空），手动更新状态
        if (descriptors.length === 0) {
          console.warn("描述符为空，使用备用更新逻辑");
          const optimisticState = createOptimisticUpdate(
            settingsToUpdate,
            allSettingDescriptors
          );
          this.updateSettingsByDotKeys(optimisticState);
        }

        // 🔧 强制从服务器重新获取最新配置，确保缓存与服务器同步
        // 这解决了没有 Redis 时配置保存后需要重启才能生效的问题
        await this.forceRefreshFromServer();

        message("设置已保存成功", { type: "success" });
        return Promise.resolve();
      } catch (error: any) {
        // 网络错误或其他异常，回滚状态
        this.lastSaveError = error.message || "未知网络错误";
        this.rollbackToSavedState();
        const errorMsg = `保存失败: ${this.lastSaveError}`;
        console.error("保存设置失败:", {
          error,
          settingsToUpdate,
          optimisticUpdateActive: this.optimisticUpdateActive,
          rollbackState: !!this.rollbackState
        });
        message(errorMsg, { type: "error" });
        return Promise.reject(error);
      } finally {
        this.loading = false;
      }
    },

    /**
     * 回滚到保存的状态
     */
    rollbackToSavedState() {
      if (this.rollbackState) {
        console.info("正在回滚状态到保存前的状态...");
        this.siteConfig = cloneDeep(this.rollbackState);
        this.rollbackState = null;
        this.optimisticUpdateActive = false;

        // 同时更新localStorage缓存
        try {
          const dataToCache = {
            config: this.siteConfig,
            timestamp: Date.now()
          };
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToCache));
          console.info("状态已成功回滚，localStorage已同步");
        } catch (error) {
          console.error("Failed to update localStorage after rollback:", error);
        }
      }
    },

    /**
     * 手动触发状态回滚（用于调试或手动恢复）
     */
    manualRollback() {
      if (this.rollbackState) {
        this.rollbackToSavedState();
        message("已回滚到上次保存前的状态", { type: "info" });
      } else {
        message("没有可回滚的状态", { type: "warning" });
      }
    },

    changeSetting(data: { key: keyof CombinedSiteSettings; value: any }) {
      const { key, value } = data;
      const changes: Partial<CombinedSiteSettings> = {};
      set(changes, key, value);
      this._updateStateAndCache(changes);
    },

    /**
     * 强制从服务器重新获取配置，清除本地缓存
     * 用于确保配置保存后立即生效，特别是在没有 Redis 的情况下
     */
    async forceRefreshFromServer() {
      // 清除本地缓存
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      this.isLoaded = false;

      try {
        const res = await getSiteConfigApi();
        if (res.code === 200 && res.data) {
          this._updateStateAndCache(res.data);
          this.isLoaded = true;
          console.info("配置已从服务器重新加载");
        }
      } catch (error) {
        console.error("从服务器重新加载配置失败:", error);
      }
    },

    /**
     * 清除前端配置缓存
     * 在需要强制刷新配置时调用
     */
    clearCache() {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      this.isLoaded = false;
      console.info("配置缓存已清除");
    }
  }
});
