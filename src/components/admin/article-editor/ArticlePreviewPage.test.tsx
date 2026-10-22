import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ArticlePreviewPage } from "./ArticlePreviewPage";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";
import type { LoginUserInfoResponse } from "@/types/auth";
import type { ArticleDetailForEdit } from "@/types/post-management";

// 正文的多媒体增强需真实浏览器；此处只隔离该边界，保留权限、查询及 API 封装。
vi.mock("@/components/post/PostContent", () => ({
  PostContent: ({ content }: { content: string }) => <article dangerouslySetInnerHTML={{ __html: content }} />,
}));

const user: LoginUserInfoResponse = {
  id: "admin", username: "admin", nickname: "管理员", email: "admin@example.test", avatar: "",
  created_at: "2026-10-22", updated_at: "2026-10-22", lastLoginAt: null, userGroupID: 1,
  userGroup: { id: "group-1", name: "管理员", description: "" }, status: 1,
};
const draft: ArticleDetailForEdit = {
  id: "draft-id", title: "尚未发布的文章", abbrlink: "draft-slug", status: "DRAFT",
  created_at: "2026-10-22", updated_at: "2026-10-22", view_count: 0, word_count: 5, reading_time: 1,
  post_tags: [], post_categories: [], content_html: "<p>私有草稿正文</p>", content_md: "私有草稿正文",
};
let client: QueryClient;

beforeEach(() => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  useAuthStore.setState({ _hasHydrated: true, accessToken: "admin-token", user, roles: ["1"] });
  client = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnMount: false } } });
  vi.spyOn(apiClient, "get").mockResolvedValue({ code: 200, message: "success", data: draft });
});
afterEach(() => {
  cleanup();
  client.clear();
  useAuthStore.getState().logout();
  vi.restoreAllMocks();
});

function openPreview() {
  return render(<QueryClientProvider client={client}><ArticlePreviewPage articleId="draft-id" /></QueryClientProvider>);
}

describe("administrator article preview", () => {
  it("loads a saved draft through the management API and renders its title and content", async () => {
    openPreview();
    expect(await screen.findByRole("heading", { name: draft.title })).toBeInTheDocument();
    expect(screen.getByText("私有草稿正文")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: draft.title })).toBeInTheDocument();
    expect(document.querySelector('[class*="postSidebar"]')).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledWith("/api/articles/draft-id");
    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "编辑文章" })).toHaveAttribute("href", "/admin/post-management/draft-id/edit");
  });

  it("waits for login hydration before requesting the draft", async () => {
    useAuthStore.setState({ _hasHydrated: false });
    openPreview();
    expect(apiClient.get).not.toHaveBeenCalled();
    expect(screen.queryByText("私有草稿正文")).not.toBeInTheDocument();
    act(() => useAuthStore.setState({ _hasHydrated: true }));
    expect(await screen.findByText("私有草稿正文")).toBeInTheDocument();
  });

  it.each(["anonymous", "reader"])("does not request or render a draft for %s", identity => {
    useAuthStore.setState(identity === "anonymous"
      ? { accessToken: null, user: null, roles: [] }
      : { accessToken: "reader-token", user: { ...user, id: "reader", userGroupID: 2 }, roles: [] });
    openPreview();
    expect(apiClient.get).not.toHaveBeenCalled();
    expect(screen.queryByText("私有草稿正文")).not.toBeInTheDocument();
    expect(screen.getByText("仅管理员可预览文章")).toBeInTheDocument();
    if (identity === "anonymous") {
      expect(screen.getByRole("link", { name: "登录后预览" })).toHaveAttribute("href", "/login?redirect=%2Fposts%2Fdraft-id%2Fpreview");
    }
  });

  it.each(["token", "user"])("requires both token and user even when an admin role remains, missing %s", missing => {
    useAuthStore.setState(missing === "token" ? { accessToken: null } : { user: null });
    openPreview();
    expect(apiClient.get).not.toHaveBeenCalled();
    expect(screen.queryByText("私有草稿正文")).not.toBeInTheDocument();
  });

  it("hides the draft immediately after logout", async () => {
    openPreview();
    await screen.findByText("私有草稿正文");
    act(() => useAuthStore.getState().logout());
    expect(screen.queryByText("私有草稿正文")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: draft.title })).not.toBeInTheDocument();
  });

  it("hides the draft when the original admin tab logs out", async () => {
    openPreview();
    await screen.findByText("私有草稿正文");
    const loggedOut = JSON.stringify({ state: { accessToken: null, user: null, roles: [] }, version: 0 });
    localStorage.setItem("auth-storage", loggedOut);
    act(() => window.dispatchEvent(new StorageEvent("storage", {
      key: "auth-storage", newValue: loggedOut, storageArea: localStorage,
    })));
    await waitFor(() => expect(screen.queryByText("私有草稿正文")).not.toBeInTheDocument());
  });

  it("shows a recoverable error without leaking content on a rejected read", async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error("无权访问"));
    openPreview();
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("私有草稿正文")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "重试" }));
    expect(await screen.findByText("私有草稿正文")).toBeInTheDocument();
  });

  it("hides the draft when another tab clears its saved login", async () => {
    openPreview();
    await screen.findByText("私有草稿正文");
    localStorage.clear();
    act(() => window.dispatchEvent(new StorageEvent("storage", { key: null, storageArea: localStorage })));
    await waitFor(() => expect(screen.queryByText("私有草稿正文")).not.toBeInTheDocument());
  });

  it("fetches the latest saved draft on reopening, independently of the editor cache", async () => {
    const first = openPreview();
    await screen.findByText("私有草稿正文");
    first.unmount();
    vi.mocked(apiClient.get).mockResolvedValue({ code: 200, message: "success", data: { ...draft, content_html: "<p>最新保存的正文</p>" } });
    openPreview();
    expect(await screen.findByText("最新保存的正文")).toBeInTheDocument();
    expect(screen.queryByText("私有草稿正文")).not.toBeInTheDocument();
  });

  it("removes the preview query after the page closes", async () => {
    const view = openPreview();
    await screen.findByText("私有草稿正文");
    view.unmount();
    await waitFor(() => expect(client.getQueryCache().getAll()).toHaveLength(0));
  });

  it("does not fall back to a cached draft when revalidation rejects access", async () => {
    openPreview();
    await screen.findByText("私有草稿正文");
    vi.mocked(apiClient.get).mockRejectedValue(new Error("无权访问"));
    await act(async () => { await client.invalidateQueries({ queryKey: ["post-management", "preview"] }); });
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("私有草稿正文")).not.toBeInTheDocument();
  });

  it("never displays a late management response after logout", async () => {
    let resolveRead!: (value: { code: number; message: string; data: ArticleDetailForEdit }) => void;
    vi.mocked(apiClient.get).mockImplementationOnce(() => new Promise(resolve => { resolveRead = resolve; }));
    openPreview();
    act(() => useAuthStore.getState().logout());
    await act(async () => { resolveRead({ code: 200, message: "success", data: draft }); });
    expect(screen.queryByText("私有草稿正文")).not.toBeInTheDocument();
  });
});
