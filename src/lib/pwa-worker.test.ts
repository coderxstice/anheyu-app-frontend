import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";
import { buildServiceWorker } from "./pwa-worker";

function worker(options: { cacheUnavailable?: boolean } = {}) {
  const handlers: Record<string, (event: Record<string, unknown>) => void> = {};
  const cache = { match: vi.fn().mockResolvedValue(undefined), put: vi.fn().mockResolvedValue(undefined), keys: vi.fn().mockResolvedValue([]), delete: vi.fn(), add: vi.fn() };
  const fetcher = vi.fn().mockResolvedValue(new Response("javascript", { headers: { "Content-Type": "application/javascript" } }));
  runInNewContext(buildServiceWorker("test-build"), { URL, Request, Response, fetch: fetcher, caches: { open: async () => {
    if (options.cacheUnavailable) throw new Error("CacheStorage unavailable");
    return cache;
  } }, self: {
    location: { origin: "https://example.test" }, addEventListener: (name: string, handler: typeof handlers[string]) => { handlers[name] = handler; },
  } });
  const request = async (path: string, mode = "cors", headers: Record<string, string> = {}) => {
    let response: Promise<Response> | undefined;
    handlers.fetch({ request: { url: `https://example.test${path}`, method: "GET", mode, headers: new Headers(headers) }, respondWith: (result: Promise<Response>) => { response = result; } });
    return response;
  };
  return { request, cache, fetcher };
}

describe("PWA privacy boundary", () => {
  it("keeps network assets working and provides generic offline text if CacheStorage is unavailable", async () => {
    const { request, fetcher } = worker({ cacheUnavailable: true });
    expect(await (await request("/_next/static/chunk.js"))?.text()).toBe("javascript");
    fetcher.mockRejectedValueOnce(new Error("offline"));
    const response = await request("/posts/demo", "navigate");
    expect(response?.status).toBe(503);
    expect(await response?.text()).toContain("当前离线");
  });
  it("bypasses authentication, admin, API and authorization requests", async () => {
    const {request,fetcher} = worker();
    for (const path of ["/api/articles", "/admin", "/login", "/auth/callback"]) expect(await request(path, "navigate")).toBeUndefined();
    expect(await request("/_next/static/chunk.js", "cors", {Authorization:"Bearer token"})).toBeUndefined();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("never caches article HTML, including paid or password content", async () => {
    const {request,cache} = worker();
    await request("/posts/paid", "navigate");
    await request("/posts/password", "navigate");
    expect(cache.put).not.toHaveBeenCalled();
  });
  it("caches static chunks but rejects HTML fallbacks and private responses", async () => {
    const {request,cache,fetcher} = worker();
    await request("/_next/static/chunk.js");
    expect(cache.put).toHaveBeenCalledTimes(1);
    fetcher.mockResolvedValueOnce(new Response("<html>", {headers:{"Content-Type":"text/html"}}));
    await request("/_next/static/missing.js");
    fetcher.mockResolvedValueOnce(new Response("private", {headers:{"Cache-Control":"private"}}));
    await request("/_next/static/private.js");
    expect(cache.put).toHaveBeenCalledTimes(1);
  });
  it("uses a generic offline page on network failure", async () => {
    const {request,cache,fetcher} = worker();
    fetcher.mockRejectedValueOnce(new Error("offline"));
    cache.match.mockResolvedValueOnce(new Response("offline page"));
    expect(await (await request("/posts/private", "navigate"))?.text()).toBe("offline page");
    expect(cache.match).toHaveBeenCalledWith("/offline.html");
    expect(cache.put).not.toHaveBeenCalled();
  });
});
