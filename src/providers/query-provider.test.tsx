import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getQueryClient } from "./query-provider";

describe("QueryProvider browser cache", () => {
  beforeEach(() => vi.useFakeTimers());

  afterEach(() => {
    getQueryClient().clear();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("shares browser query data and evicts idle entries after an hour", () => {
    getQueryClient().setQueryData(["browser-data"], "cached value");

    expect(getQueryClient().getQueryData(["browser-data"])).toBe("cached value");
    vi.advanceTimersByTime(3_599_999);
    expect(getQueryClient().getQueryData(["browser-data"])).toBe("cached value");
    vi.advanceTimersByTime(1);
    expect(getQueryClient().getQueryData(["browser-data"])).toBeUndefined();
  });
});
