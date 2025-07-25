/*
 * @Description: 文章、标签、分类模块的所有类型定义 (最终版)
 * @Author: 安知鱼
 * @Date: 2025-07-23 11:07:00
 * @LastEditTime: 2025-07-25 16:25:14
 * @LastEditors: 安知鱼
 */

// ===================================
//         通用 & 基础类型
// ===================================

export interface BaseResponse<T> {
  code: number;
  message: string;
  data: T;
}

export type ArticleStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

// ===================================
//          文章标签 (PostTag)
// ===================================

export interface PostTag {
  id: string; // 统一为 id
  created_at: string;
  updated_at: string;
  name: string;
}

export interface PostTagForm {
  name?: string;
}

export type PostTagResponse = PostTag;
export type TagListResponse = PostTagResponse[];

// ===================================
//          文章分类 (PostCategory)
// ===================================

export interface PostCategory {
  id: string; // 统一为 id
  created_at: string;
  updated_at: string;
  name: string;
  description: string;
}

export interface PostCategoryForm {
  name?: string;
  description?: string;
}

export type PostCategoryResponse = PostCategory;
export type CategoryListResponse = PostCategoryResponse[];

// ===================================
//          文章 (Article)
// ===================================

export interface Article {
  id: string; // 统一为 id
  created_at: string;
  updated_at: string;
  title: string;
  content_md?: string;
  summary: string; // [RE-ADDED]
  cover_url: string; // [RE-ADDED]
  status: ArticleStatus;
  view_count: number; // [ADDED]
  word_count: number; // [ADDED]
  reading_time: number; // [ADDED]
  ip_location?: string;
  post_tags: PostTag[];
  post_categories: PostCategory[];
}

export interface GetArticleListParams {
  page?: number;
  pageSize?: number;
  query?: string;
  status?: ArticleStatus | "";
}

export interface ArticleForm {
  title?: string;
  content_md?: string;
  summary?: string; // [RE-ADDED]
  cover_url?: string; // [RE-ADDED]
  status?: ArticleStatus;
  post_tag_ids?: string[];
  post_category_ids?: string[];
  ip_location?: string;
}

export type ArticleResponse = Article;
export interface ArticleListResponse {
  list: Article[];
  total: number;
}
