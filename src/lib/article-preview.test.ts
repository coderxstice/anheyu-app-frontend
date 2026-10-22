import { describe, expect, it } from "vitest";
import { getArticlePreviewUrl } from "./article-preview";
import type { AdminArticle } from "@/types/post-management";

const article: Pick<AdminArticle, "id" | "abbrlink" | "status" | "review_status" | "is_takedown"> = {
  id: "draft-id", abbrlink: "custom-slug", status: "DRAFT", review_status: "NONE",
};

describe("article preview navigation", () => {
  it.each(["DRAFT", "SCHEDULED", "ARCHIVED"] as const)("uses the private ID route for %s", status => {
    expect(getArticlePreviewUrl({ ...article, status })).toBe("/posts/draft-id/preview");
  });

  it.each(["PENDING", "REJECTED"] as const)("keeps %s articles out of the public page", review_status => {
    expect(getArticlePreviewUrl({ ...article, status: "PUBLISHED", review_status })).toBe("/posts/draft-id/preview");
  });

  it("uses the private route for a taken down published article", () => {
    expect(getArticlePreviewUrl({ ...article, status: "PUBLISHED", is_takedown: true })).toBe("/posts/draft-id/preview");
  });

  it.each(["NONE", "APPROVED", undefined] as const)("preserves the public slug for review status %s", review_status => {
    expect(getArticlePreviewUrl({ ...article, status: "PUBLISHED", review_status })).toBe("/posts/custom-slug");
  });

  it("falls back to the public ID without a slug", () => {
    expect(getArticlePreviewUrl({ ...article, status: "PUBLISHED", abbrlink: "" })).toBe("/posts/draft-id");
  });
});
