/*
 * @Description: 文章、标签、分类模块的所有类型定义
 * @Author: 安知鱼
 * @Date: 2025-07-23 11:07:00
 * @LastEditTime: 2025-08-28 13:52:15
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
  count: number;
  is_series: boolean;
}

export interface PostCategoryForm {
  name?: string;
  description?: string;
  is_series?: boolean;
}

export type PostCategoryResponse = PostCategory;
export type CategoryListResponse = PostCategoryResponse[];

/**
 * @description 用于上一篇、下一篇、相关文章等链接跳转的基础文章信息
 */
export interface ArticleLink {
  id: string;
  title: string;
  cover_url: string;
  abbrlink: string;
  created_at: string;
}

// ===================================
//          文章 (Article)
// ===================================

/**
 * @description 文章对象完整结构
 */
export interface Article {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  content_md?: string;
  content_html?: string;
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
  primary_color?: string;
  is_primary_color_manual: boolean;
  abbrlink?: string;
  copyright?: boolean;
  copyright_author?: string;
  copyright_author_href?: string;
  copyright_url?: string;
  keywords?: string;
  prev_article: ArticleLink | null;
  next_article: ArticleLink | null;
  related_articles: ArticleLink[];
}

/**
 * @description 获取文章列表的查询参数
 */
export interface GetArticleListParams {
  page?: number;
  pageSize?: number;
  query?: string;
  status?: ArticleStatus | "";
  category?: string;
  tag?: string;
  year?: number;
  month?: number;
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
  primary_color?: string;
  is_primary_color_manual?: boolean;
  abbrlink?: string;
  copyright?: boolean;
  copyright_author?: string;
  copyright_author_href?: string;
  copyright_url?: string;
  custom_published_at?: string;
  custom_updated_at?: string;
  keywords?: string;
}

export type ArticleResponse = Article;
export interface ArticleListResponse {
  list: Article[];
  total: number;
}

// ===================================
//         文章归档 (Post Archives)
// ===================================
/**
 * @description 单个归档项
 */
export interface ArchiveItem {
  year: number;
  month: number;
  count: number;
}

/**
 * @description 归档列表的响应体数据
 */
export interface ArchiveSummaryResponse {
  list: ArchiveItem[];
}

// 上传图片成功的响应体
export interface SuccessResponseUploadImage {
  code: number;
  message: string;
  data: {
    url: string;
  };
}

// ===================================
//         文章导入导出功能
// ===================================

/**
 * @description 导入文章选项
 */
export interface ImportArticleOptions {
  create_categories?: boolean; // 是否自动创建不存在的分类
  create_tags?: boolean; // 是否自动创建不存在的标签
  skip_existing?: boolean; // 是否跳过已存在的文章
  default_status?: string; // 默认文章状态
}

/**
 * @description 导入文章结果
 */
export interface ImportArticleResult {
  total_count: number;
  success_count: number;
  failed_count: number;
  skipped_count: number;
  created_ids: string[];
  error_messages: string[];
}
