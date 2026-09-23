import { StrictMode } from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GlobalLoading } from "./index";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  document.documentElement.removeAttribute("data-loaded");
});

describe("GlobalLoading", () => {
  it("hides the initial overlay after StrictMode effect replay", () => {
    vi.useFakeTimers();
    render(<StrictMode><GlobalLoading /></StrictMode>);
    act(() => vi.advanceTimersByTime(150));
    expect(document.documentElement.dataset.loaded).toBe("true");
  });

  it("cancels the pending update when unmounted", () => {
    vi.useFakeTimers();
    const { unmount } = render(<GlobalLoading />);
    unmount();
    act(() => vi.advanceTimersByTime(150));
    expect(document.documentElement.dataset.loaded).toBeUndefined();
  });
});
