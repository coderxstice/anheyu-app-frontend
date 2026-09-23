// HTML and API responses are deliberately never written to CacheStorage.
export function buildServiceWorker(buildId: string): string {
  return `
const CACHE = ${JSON.stringify(`anheyu-static-${buildId}`)};
const OFFLINE = "/offline.html";
const excluded = path => ["admin","api","login","register","forgot-password","reset-password","auth","user-center"].some(segment => path === "/" + segment || path.startsWith("/" + segment + "/"));
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.add(new Request(OFFLINE, {cache:"reload", credentials:"omit"}))));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("anheyu-static-") && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || excluded(url.pathname)) return;
  if (request.headers.has("Authorization")) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () => {
      try {
        const offline = await (await caches.open(CACHE)).match(OFFLINE);
        if (offline) return offline;
      } catch { /* CacheStorage may be disabled or evicted while the worker remains active. */ }
      return new Response("当前离线，请联网后重试", {status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}});
    }));
    return;
  }
  if (!url.pathname.startsWith("/_next/static/") || !/\\.(js|css|woff2?|ttf|png|jpg|jpeg|webp|svg)$/.test(url.pathname)) return;
  if (request.referrer && excluded(new URL(request.referrer).pathname)) return;
  event.respondWith((async () => {
    let cache;
    try {
      cache = await caches.open(CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
    } catch { /* A cache read failure must not prevent fetching public static assets. */ }
    const response = await fetch(request);
    const type = response.headers.get("Content-Type") || "";
    const policy = response.headers.get("Cache-Control") || "";
    if (cache && response.status === 200 && !response.redirected && !/text\\/html/i.test(type) && !/no-store|private/i.test(policy)) {
      try {
        await cache.put(request, response.clone());
        const keys = await cache.keys();
        const assets = keys.filter(key => new URL(key.url).pathname !== OFFLINE);
        await Promise.all(assets.slice(0, Math.max(0, assets.length - 200)).map(key => cache.delete(key)));
      } catch { /* Cache quota failures must not break a successful request. */ }
    }
    return response;
  })());
});
`;
}
