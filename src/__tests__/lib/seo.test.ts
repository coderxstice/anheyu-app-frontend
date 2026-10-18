import { describe, expect, it } from "vitest";
import { buildPageMetadata, getFaviconContentType, resolveSeoSiteInfo } from "@/lib/seo";

describe("buildPageMetadata canonical policy", () => {
  it("noindex 页面默认不输出 canonical", async () => {
    const metadata = await buildPageMetadata({
      title: "登录",
      description: "登录页面",
      path: "/login",
      noindex: true,
      siteConfig: {
        APP_NAME: "安和鱼",
        SUB_TITLE: "生活明朗，万物可爱",
      },
    });

    expect(metadata.alternates).toBeUndefined();
    expect(metadata.robots).toMatchObject({
      index: false,
      follow: false,
    });
  });

  it("显式 includeCanonical=true 时 noindex 页面仍可输出 canonical", async () => {
    const metadata = await buildPageMetadata({
      title: "登录",
      description: "登录页面",
      path: "/login",
      noindex: true,
      includeCanonical: true,
      siteConfig: {
        APP_NAME: "安和鱼",
        SUB_TITLE: "生活明朗，万物可爱",
      },
    });

    expect(metadata.alternates).toMatchObject({
      canonical: "/login",
    });
  });
});

describe("buildPageMetadata homepage title", () => {
  it("首页使用站点名称和副标题作为绝对 title", async () => {
    const metadata = await buildPageMetadata({
      title: "安和鱼 - 生活明朗，万物可爱",
      path: "/",
      absoluteTitle: true,
      siteConfig: {
        APP_NAME: "安和鱼",
        SUB_TITLE: "生活明朗，万物可爱",
      },
    });

    expect(metadata.title).toEqual({ absolute: "安和鱼 - 生活明朗，万物可爱" });
    expect(metadata.openGraph?.title).toBe("安和鱼 - 生活明朗，万物可爱");
    expect(metadata.twitter?.title).toBe("安和鱼 - 生活明朗，万物可爱");
  });
});

describe("site keywords metadata", () => {
  it("从 SITE_KEYWORDS 解析站点关键词，并作为页面默认 keywords", async () => {
    const site = resolveSeoSiteInfo({
      SITE_KEYWORDS: "李至臣,李懋和，中华道藏, 道教文化",
    });

    expect(site.keywords).toEqual(["李至臣", "李懋和", "中华道藏", "道教文化"]);

    const metadata = await buildPageMetadata({
      title: "首页",
      path: "/",
      absoluteTitle: true,
      siteConfig: {
        SITE_KEYWORDS: "李至臣,李懋和，中华道藏, 道教文化",
      },
    });

    expect(metadata.keywords).toEqual(["李至臣", "李懋和", "中华道藏", "道教文化"]);
  });

  it("空的 SITE_KEYWORDS 不回退到框架默认关键词", async () => {
    const site = resolveSeoSiteInfo({
      SITE_KEYWORDS: "",
    });

    expect(site.keywords).toBeUndefined();

    const metadata = await buildPageMetadata({
      title: "首页",
      path: "/",
      absoluteTitle: true,
      siteConfig: {
        SITE_KEYWORDS: "",
      },
    });

    expect(metadata.keywords).toBeUndefined();
  });

  it("页面显式传入的 keywords 优先于站点关键词", async () => {
    const metadata = await buildPageMetadata({
      title: "文章",
      path: "/posts/demo",
      keywords: ["文章词", "标签"],
      siteConfig: {
        SITE_KEYWORDS: "站点词",
      },
    });

    expect(metadata.keywords).toEqual(["文章词", "标签"]);
  });
});

describe("resolveSeoSiteInfo favicon URL", () => {
  it("uses SITE_DESCRIPTION before SUB_TITLE for SEO descriptions", () => {
    const site = resolveSeoSiteInfo({
      APP_NAME: "安和鱼",
      SUB_TITLE: "前台副标题",
      SITE_DESCRIPTION: "后台站点描述",
    });

    expect(site.description).toBe("后台站点描述");
  });

  it("preserves png favicon URLs and adds a cache-busting version", () => {
    const site = resolveSeoSiteInfo({
      ICON_URL: "https://blog.anheyu.com/api/f/ey9w6t/1782018466528632460.png",
    });

    expect(site.iconUrl).toBe("https://blog.anheyu.com/api/f/ey9w6t/1782018466528632460.png?v=1782018466528632460");
  });

  it("removes historical ArticleImage suffixes from favicon URLs", () => {
    const site = resolveSeoSiteInfo({
      ICON_URL: "/api/f/ey9w6t/1782018466528632460.png/ArticleImage",
    });

    expect(site.iconUrl).toBe("/api/f/ey9w6t/1782018466528632460.png?v=1782018466528632460");
  });
});

describe("getFaviconContentType", () => {
  it("detects icon MIME types after cache-busting query params are added", () => {
    expect(getFaviconContentType("/favicon.ico?v=custom")).toBe("image/x-icon");
    expect(getFaviconContentType("/logo.svg?v=custom")).toBe("image/svg+xml");
    expect(getFaviconContentType("/logo.png?v=custom")).toBe("image/png");
  });
});
