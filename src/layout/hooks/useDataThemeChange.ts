import { ref, onBeforeMount, onUnmounted, readonly } from "vue";
import { getConfig } from "@/config/base";
import { removeToken } from "@/utils/auth";
import { routerArrays, type LayoutType } from "@/layout/types";
import { router, resetRouter } from "@/router";
import { useAppStoreHook } from "@/store/modules/app";
import { useEpThemeStoreHook } from "@/store/modules/epTheme";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import { darken, lighten, useGlobal, storageLocal } from "@pureadmin/utils";

// --- 单例状态 ---
const dataTheme = ref<boolean | null>(null);
const overallStyle = ref<string | null>(null);
let isInitialized = false;

export function useDataThemeChange() {
  const { $storage } = useGlobal<GlobalPropertiesApi>();
  const body = document.documentElement as HTMLElement;

  // 延迟初始化
  if (!isInitialized) {
    const config = getConfig();
    const storageLayout = storageLocal().getItem<LayoutType>("layout");

    dataTheme.value = storageLayout?.darkMode ?? config.DarkMode;
    overallStyle.value = storageLayout?.overallStyle ?? config.Layout; // 'Layout' 可能是 'vertical', 'horizontal' 等，根据您的配置而定

    isInitialized = true;
  }

  function toggleClass(flag: boolean, clsName: string, target?: HTMLElement) {
    const targetEl = target || document.body;
    let { className } = targetEl;
    className = className.replace(clsName, "").trim();
    targetEl.className = flag ? `${className} ${clsName}` : className;
  }

  function setPropertyPrimary(mode: string, i: number, color: string) {
    document.documentElement.style.setProperty(
      `--el-color-primary-${mode}-${i}`,
      dataTheme.value ? darken(color, i / 10) : lighten(color, i / 10)
    );
  }

  const setEpThemeColor = (color: string) => {
    useEpThemeStoreHook().setEpThemeColor(color);
    document.documentElement.style.setProperty("--el-color-primary", color);
    for (let i = 1; i <= 2; i++) setPropertyPrimary("dark", i, color);
    for (let i = 1; i <= 9; i++) setPropertyPrimary("light", i, color);
  };

  /**
   * 核心的整体风格切换函数
   */
  function dataThemeChange(newOverallStyle?: "light" | "dark" | "system") {
    if (!newOverallStyle) return;

    overallStyle.value = newOverallStyle;

    let newIsDark = false;
    if (newOverallStyle === "dark") newIsDark = true;
    else if (newOverallStyle === "light") newIsDark = false;
    else if (newOverallStyle === "system")
      newIsDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    dataTheme.value = newIsDark;

    if (dataTheme.value) {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
      setEpThemeColor("#dfa621");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      document.documentElement.setAttribute("data-theme", "light");
      setEpThemeColor(getConfig().EpThemeColor);
    }

    // 更新本地存储
    const layoutConfig = $storage.layout || {};
    layoutConfig.darkMode = dataTheme.value;
    layoutConfig.overallStyle = overallStyle.value;
    // 不再需要更新 layoutTheme 和 themeColor 等多主题相关的配置
    $storage.layout = layoutConfig;
  }

  // --- 系统主题监听逻辑 ---
  const mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");
  const updateSystemTheme = () => {
    if (overallStyle.value === "system") dataThemeChange("system");
  };
  const removeMatchMedia = () =>
    mediaQueryList.removeEventListener("change", updateSystemTheme);
  const watchSystemThemeChange = () => {
    removeMatchMedia();
    mediaQueryList.addEventListener("change", updateSystemTheme);
    updateSystemTheme();
  };

  onBeforeMount(() => {
    if (overallStyle.value === "system") watchSystemThemeChange();
  });
  onUnmounted(() => removeMatchMedia());

  function onReset() {
    removeToken();
    storageLocal().clear();
    const { Grey, Weak, MultiTagsCache, EpThemeColor, Layout } = getConfig();
    // 假设 useAppStoreHook().setLayout 仍然需要被调用
    useAppStoreHook().setLayout(Layout);
    setEpThemeColor(EpThemeColor);
    useMultiTagsStoreHook().multiTagsCacheChange(MultiTagsCache);
    toggleClass(Grey, "html-grey", document.querySelector("html"));
    toggleClass(Weak, "html-weakness", document.querySelector("html"));
    router.push("/login");
    useMultiTagsStoreHook().handleTags("equal", [...routerArrays]);
    resetRouter();
  }

  return {
    body,
    dataTheme: readonly(dataTheme),
    overallStyle: readonly(overallStyle),
    onReset,
    toggleClass,
    dataThemeChange,
    setEpThemeColor,
    watchSystemThemeChange
  };
}
