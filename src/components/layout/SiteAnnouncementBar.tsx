"use client";

import { useMemo } from "react";
import { useSiteConfigStore } from "@/store/site-config-store";
import { cn } from "@/lib/utils";
import styles from "./SiteAnnouncementBar.module.css";

/**
 * 站点公告：展示管理员在「基本信息」中配置的 HTML（与邮件模板同为可信后台内容）。
 */
export function SiteAnnouncementBar({ className }: { className?: string }) {
  const siteConfig = useSiteConfigStore(state => state.siteConfig);
  const isLoaded = useSiteConfigStore(state => state.isLoaded);

  const html = useMemo(() => {
    const raw = siteConfig?.SITE_ANNOUNCEMENT;
    if (typeof raw !== "string") return "";
    return raw.trim();
  }, [siteConfig?.SITE_ANNOUNCEMENT]);

  if (!isLoaded || !html) return null;

  return (
    <div className={cn(styles.wrapper, className)} role="region" aria-label="站点公告">
      <div className={styles.inner} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
