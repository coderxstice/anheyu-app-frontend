"use client";

import { useEffect, useState } from "react";

export function PwaRegistration() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator) || !window.isSecureContext) return;
    let disposed = false;
    let registration: ServiceWorkerRegistration | undefined;
    let installing: ServiceWorker | null = null;
    const installed = () => {
      if (!disposed && installing?.state === "installed" && navigator.serviceWorker.controller) setWaiting(registration?.waiting || null);
    };
    const found = () => {
      installing?.removeEventListener("statechange", installed);
      installing = registration?.installing || null;
      installing?.addEventListener("statechange", installed);
    };
    const refresh = () => {
      if (document.visibilityState === "visible") void registration?.update().catch(() => undefined);
    };
    void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).then(result => {
      if (disposed) return;
      registration = result;
      if (result.waiting && navigator.serviceWorker.controller) setWaiting(result.waiting);
      result.addEventListener("updatefound", found);
      found();
    }).catch(() => { /* Optional enhancement; offline registration must not block the page. */ });
    document.addEventListener("visibilitychange", refresh);
    return () => {
      disposed = true;
      registration?.removeEventListener("updatefound", found);
      installing?.removeEventListener("statechange", installed);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  if (!waiting) return null;
  return <aside role="status" className="fixed bottom-5 left-5 z-50 flex max-w-[calc(100vw-2.5rem)] items-center gap-3 rounded-xl border border-border bg-card p-4 text-sm shadow-lg">
    <span>新版本已就绪</span>
    <button type="button" className="text-primary font-medium" onClick={() => {
      navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), { once: true });
      waiting.postMessage({ type: "SKIP_WAITING" });
      setWaiting(null);
    }}>刷新更新</button>
    <button type="button" onClick={() => setWaiting(null)}>稍后</button>
  </aside>;
}
