import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AUTO_THEME_STORAGE_KEY, THEME_PREFERENCE_CHANGE_EVENT } from "@/lib/theme/scheduled-theme";
import { useKeyboardShortcuts } from "./use-keyboard-shortcuts";

const { routerPush, setThemeMock, themeState } = vi.hoisted(() => ({
  routerPush: vi.fn(),
  setThemeMock: vi.fn(),
  themeState: { theme: "light", systemTheme: "light" },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ ...themeState, setTheme: setThemeMock }),
}));

vi.mock("@heroui/react", () => ({
  addToast: vi.fn(),
}));

function KeyboardShortcutsHost() {
  useKeyboardShortcuts();
  return null;
}

function pressShiftD() {
  act(() => {
    document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift", bubbles: true }));
    document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "d", bubbles: true }));
  });
}

describe("useKeyboardShortcuts", () => {
  beforeEach(() => {
    themeState.theme = "light";
    themeState.systemTheme = "light";
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    routerPush.mockClear();
    setThemeMock.mockClear();
  });

  it("按 Shift+L 跳转到友链页实际路由", () => {
    render(<KeyboardShortcutsHost />);

    act(() => {
      document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift", bubbles: true }));
      document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "l", bubbles: true }));
    });

    expect(routerPush).toHaveBeenCalledWith("/link");
  });

  it("按 Shift+D 清除自动托管并通知同标签页 Provider", () => {
    localStorage.setItem(AUTO_THEME_STORAGE_KEY, "true");
    const preferenceListener = vi.fn();
    window.addEventListener(THEME_PREFERENCE_CHANGE_EVENT, preferenceListener, { once: true });
    render(<KeyboardShortcutsHost />);

    pressShiftD();

    expect(localStorage.getItem(AUTO_THEME_STORAGE_KEY)).toBeNull();
    expect(setThemeMock).toHaveBeenCalledWith("dark");
    expect(preferenceListener).toHaveBeenCalledTimes(1);
  });

  it("历史 system 偏好按解析后的系统主题反向切换", () => {
    themeState.theme = "system";
    themeState.systemTheme = "dark";
    render(<KeyboardShortcutsHost />);

    pressShiftD();

    expect(setThemeMock).toHaveBeenCalledWith("light");
  });
});
