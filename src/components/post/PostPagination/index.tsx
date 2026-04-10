/**
 * 文章上下篇导航组件
 * 参考 anheyu-app 实现
 */
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toSameOriginMediaUrl } from "@/utils/same-origin-media-url";
import type { ArticleLink } from "@/types/article";
import styles from "./PostPagination.module.css";

interface PostPaginationProps {
  prevArticle?: ArticleLink | null;
  nextArticle?: ArticleLink | null;
  /** 无封面或封面加载失败时使用，建议传入 resolvePostDefaultCoverUrl 的结果 */
  defaultCover?: string;
}

function getArticleHref(link: ArticleLink): string {
  if (link.is_doc) {
    return `/doc/${link.id}`;
  }
  return `/posts/${link.abbrlink || link.id}`;
}

/**
 * 解析上下篇导航封面地址：无有效封面时用默认图，否则做本站媒体同源压缩。
 */
function resolvePaginationCoverSrc(coverUrl: string | undefined, defaultCover: string): string {
  const trimmed = coverUrl?.trim();
  if (!trimmed) {
    return defaultCover;
  }
  return toSameOriginMediaUrl(trimmed);
}

interface PaginationNavCoverImageProps {
  coverUrl?: string;
  defaultCover: string;
  alt: string;
}

/**
 * 上下篇导航缩略图：空封面用默认图，加载失败时回退到默认图。
 */
function PaginationNavCoverImage({ coverUrl, defaultCover, alt }: PaginationNavCoverImageProps) {
  const [loadFailed, setLoadFailed] = useState(false);

  const src = useMemo(() => {
    if (loadFailed) {
      return defaultCover;
    }
    return resolvePaginationCoverSrc(coverUrl, defaultCover);
  }, [coverUrl, defaultCover, loadFailed]);

  return (
    <Image
      src={src}
      alt={alt}
      width={64}
      height={64}
      className={styles.paginationCoverImage}
      onError={() => setLoadFailed(true)}
    />
  );
}

export function PostPagination({
  prevArticle,
  nextArticle,
  defaultCover = "/images/default-cover.webp",
}: PostPaginationProps) {
  if (!prevArticle && !nextArticle) {
    return null;
  }

  return (
    <nav className={styles.paginationPost}>
      {prevArticle && (
        <Link href={getArticleHref(prevArticle)} className={`${styles.paginationItem} ${styles.left}`}>
          <div className={styles.paginationCover}>
            <PaginationNavCoverImage
              coverUrl={prevArticle.cover_url}
              defaultCover={defaultCover}
              alt=""
            />
          </div>
          <div className={styles.paginationInfo}>
            <div className={styles.label}>上一篇</div>
            <div className={styles.infoTitle}>{prevArticle.title}</div>
          </div>
        </Link>
      )}

      {nextArticle && (
        <Link href={getArticleHref(nextArticle)} className={`${styles.paginationItem} ${styles.right}`}>
          <div className={styles.paginationCover}>
            <PaginationNavCoverImage
              coverUrl={nextArticle.cover_url}
              defaultCover={defaultCover}
              alt=""
            />
          </div>
          <div className={styles.paginationInfo}>
            <div className={styles.label}>下一篇</div>
            <div className={styles.infoTitle}>{nextArticle.title}</div>
          </div>
        </Link>
      )}
    </nav>
  );
}

export default PostPagination;
