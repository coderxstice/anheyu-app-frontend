import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AUTO_THEME_STORAGE_KEY,
  notifyThemeTemporaryOverride,
  THEME_TEMPORARY_OVERRIDE_EVENT,
  type ThemeTemporaryOverrideDetail,
} from "@/lib/theme/scheduled-theme";
import { AlbumPageClient } from "./AlbumPageClient";

const { setThemeMock, getPublicAlbumsMock, getPublicAlbumCategoriesMock } = vi.hoisted(() => ({
  setThemeMock: vi.fn(),
  getPublicAlbumsMock: vi.fn().mockResolvedValue({ list: [], total: 0 }),
  getPublicAlbumCategoriesMock: vi.fn().mockResolvedValue([]),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: setThemeMock }),
}));

vi.mock("@heroui/react", () => ({
  addToast: vi.fn(),
}));

vi.mock("@/components/layout", () => ({
  Header: () => <div>header</div>,
  Footer: () => <div>footer</div>,
}));

vi.mock("@/components/common/BannerCard", () => ({
  BannerCard: () => <div>banner</div>,
}));

vi.mock("@/components/post/Comment", () => ({
  CommentSection: () => <div>comments</div>,
}));

vi.mock("@/lib/api/album-public", () => ({
  albumPublicApi: {
    getPublicAlbums: getPublicAlbumsMock,
    getPublicAlbumCategories: getPublicAlbumCategoriesMock,
    updatePublicAlbumStat: vi.fn(),
  },
}));

vi.mock("@/store/site-config-store", () => ({
  useSiteConfigStore: (selector: (state: { siteConfig: Record<string, unknown> }) => unknown) =>
    selector({ siteConfig: { album: { layout_mode: "grid" } } }),
}));

vi.mock("./AlbumHeader", () => ({
  AlbumHeader: () => <div>album header</div>,
}));

vi.mock("./AlbumList", () => ({
  AlbumList: () => <div>album list</div>,
}));

describe("AlbumPageClient scheduled theme override", () => {
  afterEach(() => {
    cleanup();
    notifyThemeTemporaryOverride(false);
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("pauses an auto-managed theme while grid layout forces dark and resumes without restoring stale theme", async () => {
    localStorage.setItem(AUTO_THEME_STORAGE_KEY, "true");
    const overrideStates: boolean[] = [];
    const listener = (event: Event) => {
      overrideStates.push((event as CustomEvent<ThemeTemporaryOverrideDetail>).detail.active);
    };
    window.addEventListener(THEME_TEMPORARY_OVERRIDE_EVENT, listener);

    const view = render(<AlbumPageClient />);
    await waitFor(() => expect(setThemeMock).toHaveBeenCalledWith("dark"));
    expect(overrideStates).toEqual([true]);

    view.unmount();

    expect(overrideStates).toEqual([true, false]);
    expect(setThemeMock).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(AUTO_THEME_STORAGE_KEY)).toBe("true");
    window.removeEventListener(THEME_TEMPORARY_OVERRIDE_EVENT, listener);
  });

  it("keeps the historical restore behavior for a manual preference", async () => {
    const overrideListener = vi.fn();
    window.addEventListener(THEME_TEMPORARY_OVERRIDE_EVENT, overrideListener);

    const view = render(<AlbumPageClient />);
    await waitFor(() => expect(setThemeMock).toHaveBeenCalledWith("dark"));
    view.unmount();

    expect(setThemeMock).toHaveBeenNthCalledWith(2, "light");
    expect(overrideListener).not.toHaveBeenCalled();
    window.removeEventListener(THEME_TEMPORARY_OVERRIDE_EVENT, overrideListener);
  });
});
