/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-10 22:21:49
 * @LastEditTime: 2025-08-12 19:17:52
 * @LastEditors: 安知鱼
 */
import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";
import type { BaseResponse } from "@/api/post/type";
import type {
  CreateCommentPayload,
  Comment,
  CommentListResponse,
  AdminComment,
  CommentQuery,
  SuccessResponseUploadImage
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

/**
 * @description: 为评论上传图片 (适配新流程)
 * @param {File} file 图片文件
 * @returns {Promise<SuccessResponseUploadImage>} 返回包含文件公共ID的响应
 */
export const uploadCommentImage = (file: File) => {
  const formData = new FormData();
  // 根据接口文档，字段名必须是 'file'
  formData.append("file", file);

  return http.request<SuccessResponseUploadImage>(
    "post",
    baseUrlApi("public/comments/upload"),
    {
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  );
};

/**
 * @description: [管理员] 查询评论列表
 */
export const getAdminComments = (params: CommentQuery) => {
  return http.request<BaseResponse<{ list: AdminComment[]; total: number }>>(
    "get",
    baseUrlApi("comments"),
    { params }
  );
};

/**
 * @description: [管理员] 置顶/取消置顶评论
 */
export const pinAdminComment = (id: string, pinned: boolean) => {
  return http.request<BaseResponse<AdminComment>>(
    "put",
    baseUrlApi(`comments/${id}/pin`),
    {
      data: { pinned }
    }
  );
};

/**
 * @description: [管理员] 更新评论状态
 */
export const updateAdminCommentStatus = (id: string, status: number) => {
  return http.request<BaseResponse<AdminComment>>(
    "put",
    baseUrlApi(`comments/${id}/status`),
    {
      data: { status }
    }
  );
};

/**
 * @description: [管理员] 批量删除评论
 */
export const deleteAdminComments = (ids: string[]) => {
  return http.request<BaseResponse<number>>("delete", baseUrlApi("comments"), {
    data: { ids }
  });
};
