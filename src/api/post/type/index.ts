/*
 * @Description: 文章、标签、分类模块的所有类型定义
 * @Author: 安知鱼
 * @Date: 2025-07-23 11:07:00
 * @LastEditTime: 2025-08-06 17:01:52
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
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  count: number;
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
  id: string;
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

/**
 * @description 文章对象完整结构 (与后端最新接口一致)
 */
export interface Article {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  content_md?: string;
  cover_url: string;
  status: ArticleStatus;
  view_count: number;
  word_count: number;
  reading_time: number;
  ip_location?: string;
  post_tags: PostTag[];
  post_categories: PostCategory[];
  home_sort: number;
  pin_sort: number;
  top_img_url: string;
  summaries: string[];
}

/**
 * @description 获取文章列表的查询参数
 */
export interface GetArticleListParams {
  page?: number;
  pageSize?: number;
  query?: string; // 只搜索标题
  status?: ArticleStatus | "";
  category?: string;
  tag?: string;
}

/**

 * @description 创建/更新文章时发送的表单数据类型
 */
export interface ArticleForm {
  title?: string;
  content_md?: string;
  cover_url?: string;
  status?: ArticleStatus;
  post_tag_ids?: string[];
  post_category_ids?: string[];
  ip_location?: string;
  home_sort?: number;
  pin_sort?: number;
  top_img_url?: string;
  summaries?: string[];
}

export type ArticleResponse = Article;
export interface ArticleListResponse {
  list: Article[];
  total: number;
}
