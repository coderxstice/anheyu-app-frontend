import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { buildServiceWorker } from "@/lib/pwa-worker";

export const dynamic = "force-dynamic";

export async function GET() {
  let buildId: string;
  try {
    buildId = (await readFile(join(process.cwd(), ".next/BUILD_ID"), "utf8")).trim();
  } catch {
    return new Response("Service worker requires a production build", { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  return new Response(buildServiceWorker(buildId), { headers: {
    "Content-Type": "application/javascript; charset=utf-8",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Service-Worker-Allowed": "/",
  } });
}
