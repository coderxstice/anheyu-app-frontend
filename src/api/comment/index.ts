/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-10 22:21:49
 * @LastEditTime: 2025-08-11 18:15:10
 * @LastEditors: 安知鱼
 */
import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";
import type { BaseResponse } from "@/api/post/type";
import type {
  CreateCommentPayload,
  Comment,
  CommentListResponse
} from "./type";

/**
 * @description 获取指定文章的评论列表
 * @param params 包含 articleId, page, pageSize 的参数对象
 * @returns 分页后的评论数据
 */
export const getPublicComments = (params: {
  article_id: string;
  page?: number;
  pageSize?: number;
}): Promise<BaseResponse<CommentListResponse>> => {
  return http.request<BaseResponse<CommentListResponse>>(
    "get",
    baseUrlApi("public/comments"),
    { params }
  );
};

/**
 * @description 创建一条新评论或回复
 * @param data 评论表单数据
 * @returns 新创建的评论对象
 */
export const createPublicComment = (
  data: CreateCommentPayload
): Promise<BaseResponse<Comment>> => {
  return http.request<BaseResponse<Comment>>(
    "post",
    baseUrlApi("public/comments"),
    {
      data
    }
  );
};

/**
 * @description: 为指定ID的评论点赞
 * @param {string} id 评论的公共ID
 * @returns {Promise<any>} 返回最新的总点赞数
 */
export const likePublicComment = (id: string) => {
  return http.request<any>("post", baseUrlApi(`public/comments/${id}/like`));
};

/**
 * @description: 为指定ID的评论取消点赞
 * @param {string} id 评论的公共ID
 * @returns {Promise<any>} 返回最新的总点赞数
 */
export const unlikePublicComment = (id: string) => {
  return http.request<any>("post", baseUrlApi(`public/comments/${id}/unlike`));
};
