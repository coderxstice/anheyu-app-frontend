// @vitest-environment node

import { useQuery } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getQueryClient, QueryProvider } from "./query-provider";

describe("QueryProvider SSR lifecycle", () => {
  beforeEach(() => vi.useFakeTimers());

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("does not retain query cleanup timers after repeated server renders", () => {
    const queryFn = vi.fn(async () => "loaded");

    function QueryContent() {
      const { data } = useQuery({ queryKey: ["ssr-lifecycle"], queryFn });
      return <span>{data ?? "loading"}</span>;
    }

    for (let request = 0; request < 20; request++) {
      expect(renderToString(<QueryProvider><QueryContent /></QueryProvider>)).toBe("<span>loading</span>");
    }

    expect(queryFn).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("isolates cached query data between server requests", () => {
    const firstRequest = getQueryClient();
    const secondRequest = getQueryClient();

    try {
      firstRequest.setQueryData(["request-data"], "first request");

      expect(secondRequest.getQueryData(["request-data"])).toBeUndefined();
      expect(firstRequest.getQueryData(["request-data"])).toBe("first request");
    } finally {
      firstRequest.clear();
      secondRequest.clear();
    }
  });
});
