"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";

type Resource = { available: boolean; healthy?: boolean; entries?: number; stats?: Record<string, number>; error?: string };
type CacheStatus = { page: Resource; index: Resource; image: Resource; ssr: Resource };
const resources = [
  { key: "page", title: "页面响应缓存", note: "Go 前端代理中的公开页面短期内存缓存。", action: "清理页面缓存" },
  { key: "index", title: "搜索索引", note: "从数据库重新读取文章并重建派生索引，重建期间搜索结果可能暂不完整。", action: "重建搜索索引" },
  { key: "image", title: "图片派生缓存", note: "只清理图片样式产生的缓存，不删除上传原图。", action: "清理派生图片" },
  { key: "ssr", title: "SSR 缓存失效", note: "依赖部署中的 SSR 刷新接口，接口连接失败会单独提示。", action: "刷新 SSR 缓存" },
] as const;

export default function CachePage() {
  const [status, setStatus] = useState<CacheStatus | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");
  const [category, setCategory] = useState("all");
  const [slug, setSlug] = useState("");
  const load = useCallback(async () => {
    try {
      const result = await apiClient.get<CacheStatus>("/api/admin/cache/status");
      if (result.code !== 200) throw new Error(result.message || "读取缓存状态失败");
      setStatus(result.data); setError("");
    } catch (err) { setError(err instanceof Error ? err.message : "读取缓存状态失败"); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const run = async (type: string) => {
    setBusy(type); setError(""); setMessage("");
    try {
      const result = type === "ssr"
        ? await apiClient.post("/api/admin/cache/revalidate", {type:category, slug})
        : await apiClient.post("/api/admin/cache/manage", {type}, {timeout:120000});
      if (result.code !== 200) throw new Error(result.message || "缓存操作失败");
      setMessage(result.message || "操作完成"); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "缓存操作失败"); }
    finally { setBusy(""); }
  };
  return <div className="mx-auto max-w-5xl space-y-6">
    <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">缓存管理</h1><button type="button" className="text-primary" onClick={() => void load()}>刷新状态</button></div>
    <p className="text-sm text-muted-foreground">按当前部署展示实际能力。缓存容量和清理周期目前在服务初始化时生效，修改相关设置后需要重启；此面板不提供无效的在线调整。</p>
    {error && <p role="alert" className="rounded-lg border border-danger/30 p-3 text-danger">{error}</p>}
    {message && <p role="status" className="rounded-lg border p-3">{message}</p>}
    <div className="grid gap-4 md:grid-cols-2">{resources.map(resource => {
      const state = status?.[resource.key];
      return <section key={resource.key} className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">{resource.title}</h2>
        <p className="text-sm">{!state ? "正在读取" : !state.available ? "当前部署未启用" : state.healthy === false ? "已初始化，健康检查失败" : resource.key === "ssr" ? "已配置刷新服务" : "可用"}</p>
        <p className="text-sm text-muted-foreground">{resource.note}</p>
        {typeof state?.entries === "number" && <p className="text-sm">有效缓存条目：{state.entries}</p>}
        {state?.stats && <dl className="space-y-1 text-sm">{Object.entries(state.stats).filter(([key,v]) => ["count","total_size","hit_count","miss_count"].includes(key) && typeof v === "number").map(([key,value]) => <div className="flex justify-between gap-4" key={key}><dt>{{count:"缓存条目",total_size:"占用字节",hit_count:"累计命中",miss_count:"累计未命中"}[key] || key}</dt><dd>{value.toLocaleString()}</dd></div>)}</dl>}
        {state?.error && <p className="text-danger text-sm">{state.error}</p>}
        {resource.key === "ssr" && state?.available && <div className="space-y-2">
          <select aria-label="SSR 刷新范围" value={category} onChange={event => setCategory(event.target.value)} className="w-full rounded border bg-background p-2">
            {[['all','全部'],['article','单篇文章'],['config','站点配置'],['categories','分类'],['tags','标签'],['links','友链']].map(([value,label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          {category === "article" && <input aria-label="文章 slug" placeholder="文章 slug" value={slug} onChange={event=>setSlug(event.target.value)} className="w-full rounded border bg-background p-2"/>}
        </div>}
        <button type="button" disabled={!state?.available || Boolean(busy) || (resource.key === "ssr" && category === "article" && !slug.trim())} onClick={() => void run(resource.key)} className="rounded-lg bg-primary px-4 py-2 text-sm text-white disabled:opacity-40">{busy === resource.key ? "处理中" : resource.action}</button>
      </section>;
    })}</div>
  </div>;
}
