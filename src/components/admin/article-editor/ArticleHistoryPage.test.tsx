import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ArticleHistoryPage } from "./ArticleHistoryPage";
import { postManagementApi } from "@/lib/api/post-management";
import { postManagementKeys } from "@/hooks/queries/use-post-management";
import type { ArticleDetailForEdit, ArticleHistoryDetail } from "@/types/post-management";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
vi.mock("@/lib/katex-render", () => ({ renderKatexInElement: async () => {} }));

const previous: ArticleDetailForEdit = {
  id: "article", title: "Before restore", abbrlink: "", status: "PUBLISHED",
  created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
  view_count: 0, word_count: 1, reading_time: 1, post_tags: [], post_categories: [],
  content_html: "<p>Old cached content</p>", content_md: "Old cached content",
};
const restored: ArticleDetailForEdit = { ...previous, title: "Restored", content_html: "<p>Recovered formula $x^2$</p>", content_md: "Recovered formula $x^2$" };
const version: ArticleHistoryDetail = {
  id: "history", article_id: "article", version: 1, title: restored.title,
  content_html: restored.content_html, content_md: restored.content_md,
  cover_url: "", top_img_url: "", primary_color: "", summaries: [], word_count: 1, keywords: "",
  editor_id: 1, editor_nickname: "Author", change_note: "", created_at: previous.created_at,
};
let client: QueryClient;
beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => { cleanup(); client?.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals(); navigation.push.mockReset(); });

function openHistory() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnMount: false }, mutations: { retry: false } } });
  client.setQueryData(postManagementKeys.editDetail("article"), previous);
  client.setQueryData(postManagementKeys.detail("article"), previous);
  client.setQueryData(postManagementKeys.list({}), { list: [previous], total: 1 });
  client.setQueryData(["article-history", "article"], { list: [version], total: 1, page: 1, page_size: 50 });
  client.setQueryData(["article-history-detail", "article", 1], version);
  vi.spyOn(postManagementApi, "restoreArticleHistory").mockResolvedValue(version);
  vi.spyOn(postManagementApi, "getArticleHistory").mockResolvedValue({ list: [version], total: 1, page: 1, page_size: 50 });
  vi.spyOn(postManagementApi, "getArticleForEdit").mockResolvedValue(restored);
  return render(<QueryClientProvider client={client}><ArticleHistoryPage articleId="article" /></QueryClientProvider>);
}

describe("article history restore", () => {
  it("does not navigate when the updated editor content cannot be fetched", async () => {
    vi.spyOn(postManagementApi, "updateArticle").mockResolvedValue(restored);
    openHistory();
    vi.mocked(postManagementApi.getArticleForEdit).mockRejectedValue(new Error("read failed"));
    fireEvent.click(screen.getByRole("button", { name: "恢复此记录" }));
    await waitFor(() => expect(postManagementApi.getArticleForEdit).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByRole("button", { name: "恢复此记录" })).not.toBeDisabled());
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it("replaces stale editor content before navigation and invalidates other article caches", async () => {
    vi.spyOn(postManagementApi, "updateArticle").mockResolvedValue(restored);
    openHistory();
    let contentAtNavigation: unknown;
    navigation.push.mockImplementation(() => { contentAtNavigation = client.getQueryData(postManagementKeys.editDetail("article")); });
    fireEvent.click(screen.getByRole("button", { name: "恢复此记录" }));
    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/admin/post-management/article/edit"));
    expect(contentAtNavigation).toMatchObject({ title: "Restored", content_html: "<p>Recovered formula $x^2$</p>" });
    expect(client.getQueryState(postManagementKeys.detail("article"))?.isInvalidated).toBe(true);
    expect(client.getQueryState(postManagementKeys.list({}))?.isInvalidated).toBe(true);
  });

  it("blocks repeated restore requests while saving, and stays on failure", async () => {
    let rejectSave!: (reason: Error) => void;
    vi.spyOn(postManagementApi, "updateArticle").mockImplementation(() => new Promise((_, reject) => { rejectSave = reject; }));
    openHistory();
    const button = screen.getByRole("button", { name: "恢复此记录" });
    fireEvent.click(button);
    await waitFor(() => expect(button).toBeDisabled());
    await act(async () => rejectSave(new Error("save failed")));
    await waitFor(() => expect(button).not.toBeDisabled());
    expect(navigation.push).not.toHaveBeenCalled();
    expect(client.getQueryData(postManagementKeys.editDetail("article"))).toMatchObject({ title: "Before restore" });
  });
});
