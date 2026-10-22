import type { Metadata, Viewport } from "next";
import { ArticlePreviewPage } from "@/components/admin/article-editor/ArticlePreviewPage";

export const metadata: Metadata = {
  title: "文章预览",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f9fe" },
    { media: "(prefers-color-scheme: dark)", color: "#18171d" },
  ],
};

export default async function ArticlePreviewRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ArticlePreviewPage articleId={id} />;
}
