import { act, cleanup, render } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AUTO_THEME_STORAGE_KEY,
  DEFAULT_THEME_DARK_START_TIME,
  DEFAULT_THEME_LIGHT_START_TIME,
  notifyThemeTemporaryOverride,
  THEME_PREFERENCE_CHANGE_EVENT,
  THEME_STORAGE_KEY,
} from "@/lib/theme/scheduled-theme";
import { DefaultThemeSync } from "./DefaultThemeSync";

const { setThemeMock, storeState } = vi.hoisted(() => ({
  setThemeMock: vi.fn<(theme: string) => void>(),
  storeState: {
    isLoaded: true,
    siteConfig: {} as Record<string, string | undefined>,
  },
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ setTheme: setThemeMock }),
}));

vi.mock("@/store/site-config-store", () => ({
  useSiteConfigStore: (
    selector: (state: {
      isLoaded: boolean;
      siteConfig: Record<string, string | undefined>;
    }) => unknown
  ) => selector(storeState),
}));

function setNow(hours: number, minutes: number) {
  vi.setSystemTime(new Date(2026, 6, 15, hours, minutes));
}

function scheduledTimerDelays(): number[] {
  return vi
    .mocked(window.setTimeout)
    .mock.calls.map(call => call[1])
    .filter((delay): delay is number => typeof delay === "number" && delay >= 60_000);
}

function scheduledTimerIds(): ReturnType<typeof window.setTimeout>[] {
  return vi
    .mocked(window.setTimeout)
    .mock.calls.map((call, index) => ({ delay: call[1], index }))
    .filter(({ delay }) => typeof delay === "number" && delay >= 60_000)
    .map(({ index }) => vi.mocked(window.setTimeout).mock.results[index].value);
}

