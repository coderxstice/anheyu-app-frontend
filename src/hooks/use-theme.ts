"use client";

import { useTheme as useNextTheme } from "next-themes";
import { clearAutoThemeManagement } from "@/lib/theme/scheduled-theme";
import { useMounted } from "./use-mounted";

export function useTheme() {
  const { theme, setTheme, systemTheme } = useNextTheme();
  const mounted = useMounted();

  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  const toggleTheme = () => {
    clearAutoThemeManagement();
    setTheme(isDark ? "light" : "dark");
  };

  return {
    theme,
    setTheme,
    currentTheme,
    isDark,
    isLight: !isDark,
    toggleTheme,
    mounted,
  };
}
