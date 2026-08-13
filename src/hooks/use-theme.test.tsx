import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AUTO_THEME_STORAGE_KEY, THEME_PREFERENCE_CHANGE_EVENT } from "@/lib/theme/scheduled-theme";
import { useTheme } from "./use-theme";

const setThemeMock = vi.hoisted(() => vi.fn());

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "light",
    systemTheme: "light",
    setTheme: setThemeMock,
  }),
}));

vi.mock("./use-mounted", () => ({
  useMounted: () => true,
}));

describe("useTheme", () => {
  afterEach(() => {
    localStorage.clear();
    setThemeMock.mockClear();
  });

  it("manual toggle leaves scheduled management before changing next-themes", () => {
    localStorage.setItem(AUTO_THEME_STORAGE_KEY, "true");
    const preferenceListener = vi.fn();
    window.addEventListener(THEME_PREFERENCE_CHANGE_EVENT, preferenceListener);
    const { result } = renderHook(() => useTheme());

    act(() => result.current.toggleTheme());

    expect(localStorage.getItem(AUTO_THEME_STORAGE_KEY)).toBeNull();
    expect(setThemeMock).toHaveBeenCalledWith("dark");
    expect(preferenceListener).toHaveBeenCalledTimes(1);
    window.removeEventListener(THEME_PREFERENCE_CHANGE_EVENT, preferenceListener);
  });
});