describe("DefaultThemeSync", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(window, "setTimeout");
    vi.spyOn(window, "clearTimeout");
    setNow(7, 0);
    localStorage.clear();
    notifyThemeTemporaryOverride(false);
    setThemeMock.mockReset();
    setThemeMock.mockImplementation(theme => localStorage.setItem(THEME_STORAGE_KEY, theme));
    storeState.isLoaded = true;
    storeState.siteConfig = {
      DEFAULT_THEME_MODE: "auto",
      THEME_LIGHT_START_TIME: DEFAULT_THEME_LIGHT_START_TIME,
      THEME_DARK_START_TIME: DEFAULT_THEME_DARK_START_TIME,
    };
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("首次进入 auto 时按本地时间应用主题并建立边界定时器", () => {
    render(<DefaultThemeSync />);

    expect(setThemeMock).toHaveBeenLastCalledWith("dark");
    expect(localStorage.getItem(AUTO_THEME_STORAGE_KEY)).toBe("true");
    expect(scheduledTimerDelays()).toContain(60 * 60 * 1000);
  });

  it.each(["light", "dark"])("不覆盖已有的手动 %s 偏好", theme => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);

    render(<DefaultThemeSync />);

    expect(setThemeMock).not.toHaveBeenCalled();
    expect(localStorage.getItem(AUTO_THEME_STORAGE_KEY)).toBeNull();
    expect(scheduledTimerDelays()).toHaveLength(0);
  });

  it("将历史 system 偏好迁移为定时自动托管", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "system");

    render(<DefaultThemeSync />);

    expect(setThemeMock).toHaveBeenLastCalledWith("dark");
    expect(localStorage.getItem(AUTO_THEME_STORAGE_KEY)).toBe("true");
    expect(scheduledTimerDelays()).toHaveLength(1);
  });

  it("保留历史站点级 system 模式且不启动时间计划", () => {
    storeState.siteConfig = {
      ...storeState.siteConfig,
      DEFAULT_THEME_MODE: "system",
    };

    render(<DefaultThemeSync />);

    expect(setThemeMock).toHaveBeenLastCalledWith("system");
    expect(localStorage.getItem(AUTO_THEME_STORAGE_KEY)).toBeNull();
    expect(scheduledTimerDelays()).toHaveLength(0);
  });

  it("站点配置异步加载完成后才启动计划", () => {
    storeState.isLoaded = false;
    const view = render(<DefaultThemeSync />);

    expect(setThemeMock).not.toHaveBeenCalled();

    storeState.isLoaded = true;
    view.rerender(<DefaultThemeSync />);

    expect(setThemeMock).toHaveBeenLastCalledWith("dark");
    expect(scheduledTimerDelays()).toHaveLength(1);
  });

  it("非法时间配置整组回退到默认计划", () => {
    storeState.siteConfig = {
      DEFAULT_THEME_MODE: "auto",
      THEME_LIGHT_START_TIME: "8:00",
      THEME_DARK_START_TIME: "08:00",
    };

    render(<DefaultThemeSync />);

    expect(setThemeMock).toHaveBeenLastCalledWith("dark");
    expect(scheduledTimerDelays()).toContain(60 * 60 * 1000);
  });

  it("在下一个精确边界重新计算并只保留新定时器", () => {
    setNow(7, 59);
    render(<DefaultThemeSync />);
    expect(setThemeMock).toHaveBeenLastCalledWith("dark");

    act(() => vi.advanceTimersByTime(60_000));

    expect(setThemeMock).toHaveBeenLastCalledWith("light");
    expect(scheduledTimerDelays()).toContain(12 * 60 * 60 * 1000);
    expect(scheduledTimerDelays()).toHaveLength(2);
  });

  it("页面重新可见时按当前时间纠正主题", () => {
    render(<DefaultThemeSync />);
    setThemeMock.mockClear();
    setNow(9, 0);

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(setThemeMock).not.toHaveBeenCalled();

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    act(() => document.dispatchEvent(new Event("visibilitychange")));

    expect(setThemeMock).toHaveBeenLastCalledWith("light");
    expect(scheduledTimerDelays()).toHaveLength(2);
  });

  it("focus 与 pageshow 都会按恢复时刻重新同步", () => {
    render(<DefaultThemeSync />);
    setThemeMock.mockClear();

    setNow(9, 0);
    act(() => window.dispatchEvent(new Event("focus")));
    expect(setThemeMock).toHaveBeenLastCalledWith("light");

    setNow(21, 0);
    act(() => window.dispatchEvent(new Event("pageshow")));
    expect(setThemeMock).toHaveBeenLastCalledWith("dark");
    expect(scheduledTimerDelays()).toHaveLength(3);
  });

  it("跨标签页写入手动偏好后停止自动托管", () => {
    setNow(7, 59);
    render(<DefaultThemeSync />);
    setThemeMock.mockClear();

    localStorage.removeItem(AUTO_THEME_STORAGE_KEY);
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    act(() =>
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: AUTO_THEME_STORAGE_KEY,
          oldValue: "true",
          newValue: null,
        })
      )
    );
    act(() => vi.advanceTimersByTime(2 * 60 * 1000));

    expect(setThemeMock).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("同标签页手动偏好事件立即停止边界定时器", () => {
    setNow(19, 59);
    render(<DefaultThemeSync />);
    setThemeMock.mockClear();
    localStorage.removeItem(AUTO_THEME_STORAGE_KEY);

    act(() => window.dispatchEvent(new Event(THEME_PREFERENCE_CHANGE_EVENT)));
    act(() => vi.advanceTimersByTime(2 * 60 * 1000));

    expect(setThemeMock).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("临时覆盖跨过边界时不写主题，退出后立即重算", () => {
    setNow(19, 59);
    render(<DefaultThemeSync />);
    setThemeMock.mockClear();

    act(() => notifyThemeTemporaryOverride(true));
    setNow(20, 1);
    act(() => window.dispatchEvent(new Event("focus")));
    expect(setThemeMock).not.toHaveBeenCalled();

    act(() => notifyThemeTemporaryOverride(false));

    expect(setThemeMock).toHaveBeenLastCalledWith("dark");
    expect(localStorage.getItem(AUTO_THEME_STORAGE_KEY)).toBe("true");
    expect(scheduledTimerDelays()).toHaveLength(2);
  });

  it("临时覆盖期间配置变化不写主题，退出后使用新计划", () => {
    setNow(19, 59);
    const view = render(<DefaultThemeSync />);
    act(() => notifyThemeTemporaryOverride(true));
    setThemeMock.mockClear();

    storeState.siteConfig = {
      ...storeState.siteConfig,
      THEME_LIGHT_START_TIME: "09:00",
      THEME_DARK_START_TIME: "21:00",
    };
    view.rerender(<DefaultThemeSync />);
    expect(setThemeMock).not.toHaveBeenCalled();

    act(() => notifyThemeTemporaryOverride(false));

    expect(setThemeMock).toHaveBeenLastCalledWith("light");
    expect(scheduledTimerDelays()).toHaveLength(2);
  });

  it("后台 auto 改为固定模式时保留托管关系并停止计划", () => {
    const view = render(<DefaultThemeSync />);
    setThemeMock.mockClear();

    storeState.siteConfig = {
      ...storeState.siteConfig,
      DEFAULT_THEME_MODE: "light",
    };
    view.rerender(<DefaultThemeSync />);

    expect(setThemeMock).toHaveBeenLastCalledWith("light");
    expect(localStorage.getItem(AUTO_THEME_STORAGE_KEY)).toBe("true");
    expect(scheduledTimerDelays()).toHaveLength(1);
  });

  it("后台 fixed 改回 auto 时恢复已标记访客的计划", () => {
    const view = render(<DefaultThemeSync />);
    storeState.siteConfig = {
      ...storeState.siteConfig,
      DEFAULT_THEME_MODE: "light",
    };
    view.rerender(<DefaultThemeSync />);
    setThemeMock.mockClear();

    storeState.siteConfig = {
      ...storeState.siteConfig,
      DEFAULT_THEME_MODE: "auto",
    };
    view.rerender(<DefaultThemeSync />);

    expect(setThemeMock).toHaveBeenLastCalledWith("dark");
    expect(scheduledTimerDelays()).toHaveLength(2);
  });

  it("React Strict Mode 重挂载后仍只有一个活动定时器", () => {
    const view = render(
      <StrictMode>
        <DefaultThemeSync />
      </StrictMode>
    );

    const timerIds = scheduledTimerIds();
    expect(timerIds).toHaveLength(2);
    expect(window.clearTimeout).toHaveBeenCalledWith(timerIds[0]);

    view.unmount();
    expect(window.clearTimeout).toHaveBeenCalledWith(timerIds[1]);
  });

  it("卸载时清理定时器和所有全局监听", () => {
    const view = render(<DefaultThemeSync />);
    view.unmount();
    setThemeMock.mockClear();

    act(() => {
      vi.advanceTimersByTime(24 * 60 * 60 * 1000);
      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(new Event("pageshow"));
      window.dispatchEvent(new Event(THEME_PREFERENCE_CHANGE_EVENT));
      window.dispatchEvent(new StorageEvent("storage", { key: THEME_STORAGE_KEY }));
      document.dispatchEvent(new Event("visibilitychange"));
      notifyThemeTemporaryOverride(false);
    });

    expect(setThemeMock).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
