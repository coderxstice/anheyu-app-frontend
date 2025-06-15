// src/store/modules/siteConfig.ts
import { defineStore } from "pinia";
import { getSiteConfigApi } from "@/api/user";
import { getConfig } from "@/config"; // 导入 getConfig 用于获取前端默认配置
import type { SiteConfig } from "@/api/user"; // 导入原始的 SiteConfig 类型

// 定义 localStorage 存储的键名
const LOCAL_STORAGE_KEY = "site_config_cache";
// 定义缓存的有效期（例如：24小时，单位毫秒）
const CACHE_EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24小时

// 将 SiteConfig 的所有属性设为可选，因为它们会通过合并逐步填充
interface CombinedSiteSettings extends Partial<SiteConfig> {
  // <--- **已修改**：使用 Partial<SiteConfig> 使所有继承属性可选
  title?: string; // 对应 APP_NAME，但作为独立的设置属性
  fixedHeader?: boolean;
  hiddenSideBar?: boolean;
  // 如果还有其他需要从前端或后端动态管理的设置，可以继续添加到这里
}

export const useSiteConfigStore = defineStore("pure-site-config", {
  // 定义 store 的状态
  state: (): {
    siteConfig: CombinedSiteSettings | null;
    isLoaded: boolean;
  } => ({
    siteConfig: null, // 将存储合并后的所有站点配置
    isLoaded: false
  }),

  // 定义 store 的 getters
  getters: {
    // 获取完整的站点配置对象
    getSiteConfig(state): CombinedSiteSettings | null {
      return state.siteConfig;
    },
    // 获取相册图片后端 API 地址
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
    },
    // 从 useSettingStore 继承的 getter: 获取页面标题
    getTitle(state): string {
      // 优先使用 siteConfig.title (来自后端 APP_NAME 或设置修改)，否则回退到前端 getConfig().Title
      return state.siteConfig?.title || getConfig().Title || "鱼鱼相册";
    },
    // 从 useSettingStore 继承的 getter: 获取固定头部设置
    getFixedHeader(state): boolean {
      // 优先使用 siteConfig.fixedHeader (来自后端或设置修改)，否则回退到前端 getConfig().FixedHeader
      return typeof state.siteConfig?.fixedHeader === "boolean"
        ? state.siteConfig.fixedHeader
        : getConfig().FixedHeader;
    },
    // 从 useSettingStore 继承的 getter: 获取隐藏侧边栏设置
    getHiddenSideBar(state): boolean {
      return typeof state.siteConfig?.hiddenSideBar === "boolean"
        ? state.siteConfig.hiddenSideBar
        : getConfig().HiddenSideBar;
    }
  },

  // 定义 store 的 actions
  actions: {
    // 从 useSettingStore 继承的 action: 更改单个设置
    CHANGE_SETTING({
      key,
      value
    }: {
      key: keyof CombinedSiteSettings;
      value: any;
    }) {
      if (this.siteConfig) {
        // 特殊处理 title，它对应后端的 APP_NAME
        if (key === "title") {
          this.siteConfig.APP_NAME = value; // 更新 APP_NAME 确保与后端对应
          this.siteConfig.title = value; // 更新本地 title 属性
        } else if (Reflect.has(this.siteConfig, key)) {
          (this.siteConfig as any)[key] = value;
        }
      }
    },
    // 从 useSettingStore 继承的 action: 封装 CHANGE_SETTING
    changeSetting(data: { key: keyof CombinedSiteSettings; value: any }) {
      this.CHANGE_SETTING(data);
    },

    // 异步获取并合并站点配置
    async fetchSiteConfig() {
      // 1. 获取前端默认配置作为初始值 (最低优先级)
      const initialConfigFromFrontend = getConfig();
      let mergedConfig: CombinedSiteSettings = {
        // 将 getConfig() 中的相关属性作为初始值
        title: initialConfigFromFrontend.Title,
        fixedHeader: initialConfigFromFrontend.FixedHeader,
        hiddenSideBar: initialConfigFromFrontend.HiddenSideBar
        // 其他 SiteConfig 属性现在已是可选，无需在此处初始化所有
      };

      // 2. 尝试从 localStorage 读取缓存 (中等优先级)
      const cachedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cachedData) {
        try {
          const { config: cachedSiteConfig, timestamp } =
            JSON.parse(cachedData);
          const now = Date.now();

          // 检查缓存是否过期
          if (now - timestamp < CACHE_EXPIRATION_TIME) {
            // 合并缓存数据到当前配置，缓存优先级高于前端默认配置
            Object.assign(mergedConfig, cachedSiteConfig);
            // 确保 title 属性在合并后存在，如果缓存中 APP_NAME 存在
            if (cachedSiteConfig.APP_NAME) {
              mergedConfig.title = cachedSiteConfig.APP_NAME;
            }
            this.siteConfig = mergedConfig;

            // 确保 API_URL 以斜杠结尾
            if (
              this.siteConfig.API_URL &&
              !this.siteConfig.API_URL.endsWith("/")
            ) {
              this.siteConfig.API_URL += "/";
            }
            this.isLoaded = true;
            console.log(
              "站点配置已从 localStorage 缓存中加载并合并:",
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

      // 3. 如果缓存无效或不存在，则发起网络请求 (最高优先级)
      try {
        const res = await getSiteConfigApi();
        console.log(res);

        if (res.code === 200 && res.data) {
          const backendSiteConfig: SiteConfig = res.data; // 后端返回的原始 SiteConfig

          // 合并后端数据到当前配置，后端数据优先级最高，会覆盖之前的值
          Object.assign(mergedConfig, backendSiteConfig);
          // 特殊处理 title：后端返回的 APP_NAME 应该作为 title
          if (backendSiteConfig.APP_NAME) {
            mergedConfig.title = backendSiteConfig.APP_NAME;
          }
          // 如果后端也提供了 fixedHeader 或 hiddenSideBar，它们会直接覆盖 mergedConfig 里的值

          this.siteConfig = mergedConfig;
          // 处理 API_URL，确保以斜杠结尾
          if (
            this.siteConfig.API_URL &&
            !this.siteConfig.API_URL.endsWith("/")
          ) {
            this.siteConfig.API_URL += "/";
          }
          this.isLoaded = true;
          console.log(
            "站点配置已通过网络获取、合并并存储到 Pinia:",
            this.siteConfig
          );

          // 4. 将最新获取的（已合并的）数据存储到 localStorage
          const dataToCache = {
            config: this.siteConfig, // 缓存完整合并后的配置
            timestamp: Date.now() // 记录存储时间
          };
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToCache));
          console.log("站点配置已缓存到 localStorage。");
        } else {
          console.error("获取站点配置失败:", res.msg);
          // 如果后端请求失败，store 将保持 initialConfigFromFrontend 或 localStorage 缓存的值
          this.siteConfig = mergedConfig;
          this.isLoaded = false;
        }
      } catch (error) {
        console.error("请求站点配置出错:", error);
        // 如果请求抛出异常，store 也将保持 initialConfigFromFrontend 或 localStorage 缓存的值
        this.siteConfig = mergedConfig;
        this.isLoaded = false;
      }
    }
  }
});
