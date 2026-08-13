export const DEFAULT_THEME_LIGHT_START_TIME = "08:00";
export const DEFAULT_THEME_DARK_START_TIME = "20:00";
export const AUTO_THEME_STORAGE_KEY = "anheyu-theme-auto-managed";
export const THEME_PREFERENCE_CHANGE_EVENT = "anheyu:theme-preference-change";
export const THEME_TEMPORARY_OVERRIDE_EVENT = "anheyu:theme-temporary-override";
export const THEME_STORAGE_KEY = "theme";

export type ScheduledTheme = "light" | "dark";

export interface ScheduledThemeConfig {
  lightStartTime?: string | null;
  darkStartTime?: string | null;
}

export interface NormalizedScheduledThemeConfig {
  lightStartTime: string;
  darkStartTime: string;
  lightStartMinutes: number;
  darkStartMinutes: number;
}

export interface ThemeTemporaryOverrideDetail {
  active: boolean;
}

const STRICT_TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
let temporaryThemeOverrideActive = false;

function parseTimeToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function isValidScheduledThemeTime(
  value: string | null | undefined
): value is string {
  return typeof value === "string" && STRICT_TIME_PATTERN.test(value);
}

export function normalizeScheduledThemeConfig(
  config: ScheduledThemeConfig = {}
): NormalizedScheduledThemeConfig {
  const lightStartTime = config.lightStartTime;
  const darkStartTime = config.darkStartTime;
  const isValidGroup =
    isValidScheduledThemeTime(lightStartTime) &&
    isValidScheduledThemeTime(darkStartTime) &&
    lightStartTime !== darkStartTime;

  const normalizedLightStartTime = isValidGroup ? lightStartTime : DEFAULT_THEME_LIGHT_START_TIME;
  const normalizedDarkStartTime = isValidGroup ? darkStartTime : DEFAULT_THEME_DARK_START_TIME;

  return {
    lightStartTime: normalizedLightStartTime,
    darkStartTime: normalizedDarkStartTime,
    lightStartMinutes: parseTimeToMinutes(normalizedLightStartTime),
    darkStartMinutes: parseTimeToMinutes(normalizedDarkStartTime),
  };
}

export function resolveScheduledTheme(now: Date, config: ScheduledThemeConfig): ScheduledTheme {
  const { lightStartMinutes, darkStartMinutes } = normalizeScheduledThemeConfig(config);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isLight =
    lightStartMinutes < darkStartMinutes
      ? currentMinutes >= lightStartMinutes && currentMinutes < darkStartMinutes
      : currentMinutes >= lightStartMinutes || currentMinutes < darkStartMinutes;

  return isLight ? "light" : "dark";
}

export function getNextScheduledThemeDelay(now: Date, config: ScheduledThemeConfig): number {
  const { lightStartMinutes, darkStartMinutes } = normalizeScheduledThemeConfig(config);
  const nowTime = now.getTime();

  const boundaryTimes = [lightStartMinutes, darkStartMinutes].map(totalMinutes => {
    const boundary = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      Math.floor(totalMinutes / 60),
      totalMinutes % 60,
      0,
      0
    );

    if (boundary.getTime() <= nowTime) {
      boundary.setDate(boundary.getDate() + 1);
    }

    return boundary.getTime();
  });

  return Math.min(...boundaryTimes) - nowTime;
}

export function clearAutoThemeManagement(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTO_THEME_STORAGE_KEY);
  window.dispatchEvent(new Event(THEME_PREFERENCE_CHANGE_EVENT));
}

export function isAutoThemeManaged(): boolean {
  return typeof window !== "undefined" && window.localStorage.getItem(AUTO_THEME_STORAGE_KEY) === "true";
}

export function isThemeTemporaryOverrideActive(): boolean {
  return temporaryThemeOverrideActive;
}

export function notifyThemeTemporaryOverride(active: boolean): void {
  if (typeof window === "undefined") return;
  temporaryThemeOverrideActive = active;
  window.dispatchEvent(
    new CustomEvent<ThemeTemporaryOverrideDetail>(THEME_TEMPORARY_OVERRIDE_EVENT, {
      detail: { active },
    })
  );
}
