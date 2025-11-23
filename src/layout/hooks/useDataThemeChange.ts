import { ref, readonly, onMounted, onUnmounted } from "vue";
import { getConfig, responsiveStorageNameSpace } from "@/config/base";
import { darken, lighten, storageLocal } from "@pureadmin/utils";

// --- 单例状态定义 ---
let isInitialized = false;
const dataTheme = ref<boolean>(false);
const overallStyle = ref<"light" | "dark" | "system">("light");

const mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");

export function useDataThemeChange() {
  const nameSpace = responsiveStorageNameSpace();
  const storageKey = `${nameSpace}layout`;

  // --- 辅助函数：设置 Element Plus 颜色 ---
  const setEpThemeColor = (newColor: string) => {
    document.documentElement.style.setProperty("--el-color-primary", newColor);
    for (let i = 1; i <= 2; i++) {
      document.documentElement.style.setProperty(
        `--el-color-primary-dark-${i}`,
        darken(newColor, i / 10)
      );
    }
    for (let i = 1; i <= 9; i++) {
      document.documentElement.style.setProperty(
        `--el-color-primary-light-${i}`,
        lighten(newColor, i / 10)
      );
    }
  };

  // --- 首次初始化逻辑 ---
  if (!isInitialized) {
    const config = getConfig();
    const storageLayout = storageLocal().getItem<StorageConfigs>(storageKey);

    // 确定默认主题模式：优先使用用户存储 > 后端配置 > 前端默认配置
    let defaultThemeMode = config.OverallStyle ?? "light";

    // 如果后端配置了 DEFAULT_THEME_MODE，且用户没有存储，则使用后端配置
    if (!storageLayout && config.DEFAULT_THEME_MODE) {
      defaultThemeMode =
        config.DEFAULT_THEME_MODE === "dark" ? "dark" : "light";
    }

    const initialDarkMode =
      storageLayout?.darkMode ?? defaultThemeMode === "dark";
    const initialOverallStyle = storageLayout?.overallStyle ?? defaultThemeMode;

    if (initialOverallStyle === "system") {
      overallStyle.value = "system";
      dataTheme.value = mediaQueryList.matches;
    } else {
      overallStyle.value = initialDarkMode ? "dark" : "light";
      dataTheme.value = initialDarkMode;
    }

    const body = document.documentElement as HTMLElement;
    if (dataTheme.value) {
      body.classList.remove("light");
      body.classList.add("dark");
      body.setAttribute("data-theme", "dark");
      setEpThemeColor(storageLayout?.epThemeColor || "#dfa621");
    } else {
      body.classList.remove("dark");
      body.classList.add("light");
      body.setAttribute("data-theme", "light");
      setEpThemeColor(storageLayout?.epThemeColor || config.EpThemeColor);
    }

    isInitialized = true;
  }

  // --- 系统主题更新回调 ---
  const updateSystemTheme = () => {
    if (overallStyle.value === "system") {
      const isDark = mediaQueryList.matches;
      dataTheme.value = isDark;

      const body = document.documentElement as HTMLElement;
      if (isDark) {
        body.classList.remove("light");
        body.classList.add("dark");
        body.setAttribute("data-theme", "dark");
        setEpThemeColor("#dfa621");
      } else {
        body.classList.remove("dark");
        body.classList.add("light");
        body.setAttribute("data-theme", "light");
        setEpThemeColor(getConfig().EpThemeColor);
      }

      // 更新 localStorage
      const layoutConfig =
        storageLocal().getItem<StorageConfigs>(storageKey) || {};
      layoutConfig.darkMode = isDark;
      storageLocal().setItem(storageKey, layoutConfig);
    }
  };

  /**
   * 核心的主题切换函数。
   */
  function dataThemeChange(newOverallStyle?: "light" | "dark" | "system") {
    if (!newOverallStyle) return;

    overallStyle.value = newOverallStyle;
    let newEpThemeColor = getConfig().EpThemeColor;

    if (newOverallStyle === "system") {
      mediaQueryList.addEventListener("change", updateSystemTheme);
      updateSystemTheme();
      return;
    } else {
      mediaQueryList.removeEventListener("change", updateSystemTheme);
      dataTheme.value = newOverallStyle === "dark";
    }

    const body = document.documentElement as HTMLElement;
    if (dataTheme.value) {
      body.classList.remove("light");
      body.classList.add("dark");
      body.setAttribute("data-theme", "dark");
      newEpThemeColor = "#dfa621";
    } else {
      body.classList.remove("dark");
      body.classList.add("light");
      body.setAttribute("data-theme", "light");
      newEpThemeColor = getConfig().EpThemeColor;
    }

    // 应用新的品牌色
    setEpThemeColor(newEpThemeColor);

    // 将所有更新写入 localStorage
    const layoutConfig =
      storageLocal().getItem<StorageConfigs>(storageKey) || {};
    layoutConfig.darkMode = dataTheme.value;
    layoutConfig.overallStyle = overallStyle.value;
    layoutConfig.epThemeColor = newEpThemeColor;
    storageLocal().setItem(storageKey, layoutConfig);
  }

  onMounted(() => {
    if (overallStyle.value === "system") {
      mediaQueryList.addEventListener("change", updateSystemTheme);
    }
  });

  onUnmounted(() => {
    mediaQueryList.removeEventListener("change", updateSystemTheme);
  });

  return {
    dataTheme: readonly(dataTheme),
    overallStyle: readonly(overallStyle),
    dataThemeChange
  };
}
