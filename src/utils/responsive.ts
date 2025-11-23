/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-15 11:31:00
 * @LastEditTime: 2025-11-23 17:12:54
 * @LastEditors: 安知鱼
 */
// 响应式storage
import type { App } from "vue";
import Storage from "responsive-storage";
import { routerArrays } from "@/layout/types";
import { responsiveStorageNameSpace } from "@/config/base";

export const injectResponsiveStorage = (app: App, config: PlatformConfigs) => {
  const nameSpace = responsiveStorageNameSpace();

  // 确定默认主题模式：优先使用后端配置的 DEFAULT_THEME_MODE
  let defaultOverallStyle = config.OverallStyle ?? "light";
  let defaultDarkMode = config.DarkMode ?? false;

  // 如果后端配置了 DEFAULT_THEME_MODE，使用它作为默认值
  if (config.DEFAULT_THEME_MODE) {
    defaultOverallStyle =
      config.DEFAULT_THEME_MODE === "dark" ? "dark" : "light";
    defaultDarkMode = config.DEFAULT_THEME_MODE === "dark";
  }

  const configObj = Object.assign(
    {
      // layout模式以及主题
      layout: Storage.getData("layout", nameSpace) ?? {
        layout: config.Layout ?? "vertical",
        theme: config.Theme ?? "light",
        darkMode: defaultDarkMode,
        sidebarStatus: config.SidebarStatus ?? true,
        epThemeColor: config.EpThemeColor ?? "#409EFF",
        themeColor: config.Theme ?? "light", // 主题色（对应系统配置中的主题色，与theme不同的是它不会受到浅色、深色整体风格切换的影响，只会在手动点击主题色时改变）
        overallStyle: defaultOverallStyle // 整体风格（浅色：light、深色：dark、自动：system）
      },
      // 系统配置-界面显示
      configure: Storage.getData("configure", nameSpace) ?? {
        grey: config.Grey ?? false,
        weak: config.Weak ?? false,
        hideTabs: config.HideTabs ?? false,
        hideFooter: config.HideFooter ?? true,
        showLogo: config.ShowLogo ?? true,
        showModel: config.ShowModel ?? "smart",
        multiTagsCache: config.MultiTagsCache ?? false,
        stretch: config.Stretch ?? false
      }
    },
    config.MultiTagsCache
      ? {
          // 默认显示顶级菜单tag
          tags: Storage.getData("tags", nameSpace) ?? routerArrays
        }
      : {}
  );

  app.use(Storage, { nameSpace, memory: configObj });
};
