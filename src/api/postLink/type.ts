/*
 * @Description: 友链相关类型定义
 * @Author: 安知鱼
 * @Date: 2025-08-18 16:10:00
 * @LastEditTime: 2025-08-19 16:32:02
 * @LastEditors: 安知鱼
 */

/** 通用响应结构 */
export interface BaseResponse<T> {
  code: number;
  message: string;
  data: T;
}

// --- 核心数据模型 ---

/** 友链标签 */
export interface LinkTag {
  id: number;
  name: string;
  color: string;
}

/** 友链分类 */
export interface LinkCategory {
  id: number;
  name: string;
  style: "card" | "list";
  description: string;
}

/** 友链状态 */
export type LinkStatus = "PENDING" | "APPROVED" | "REJECTED" | "INVALID"; // 根据文档，增加 INVALID 状态

/** 友链信息对象 (DTO) */
export interface LinkItem {
  id: number;
  name: string;
  url: string;
  logo: string;
  description: string;
  status: LinkStatus;
  siteshot: string;
  category: LinkCategory | null;
  tags: LinkTag[] | null;
}

// --- API 请求体类型 (Request Body) ---

/** 申请友链 */
export interface ApplyLinkRequest {
  name: string;
  url: string;
  logo?: string;
  description?: string;
}

/** [后台] 创建友链 */
export interface CreateLinkRequest {
  name: string;
  url: string;
  logo: string;
  description: string;
  siteshot: string;
  category_id: number;
  tag_ids: number[];
  status: LinkStatus;
}

/** [后台] 更新友链 */
export type UpdateLinkRequest = CreateLinkRequest;

/** [后台] 审核友链 */
export interface ReviewLinkRequest {
  status: "APPROVED" | "REJECTED";
  siteshot?: string;
}

/** [后台] 创建友链分类 */
export interface CreateCategoryRequest {
  name: string;
  style: "card" | "list";
  description?: string;
}

/** [后台] 更新友链分类 */
export type UpdateCategoryRequest = CreateCategoryRequest;

/** [后台] 创建友链标签 */
export interface CreateTagRequest {
  name: string;
  color?: string;
}

/** [后台] 更新友链标签 */
export type UpdateTagRequest = CreateTagRequest;

// --- API 请求参数类型 (Query Params) ---

/** 获取公开友链列表的查询参数 */
export interface GetPublicLinksParams {
  page?: number;
  pageSize?: number;
  category_id?: number;
}

/** [后台] 获取友链列表的查询参数 */
export interface GetAdminLinksParams {
  page?: number;
  pageSize?: number;
  name?: string;
  url?: string;
  description?: string;
  status?: LinkStatus;
}

/** 获取随机友链的查询参数 */
export interface GetRandomLinksParams {
  num?: number;
}

// --- API 响应数据类型 ---

/** 分页友链列表响应 */
export interface PublicLinkListResponse {
  list: LinkItem[];
  total: number;
  page: number;
  pageSize: number;
}
