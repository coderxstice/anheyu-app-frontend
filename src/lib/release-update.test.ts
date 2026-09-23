import { beforeEach, describe, expect, it, vi } from "vitest";
import { compareVersions, checkForUpdate } from "./release-update";

describe("release update availability", () => {
  beforeEach(() => { sessionStorage.clear(); vi.restoreAllMocks(); });
  it("compares version components and prereleases without lexical ordering", () => {
    expect(compareVersions("1.8.9", "v1.8.23")).toBe(-1);
    expect(compareVersions("1.8.23-beta.2", "1.8.23-beta.10")).toBe(-1);
    expect(compareVersions("1.8.23", "1.8.23-beta.2")).toBe(1);
    expect(compareVersions("dev", "1.8.23")).toBeNull();
  });
  it("reports a stable community update and uses the cache", async () => {
    const fetcher = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({code:200,data:{list:[{tagName:"v1.8.24",prerelease:false,draft:false}]}})));
    expect(await checkForUpdate("1.8.23", "community")).toMatchObject({status:"available",version:"1.8.24"});
    await checkForUpdate("1.8.23", "community");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("does not advertise a community release as Pro until its binaries exist", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({code:200,data:{list:[{tagName:"v1.8.24",prerelease:false,draft:false}]}})))
      .mockResolvedValueOnce(new Response("missing",{status:404}));
    expect(await checkForUpdate("1.8.23", "pro")).toMatchObject({status:"unavailable"});
  });
  it("returns a nonblocking unavailable result when offline", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    expect(await checkForUpdate("1.8.23", "community")).toMatchObject({status:"unavailable"});
  });
});
