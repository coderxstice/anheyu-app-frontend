/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-10 22:21:27
 * @LastEditTime: 2025-08-12 19:16:13
 * @LastEditors: 安知鱼
 */
/**
 * @description 创建新评论时，发送到后端的数据结构
 */
export interface CreateCommentPayload {
  article_id: string;
  parent_id?: string | null;
  nickname: string;
  email?: string;
  website?: string;
  content: string; // 内容现在可能包含 anzhiyu://file/{ID} 格式的图片URI
  allow_notification?: boolean;
}

/**
 * @description 评论数据对象 (用于API响应和前端渲染)
 */
export interface Comment {
  id: string;
  created_at: string;
  nickname: string;
  email_md5: string;
  website: string | null;
  content_html: string; // 后端已将内部URI渲染为带签名的临时URL
  is_admin_comment: boolean;
  ip_location: string;
  user_agent: string;
  article_id: string;
  parent_id: string | null;
  children: Comment[];
  reply_to_nick: string | null;
  like_count: number;
}

/**
 * @description 获取评论列表接口的响应体中 data 字段的类型
 */
export interface CommentListResponse {
  list: Comment[];
  total: number;
  page: number;
  pageSize: number;
}

// --- 后台管理相关类型 (保持不变) ---
export interface AdminComment extends Comment {
  email: string;
  ip_address: string;
  content: string;
  status: number;
  article_slug: string;
  pinned_at: string | null;
}

export interface CommentQuery {
  page?: number;
  pageSize?: number;
  nickname?: string;
  email?: string;
  website?: string;
  ip_address?: string;
  content?: string;
  article_slug?: string;
  status?: number;
}

/**
 * @description 上传图片成功后，响应体中 data 字段的类型
 */
export interface UploadImageResponseData {
  id: string; // 只包含文件的公共ID
}

/**
 * @description 图片上传接口的成功响应体
 */
export interface SuccessResponseUploadImage {
  code: number;
  message: string;
  data: UploadImageResponseData;
}
