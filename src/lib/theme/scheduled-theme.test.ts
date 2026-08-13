import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEME_DARK_START_TIME,
  DEFAULT_THEME_LIGHT_START_TIME,
  getNextScheduledThemeDelay,
  normalizeScheduledThemeConfig,
  resolveScheduledTheme,
} from "./scheduled-theme";

describe("scheduled-theme", () => {
  describe("normalizeScheduledThemeConfig", () => {
    it("uses the default 08:00 to 20:00 interval", () => {
      expect(normalizeScheduledThemeConfig()).toEqual({
        lightStartTime: DEFAULT_THEME_LIGHT_START_TIME,
        darkStartTime: DEFAULT_THEME_DARK_START_TIME,
        lightStartMinutes: 480,
        darkStartMinutes: 1200,
      });
    });

    it("accepts strict HH:mm values", () => {
      expect(
        normalizeScheduledThemeConfig({
          lightStartTime: "06:30",
          darkStartTime: "22:15",
        })
      ).toEqual({
        lightStartTime: "06:30",
        darkStartTime: "22:15",
        lightStartMinutes: 390,
        darkStartMinutes: 1335,
      });
    });

    it.each([
      [{ lightStartTime: undefined, darkStartTime: "20:00" }],
      [{ lightStartTime: "invalid", darkStartTime: "20:00" }],
      [{ lightStartTime: "8:00", darkStartTime: "20:00" }],
      [{ lightStartTime: "08:00 ", darkStartTime: "20:00" }],
      [{ lightStartTime: "24:00", darkStartTime: "20:00" }],
      [{ lightStartTime: "08:00", darkStartTime: "08:00" }],
    ])("falls the whole group back when either value is missing, invalid, or equal", config => {
      expect(normalizeScheduledThemeConfig(config)).toEqual({
        lightStartTime: DEFAULT_THEME_LIGHT_START_TIME,
        darkStartTime: DEFAULT_THEME_DARK_START_TIME,
        lightStartMinutes: 480,
        darkStartMinutes: 1200,
      });
    });
  });

  describe("resolveScheduledTheme", () => {
    const daytimeConfig = { lightStartTime: "08:00", darkStartTime: "20:00" };

    it.each([
      [new Date(2026, 0, 2, 7, 59, 59), "dark"],
      [new Date(2026, 0, 2, 8, 0, 0), "light"],
      [new Date(2026, 0, 2, 19, 59, 59), "light"],
      [new Date(2026, 0, 2, 20, 0, 0), "dark"],
    ] as const)("uses a [lightStart, darkStart) interval", (now, expected) => {
      expect(resolveScheduledTheme(now, daytimeConfig)).toBe(expected);
    });

    it.each([
      [new Date(2026, 0, 2, 19, 59, 59), "dark"],
      [new Date(2026, 0, 2, 20, 0, 0), "light"],
      [new Date(2026, 0, 3, 7, 59, 59), "light"],
      [new Date(2026, 0, 3, 8, 0, 0), "dark"],
    ] as const)("supports a light interval that crosses midnight", (now, expected) => {
      expect(
        resolveScheduledTheme(now, {
          lightStartTime: "20:00",
          darkStartTime: "08:00",
        })
      ).toBe(expected);
    });

    it("supports a custom non-default interval", () => {
      const config = { lightStartTime: "09:30", darkStartTime: "18:15" };

      expect(resolveScheduledTheme(new Date(2026, 0, 2, 9, 29, 59), config)).toBe("dark");
      expect(resolveScheduledTheme(new Date(2026, 0, 2, 9, 30, 0), config)).toBe("light");
      expect(resolveScheduledTheme(new Date(2026, 0, 2, 18, 15, 0), config)).toBe("dark");
    });
  });

  describe("getNextScheduledThemeDelay", () => {
    const config = { lightStartTime: "08:00", darkStartTime: "20:00" };

    it("returns the milliseconds until today's next boundary", () => {
      expect(getNextScheduledThemeDelay(new Date(2026, 0, 2, 7, 59, 30, 500), config)).toBe(29_500);
      expect(getNextScheduledThemeDelay(new Date(2026, 0, 2, 12, 0, 0), config)).toBe(8 * 60 * 60 * 1000);
    });

    it("moves an exact boundary to the following boundary", () => {
      expect(getNextScheduledThemeDelay(new Date(2026, 0, 2, 8, 0, 0), config)).toBe(12 * 60 * 60 * 1000);
    });

    it("rolls the next boundary into tomorrow", () => {
      expect(getNextScheduledThemeDelay(new Date(2026, 0, 2, 21, 0, 0), config)).toBe(11 * 60 * 60 * 1000);
    });

    it("handles a cross-midnight light interval", () => {
      expect(
        getNextScheduledThemeDelay(new Date(2026, 0, 2, 7, 0, 0), {
          lightStartTime: "20:00",
          darkStartTime: "08:00",
        })
      ).toBe(60 * 60 * 1000);
    });

    it("uses the next-day boundary for a custom interval", () => {
      expect(
        getNextScheduledThemeDelay(new Date(2026, 0, 2, 18, 15, 0), {
          lightStartTime: "09:30",
          darkStartTime: "18:15",
        })
      ).toBe((15 * 60 + 15) * 60 * 1000);
    });
  });
});
