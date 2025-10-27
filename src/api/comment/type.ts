/*
 * @Description: 评论模块相关的 TypeScript 类型定义
 * @Author: 安知鱼
 * @Date: 2025-08-10 22:21:27
 * @LastEditTime: 2025-08-19 13:43:37
 * @LastEditors: 安知鱼
 */

/**
 * @description 创建新评论时，发送到后端的数据结构
 */
export interface CreateCommentPayload {
  target_path: string;
  target_title?: string;
  parent_id?: string | null;
  reply_to_id?: string | null; // 回复目标评论的ID，用于构建对话链
  nickname: string;
  email?: string;
  website?: string;
  content: string; // 内容现在可能包含 anzhiyu://file/{ID} 格式的图片URI
  is_anonymous?: boolean; // 是否为匿名评论（前端明确标识）
}

/**
 * @description 评论数据对象 (用于API响应和前端渲染) (V2)
 */

export interface Comment {
  id: string;
  created_at: string;
  pinned_at: string | null;
  nickname: string;
  email_md5: string;
  website: string | null;
  content_html: string;
  is_admin_comment: boolean;
  is_anonymous: boolean;
  ip_location: string;
  target_path: string;
  target_title: string;
  parent_id: string | null;
  user_agent: string;
  children: Comment[];
  reply_to_id: string | null;
  reply_to_nick: string | null;
  like_count: number;
  total_children: number;
  // 前端排序扩展字段
  _hasReplies?: boolean;
  _repliesCount?: number;
  _replies?: Comment[];
}

/**
 * @description 获取评论列表接口的响应体中 data 字段的类型
 */
export interface CommentListResponse {
  list: Comment[];
  total: number; // 根评论总数（用于分页）
  total_with_children: number; // 包含所有子评论的总数（用于显示）
  page: number;
  pageSize: number;
}

// --- 后台管理相关类型 ---
/**
 * @description 管理员评论对象 (V2)
 */
export interface AdminComment extends Comment {
  email: string;
  ip_address: string;
  content: string;
  status: number;
}

/**
 * @description 管理员评论查询参数 (V2)
 */
export interface CommentQuery {
  page?: number;
  pageSize?: number;
  nickname?: string;
  email?: string;
  ip_address?: string;
  content?: string;
  target_path?: string;
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
