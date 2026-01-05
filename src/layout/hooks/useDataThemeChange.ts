import { ref, readonly, onMounted, onUnmounted } from "vue";
import { getConfig, responsiveStorageNameSpace } from "@/config/base";
import { darken, lighten, storageLocal } from "@pureadmin/utils";

// --- 单例状态定义 ---
let isInitialized = false;
const dataTheme = ref<boolean>(false);
const overallStyle = ref<"light" | "dark" | "system" | "auto">("light");

const mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");

// 自动切换定时器ID
let autoSwitchTimerId: ReturnType<typeof setTimeout> | null = null;

// --- 辅助函数：根据时间判断是否应该是暗色模式（早8点至晚8点为亮色） ---
const shouldBeDarkByTime = (): boolean => {
  const hour = new Date().getHours();
  // 早8点(8:00)至晚8点(20:00)为亮色模式，其他时间为暗色模式
  return hour < 8 || hour >= 20;
};

// --- 辅助函数：计算到下一个切换时间点的毫秒数 ---
const getMillisecondsToNextSwitch = (): number => {
  const now = new Date();
  const hour = now.getHours();
  const nextSwitch = new Date(now);

  if (hour < 8) {
    // 下一个切换点是今天早上8点
    nextSwitch.setHours(8, 0, 0, 0);
  } else if (hour < 20) {
    // 下一个切换点是今天晚上8点
    nextSwitch.setHours(20, 0, 0, 0);
  } else {
    // 下一个切换点是明天早上8点
    nextSwitch.setDate(nextSwitch.getDate() + 1);
    nextSwitch.setHours(8, 0, 0, 0);
  }

  return nextSwitch.getTime() - now.getTime();
};

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

  // --- 辅助函数：应用主题到 DOM ---
  const applyTheme = (isDark: boolean, epThemeColor?: string) => {
    const body = document.documentElement as HTMLElement;
    if (isDark) {
      body.classList.remove("light");
      body.classList.add("dark");
      body.setAttribute("data-theme", "dark");
      setEpThemeColor(epThemeColor || "#dfa621");
    } else {
      body.classList.remove("dark");
      body.classList.add("light");
      body.setAttribute("data-theme", "light");
      setEpThemeColor(epThemeColor || getConfig().EpThemeColor);
    }
  };

  // --- 首次初始化逻辑 ---
  if (!isInitialized) {
    const config = getConfig();
    const storageLayout = storageLocal().getItem<StorageConfigs>(storageKey);

    // 确定默认主题模式：优先使用用户存储 > 后端配置 > 前端默认配置
    let defaultThemeMode: "light" | "dark" | "system" | "auto" =
      config.OverallStyle ?? "light";

    // 如果后端配置了 DEFAULT_THEME_MODE，且用户没有存储，则使用后端配置
    if (!storageLayout && config.DEFAULT_THEME_MODE) {
      if (config.DEFAULT_THEME_MODE === "auto") {
        defaultThemeMode = "auto";
      } else {
        defaultThemeMode =
          config.DEFAULT_THEME_MODE === "dark" ? "dark" : "light";
      }
    }

    const initialOverallStyle = storageLayout?.overallStyle ?? defaultThemeMode;

    if (initialOverallStyle === "system") {
      overallStyle.value = "system";
      dataTheme.value = mediaQueryList.matches;
    } else if (initialOverallStyle === "auto") {
      overallStyle.value = "auto";
      dataTheme.value = shouldBeDarkByTime();
    } else {
      const initialDarkMode =
        storageLayout?.darkMode ?? defaultThemeMode === "dark";
      overallStyle.value = initialDarkMode ? "dark" : "light";
      dataTheme.value = initialDarkMode;
    }

    applyTheme(
      dataTheme.value,
      storageLayout?.epThemeColor ||
        (dataTheme.value ? "#dfa621" : config.EpThemeColor)
    );

    isInitialized = true;
  }

  // --- 系统主题更新回调 ---
  const updateSystemTheme = () => {
    if (overallStyle.value === "system") {
      const isDark = mediaQueryList.matches;
      dataTheme.value = isDark;
      applyTheme(isDark);

      // 更新 localStorage
      const layoutConfig =
        storageLocal().getItem<StorageConfigs>(storageKey) || {};
      layoutConfig.darkMode = isDark;
      storageLocal().setItem(storageKey, layoutConfig);
    }
  };

  // --- 自动切换主题更新回调 ---
  const updateAutoTheme = () => {
    if (overallStyle.value === "auto") {
      const isDark = shouldBeDarkByTime();
      dataTheme.value = isDark;
      applyTheme(isDark);

      // 更新 localStorage
      const layoutConfig =
        storageLocal().getItem<StorageConfigs>(storageKey) || {};
      layoutConfig.darkMode = isDark;
      storageLocal().setItem(storageKey, layoutConfig);

      // 设置下一次切换的定时器
      scheduleNextAutoSwitch();
    }
  };

  // --- 设置自动切换定时器 ---
  const scheduleNextAutoSwitch = () => {
    if (autoSwitchTimerId) {
      clearTimeout(autoSwitchTimerId);
    }
    if (overallStyle.value === "auto") {
      const msToNextSwitch = getMillisecondsToNextSwitch();
      autoSwitchTimerId = setTimeout(() => {
        updateAutoTheme();
      }, msToNextSwitch);
    }
  };

  // --- 清除自动切换定时器 ---
  const clearAutoSwitchTimer = () => {
    if (autoSwitchTimerId) {
      clearTimeout(autoSwitchTimerId);
      autoSwitchTimerId = null;
    }
  };

  // --- 页面可见性变化处理（用户从其他标签页回来时检查是否需要更新主题） ---
  const handleVisibilityChange = () => {
    if (
      document.visibilityState === "visible" &&
      overallStyle.value === "auto"
    ) {
      const shouldBeDark = shouldBeDarkByTime();
      // 如果当前主题与应该显示的主题不一致，立即更新
      if (dataTheme.value !== shouldBeDark) {
        updateAutoTheme();
      } else {
        // 重新设置定时器，因为可能已经过期
        scheduleNextAutoSwitch();
      }
    }
  };

  /**
   * 核心的主题切换函数。
   */
  function dataThemeChange(
    newOverallStyle?: "light" | "dark" | "system" | "auto"
  ) {
    if (!newOverallStyle) return;

    overallStyle.value = newOverallStyle;
    let newEpThemeColor = getConfig().EpThemeColor;

    // 清理之前的监听器和定时器
    mediaQueryList.removeEventListener("change", updateSystemTheme);
    clearAutoSwitchTimer();

    // 清理页面可见性监听器
    document.removeEventListener("visibilitychange", handleVisibilityChange);

    if (newOverallStyle === "system") {
      mediaQueryList.addEventListener("change", updateSystemTheme);
      updateSystemTheme();
      return;
    } else if (newOverallStyle === "auto") {
      dataTheme.value = shouldBeDarkByTime();
      scheduleNextAutoSwitch();
      // 添加页面可见性监听
      document.addEventListener("visibilitychange", handleVisibilityChange);
    } else {
      dataTheme.value = newOverallStyle === "dark";
    }

    newEpThemeColor = dataTheme.value ? "#dfa621" : getConfig().EpThemeColor;
    applyTheme(dataTheme.value, newEpThemeColor);

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
    } else if (overallStyle.value === "auto") {
      scheduleNextAutoSwitch();
      // 监听页面可见性变化，确保用户从其他标签页回来时主题正确
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }
  });

  onUnmounted(() => {
    mediaQueryList.removeEventListener("change", updateSystemTheme);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    clearAutoSwitchTimer();
  });

  return {
    dataTheme: readonly(dataTheme),
    overallStyle: readonly(overallStyle),
    dataThemeChange
  };
}
