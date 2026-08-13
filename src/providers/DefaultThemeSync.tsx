"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";
import { useSiteConfigStore } from "@/store/site-config-store";
import {
  AUTO_THEME_STORAGE_KEY,
  THEME_PREFERENCE_CHANGE_EVENT,
  THEME_STORAGE_KEY,
  THEME_TEMPORARY_OVERRIDE_EVENT,
  getNextScheduledThemeDelay,
  isThemeTemporaryOverrideActive,
  normalizeScheduledThemeConfig,
  resolveScheduledTheme,
  type ThemeTemporaryOverrideDetail,
} from "@/lib/theme/scheduled-theme";

function readStoredTheme(): string | null {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme == null || storedTheme === "" ? null : storedTheme;
}

/**
 * 将站点配置的默认主题同步到 next-themes，并在自动模式下按本地时间调度。
 * 明确的 light/dark 手动偏好始终优先；独立自动标记用于跨配置更新保留托管关系。
 */
export function DefaultThemeSync() {
  const { setTheme } = useTheme();
  const siteConfig = useSiteConfigStore(state => state.siteConfig);
  const isLoaded = useSiteConfigStore(state => state.isLoaded);

  useEffect(() => {
    if (typeof window === "undefined" || !isLoaded) {
      return;
    }

    const mode = siteConfig?.DEFAULT_THEME_MODE;
    const scheduleConfig = normalizeScheduledThemeConfig({
      lightStartTime: siteConfig?.THEME_LIGHT_START_TIME,
      darkStartTime: siteConfig?.THEME_DARK_START_TIME,
    });
    let timer: number | null = null;

    const clearTimer = () => {
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }
    };

    const applyAndSchedule = () => {
      clearTimer();

      if (isThemeTemporaryOverrideActive()) {
        return;
      }

      const storedTheme = readStoredTheme();
      const isAutoManaged = window.localStorage.getItem(AUTO_THEME_STORAGE_KEY) === "true";

      if (mode === "auto") {
        const canAutoManage = isAutoManaged || storedTheme === null || storedTheme === "system";
        if (!canAutoManage) {
          return;
        }

        if (!isAutoManaged) {
          window.localStorage.setItem(AUTO_THEME_STORAGE_KEY, "true");
        }

        const now = new Date();
        setTheme(resolveScheduledTheme(now, scheduleConfig));
        timer = window.setTimeout(applyAndSchedule, getNextScheduledThemeDelay(now, scheduleConfig));
        return;
      }

      if (isAutoManaged) {
        setTheme(mode === "dark" || mode === "system" ? mode : "light");
        return;
      }

      if (storedTheme === null) {
        setTheme(mode === "dark" || mode === "system" ? mode : "light");
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        applyAndSchedule();
      }
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY || event.key === AUTO_THEME_STORAGE_KEY || event.key === null) {
        applyAndSchedule();
      }
    };
    const handleManualPreference = () => clearTimer();
    const handleTemporaryOverride = (event: Event) => {
      const active = (event as CustomEvent<ThemeTemporaryOverrideDetail>).detail?.active;
      if (typeof active !== "boolean") {
        return;
      }

      if (active) {
        clearTimer();
      } else {
        applyAndSchedule();
      }
    };

    applyAndSchedule();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", applyAndSchedule);
    window.addEventListener("pageshow", applyAndSchedule);
    window.addEventListener("storage", handleStorage);
    window.addEventListener(THEME_PREFERENCE_CHANGE_EVENT, handleManualPreference);
    window.addEventListener(THEME_TEMPORARY_OVERRIDE_EVENT, handleTemporaryOverride);

    return () => {
      clearTimer();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", applyAndSchedule);
      window.removeEventListener("pageshow", applyAndSchedule);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(THEME_PREFERENCE_CHANGE_EVENT, handleManualPreference);
      window.removeEventListener(THEME_TEMPORARY_OVERRIDE_EVENT, handleTemporaryOverride);
    };
  }, [
    isLoaded,
    siteConfig?.DEFAULT_THEME_MODE,
    siteConfig?.THEME_LIGHT_START_TIME,
    siteConfig?.THEME_DARK_START_TIME,
    setTheme,
  ]);

  return null;
}
