/**
 * @Description: 文章历史版本相关类型定义
 * @Author: 安知鱼
 * @Date: 2026-01-13
 */

// 历史版本列表项
export interface ArticleHistoryListItem {
  id: string;
  version: number;
  title: string;
  word_count: number;
  editor_nickname: string;
  change_note: string;
  created_at: string;
}

// 历史版本列表响应
export interface ArticleHistoryListResponse {
  list: ArticleHistoryListItem[];
  total: number;
  page: number;
  page_size: number;
}

// 历史版本详情
export interface ArticleHistory {
  id: string;
  article_id: string;
  version: number;
  title: string;
  content_md: string;
  content_html: string;
  cover_url: string;
  top_img_url: string;
  primary_color: string;
  summaries: string[];
  word_count: number;
  keywords: string;
  editor_id: number;
  editor_nickname: string;
  change_note: string;
  created_at: string;
  extra_data?: Record<string, unknown>;
}

// 版本对比响应
export interface ArticleHistoryCompareResponse {
  old_version: ArticleHistory;
  new_version: ArticleHistory;
}

// 恢复版本请求
export interface RestoreHistoryRequest {
  change_note?: string;
}

// 历史版本数量响应
export interface ArticleHistoryCountResponse {
  count: number;
}
