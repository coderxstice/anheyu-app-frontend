/**
 * @Description: 文章历史版本 API
 * @Author: 安知鱼
 * @Date: 2026-01-13
 */

import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";
import type {
  ArticleHistoryListResponse,
  ArticleHistory,
  ArticleHistoryCompareResponse,
  RestoreHistoryRequest,
  ArticleHistoryCountResponse
} from "./types";
import type { BaseResponse } from "@/api/post/type";

/**
 * 获取文章历史版本列表
 * @param articleId 文章公共ID
 * @param page 页码
 * @param pageSize 每页数量
 */
export const getArticleHistory = (
  articleId: string,
  page = 1,
  pageSize = 20
): Promise<BaseResponse<ArticleHistoryListResponse>> => {
  return http.request<BaseResponse<ArticleHistoryListResponse>>(
    "get",
    baseUrlApi(`articles/${articleId}/history`),
    { params: { page, pageSize } }
  );
};

/**
 * 获取指定历史版本详情
 * @param articleId 文章公共ID
 * @param version 版本号
 */
export const getHistoryVersion = (
  articleId: string,
  version: number
): Promise<BaseResponse<ArticleHistory>> => {
  return http.request<BaseResponse<ArticleHistory>>(
    "get",
    baseUrlApi(`articles/${articleId}/history/${version}`)
  );
};

/**
 * 对比两个历史版本
 * @param articleId 文章公共ID
 * @param v1 版本1
 * @param v2 版本2
 */
export const compareHistoryVersions = (
  articleId: string,
  v1: number,
  v2: number
): Promise<BaseResponse<ArticleHistoryCompareResponse>> => {
  return http.request<BaseResponse<ArticleHistoryCompareResponse>>(
    "get",
    baseUrlApi(`articles/${articleId}/history/compare`),
    { params: { v1, v2 } }
  );
};

/**
 * 恢复到指定历史版本
 * @param articleId 文章公共ID
 * @param version 版本号
 * @param data 恢复请求参数
 */
export const restoreHistoryVersion = (
  articleId: string,
  version: number,
  data?: RestoreHistoryRequest
): Promise<BaseResponse<ArticleHistory>> => {
  return http.request<BaseResponse<ArticleHistory>>(
    "post",
    baseUrlApi(`articles/${articleId}/history/${version}/restore`),
    { data }
  );
};

/**
 * 获取文章历史版本数量
 * @param articleId 文章公共ID
 */
export const getHistoryCount = (
  articleId: string
): Promise<BaseResponse<ArticleHistoryCountResponse>> => {
  return http.request<BaseResponse<ArticleHistoryCountResponse>>(
    "get",
    baseUrlApi(`articles/${articleId}/history/count`)
  );
};
