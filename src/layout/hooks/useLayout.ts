import { computed } from "vue";
import { routerArrays } from "../types";
import { useGlobal } from "@pureadmin/utils";
import { useMultiTagsStore } from "@/store/modules/multiTags";

export function useLayout() {
  const { $storage, $config } = useGlobal<GlobalPropertiesApi>();

  const initStorage = () => {
    /** 路由 */
    if (
      useMultiTagsStore().multiTagsCache &&
      (!$storage.tags || $storage.tags.length === 0)
    ) {
      $storage.tags = routerArrays;
    }
    /** 导航 */
    if (!$storage.layout) {
      // 确定默认主题模式：优先使用后端配置的 DEFAULT_THEME_MODE
      let defaultOverallStyle = $config?.OverallStyle ?? "light";
      let defaultDarkMode = $config?.DarkMode ?? false;

      // 如果后端配置了 DEFAULT_THEME_MODE，使用它作为默认值
      if ($config?.DEFAULT_THEME_MODE) {
        defaultOverallStyle =
          $config.DEFAULT_THEME_MODE === "dark" ? "dark" : "light";
        defaultDarkMode = $config.DEFAULT_THEME_MODE === "dark";
      }

      $storage.layout = {
        layout: $config?.Layout ?? "vertical",
        theme: $config?.Theme ?? "light",
        darkMode: defaultDarkMode,
        sidebarStatus: $config?.SidebarStatus ?? true,
        epThemeColor: $config?.EpThemeColor ?? "#409EFF",
        themeColor: $config?.Theme ?? "light",
        overallStyle: defaultOverallStyle
      };
    }
    /** 灰色模式、色弱模式、隐藏标签页 */
    if (!$storage.configure) {
      $storage.configure = {
        grey: $config?.Grey ?? false,
        weak: $config?.Weak ?? false,
        hideTabs: $config?.HideTabs ?? false,
        hideFooter: $config.HideFooter ?? true,
        showLogo: $config?.ShowLogo ?? true,
        showModel: $config?.ShowModel ?? "smart",
        multiTagsCache: $config?.MultiTagsCache ?? false,
        stretch: $config?.Stretch ?? false
      };
    }
  };

  /** 清空缓存后从platform-config.json读取默认配置并赋值到storage中 */
  const layout = computed(() => {
    return $storage?.layout.layout;
  });

  const layoutTheme = computed(() => {
    return $storage.layout;
  });

  return {
    layout,
    layoutTheme,
    initStorage
  };
}
