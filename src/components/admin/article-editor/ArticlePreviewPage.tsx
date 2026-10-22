"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button, Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { PostDetailContent } from "@/components/post/PostDetailContent";
import { postManagementApi } from "@/lib/api/post-management";
import { useAuthStore } from "@/store/auth-store";
import type { Article } from "@/types/article";

export function ArticlePreviewPage({ articleId }: { articleId: string }) {
  useEffect(() => {
    const syncAuth = (event: StorageEvent) => {
      if (event.storageArea !== localStorage || (event.key !== "auth-storage" && event.key !== null)) return;
      if (!localStorage.getItem("auth-storage")) {
        useAuthStore.getState().logout();
      } else {
        void useAuthStore.persist.rehydrate();
      }
    };
    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  const hasAdminAccess = useAuthStore(state =>
    state._hasHydrated && !!state.accessToken && !!state.user && state.isAdmin()
  );
  const userId = useAuthStore(state => state.user?.id);
  const hasHydrated = useAuthStore(state => state._hasHydrated);
  const isLoggedIn = useAuthStore(state => !!state.accessToken && !!state.user);
  const { data: article, isPending, isError, isFetching, refetch } = useQuery({
    queryKey: ["post-management", "preview", articleId, userId],
    queryFn: () => postManagementApi.getArticleForEdit(articleId),
    enabled: hasAdminAccess && !!articleId,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  if (!hasHydrated) {
    return <div className="flex justify-center py-32"><Spinner label="正在验证登录状态" /></div>;
  }

  // 前台预览独立校验身份，禁止缓存或未完成的请求在身份失效后显示正文。
  if (!hasAdminAccess) {
    return (
      <div className="space-y-4 px-6 py-32 text-center">
        <p className="text-muted-foreground">仅管理员可预览文章</p>
        {!isLoggedIn && (
          <Button as={Link} role="link" href={`/login?redirect=${encodeURIComponent(`/posts/${encodeURIComponent(articleId)}/preview`)}`} color="primary">
            登录后预览
          </Button>
        )}
      </div>
    );
  }

  if (isPending || isFetching) {
    return <div className="flex justify-center py-32"><Spinner label="正在加载预览" /></div>;
  }

  if (isError || !article) {
    return (
      <div role="alert" className="mx-6 my-24 rounded-xl border border-border bg-card p-8 text-center">
        <p className="mb-4 text-muted-foreground">无法加载文章预览，请确认文章存在且你仍有管理员权限。</p>
        <Button onPress={() => void refetch()} isLoading={isFetching} variant="flat">重试</Button>
      </div>
    );
  }

  const previewArticle: Article = {
    ...article,
    title: article.title.trim() || "无标题文章",
    content_html: article.content_html || "",
    is_reprint: article.is_reprint ?? false,
    post_tags: article.post_tags || [],
    post_categories: article.post_categories || [],
    is_preview: true,
    show_reward_button: false,
    show_share_button: false,
    show_subscribe_button: false,
  };

  const previewNotice = (
    <aside aria-label="文章预览提示" className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4">
      <div>
        <h2 className="text-xl font-semibold">文章预览</h2>
        <p className="mt-1 text-sm text-muted-foreground">仅管理员可见 · 显示最近保存的内容</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button as={Link} role="link" href="/admin/post-management" variant="flat" size="sm">返回列表</Button>
        <Button as={Link} role="link" href={`/admin/post-management/${encodeURIComponent(articleId)}/edit`} color="primary" size="sm">编辑文章</Button>
      </div>
    </aside>
  );

  return <PostDetailContent article={previewArticle} previewNotice={previewNotice} />;
}
