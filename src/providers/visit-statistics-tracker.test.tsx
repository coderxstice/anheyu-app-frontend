import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/api/client";
import { VisitStatisticsTracker } from "./visit-statistics-tracker";

const navigation = vi.hoisted(() => ({ pathname: "/posts/public-id" }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));

beforeEach(() => {
  vi.useFakeTimers();
  navigation.pathname = "/posts/public-id";
  vi.spyOn(apiClient, "post").mockResolvedValue({ code: 200, message: "success", data: null });
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("article preview visit statistics", () => {
  it.each(["/posts/draft-id/preview", "/posts/draft-id/preview/"])(
    "does not report an administrator preview at %s",
    pathname => {
      navigation.pathname = pathname;
      render(<VisitStatisticsTracker />);
      act(() => vi.runAllTimers());
      expect(apiClient.post).not.toHaveBeenCalled();
    }
  );

  it.each(["/posts/public-id", "/posts/preview"])("still reports the public article at %s", pathname => {
    navigation.pathname = pathname;
    render(<VisitStatisticsTracker />);
    act(() => vi.runAllTimers());
    expect(apiClient.post).toHaveBeenCalledTimes(1);
    expect(apiClient.post).toHaveBeenCalledWith("/api/public/statistics/visit", expect.objectContaining({
      url_path: pathname,
      duration: 0,
    }));
  });

  it("does not send the private preview path as the next public page's referrer", () => {
    navigation.pathname = "/posts/draft-id/preview";
    const view = render(<VisitStatisticsTracker />);
    act(() => vi.runAllTimers());

    navigation.pathname = "/posts/public-id";
    view.rerender(<VisitStatisticsTracker />);
    act(() => vi.runAllTimers());

    expect(apiClient.post).toHaveBeenCalledTimes(1);
    expect(apiClient.post).toHaveBeenCalledWith("/api/public/statistics/visit", expect.objectContaining({
      url_path: "/posts/public-id",
      referer: "",
    }));
  });
});
