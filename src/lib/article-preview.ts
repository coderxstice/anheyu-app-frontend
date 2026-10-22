import type { AdminArticle } from "@/types/post-management";

type PreviewArticle = Pick<AdminArticle, "id" | "abbrlink" | "status" | "review_status" | "is_takedown">;

export function getArticlePreviewUrl(article: PreviewArticle): string {
  const isPublic = article.status === "PUBLISHED" && !article.is_takedown &&
    (!article.review_status || article.review_status === "NONE" || article.review_status === "APPROVED");

  return isPublic
    ? `/posts/${encodeURIComponent(article.abbrlink || article.id)}`
    : `/posts/${encodeURIComponent(article.id)}/preview`;
}
