/**
 * @description 创建新评论时，发送到后端的数据结构
 */
export interface CreateCommentPayload {
  article_id: string;
  parent_id?: string | null;
  nickname: string;
  email?: string;
  website?: string;
  content: string;
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
  content_html: string;
  is_admin_comment: boolean;
  ip_location: string;
  user_agent: string;
  article_id: string;
  parent_id: string | null;
  children: Comment[];
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
