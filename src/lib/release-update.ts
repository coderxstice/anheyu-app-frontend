import { getChangelogList } from "@/lib/api/changelog";

export type ReleaseEdition = "community" | "pro";
export type UpdateResult = { status: "available" | "current" | "unavailable"; version?: string };

export function compareVersions(left: string, right: string): number | null {
  const parse = (value: string) => /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(value);
  const a = parse(left), b = parse(right);
  if (!a || !b) return null;
  for (let i = 1; i <= 3; i++) {
    if (Number(a[i]) !== Number(b[i])) return Number(a[i]) < Number(b[i]) ? -1 : 1;
  }
  if (!a[4] || !b[4]) return a[4] === b[4] ? 0 : a[4] ? -1 : 1;
  const aa = a[4].split("."), bb = b[4].split(".");
  for (let i = 0; i < Math.max(aa.length, bb.length); i++) {
    if (aa[i] === bb[i]) continue;
    if (aa[i] === undefined) return -1;
    if (bb[i] === undefined) return 1;
    const an = /^\d+$/.test(aa[i]), bn = /^\d+$/.test(bb[i]);
    if (an && bn) return Number(aa[i]) < Number(bb[i]) ? -1 : 1;
    if (an !== bn) return an ? -1 : 1;
    return aa[i] < bb[i] ? -1 : 1;
  }
  return 0;
}

export async function checkForUpdate(current: string, edition: ReleaseEdition, force = false): Promise<UpdateResult> {
  if (compareVersions(current, current) === null) return { status: "unavailable" };
  const key = `anheyu_update_${edition}`;
  if (!force) {
    try {
      const cached = JSON.parse(sessionStorage.getItem(key) || "null");
      if (cached?.current === current && Date.now() - cached.checkedAt < 3600000) return cached.result;
    } catch { /* Cache is optional. */ }
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await getChangelogList({ limit: 5, detail: false, prerelease: false, draft: false }, controller.signal);
    if (response.code !== 200 || !Array.isArray(response.data?.list)) return { status: "unavailable" };
    const candidates = response.data.list.filter(release => !release.draft && !release.prerelease && compareVersions(release.tagName, release.tagName) !== null)
      .sort((a, b) => compareVersions(b.tagName, a.tagName) || 0);
    let latest: string | undefined;
    for (const release of candidates) {
      const version = release.tagName.replace(/^v/, "");
      if (edition === "pro") {
        try {
          const build = await fetch(`https://pan.anzhiyu.site/d/anheyu/${encodeURIComponent(version)}/build-info.json`, { signal: controller.signal });
          if (!build.ok) continue;
          const info = await build.json();
          if (info.version?.replace(/^v/, "") !== version || !Array.isArray(info.binaries) || info.binaries.length === 0) continue;
        } catch { if (controller.signal.aborted) break; else continue; }
      }
      latest = version;
      break;
    }
    if (!latest) return { status: "unavailable" };
    const result: UpdateResult = { status: compareVersions(current, latest) === -1 ? "available" : "current", version: latest };
    try { sessionStorage.setItem(key, JSON.stringify({ current, result, checkedAt: Date.now() })); } catch { /* optional */ }
    return result;
  } catch {
    return { status: "unavailable" };
  } finally {
    clearTimeout(timer);
  }
}
