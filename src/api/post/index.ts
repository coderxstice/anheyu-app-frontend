/*
 * @Description: 文章管理模块 API 统一出口 (文章、标签、分类)
 * @Author: 安知鱼
 * @Date: 2025-07-25 18:05:00
 * @LastEditTime: 2025-08-04 15:04:53
 * @LastEditors: 安知鱼
 */

import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";
import type {
  // 通用
  BaseResponse,
  // 文章
  ArticleListResponse,
  ArticleResponse,
  GetArticleListParams,
  ArticleForm,
  Article,
  // 标签
  TagListResponse,
  PostTagResponse,
  PostTagForm,
  // 分类
  CategoryListResponse,
  PostCategoryResponse,
  PostCategoryForm
} from "./type";

// ===================================
//          文章 (Article)
// ===================================

/** @description 获取文章列表 */
export const getArticleList = (
  params: GetArticleListParams
): Promise<BaseResponse<ArticleListResponse>> => {
  return http.request<BaseResponse<ArticleListResponse>>(
    "get",
    baseUrlApi("articles"),
    { params }
  );
};

/** @description 获取单篇文章 */
export const getArticle = (
  id: string
): Promise<BaseResponse<ArticleResponse>> => {
  return http.request<BaseResponse<ArticleResponse>>(
    "get",
    baseUrlApi(`articles/${id}`)
  );
};

/** @description 创建新文章 */
export const createArticle = (
  data: ArticleForm
): Promise<BaseResponse<ArticleResponse>> => {
  return http.request<BaseResponse<ArticleResponse>>(
    "post",
    baseUrlApi("articles"),
    { data }
  );
};

/** @description 更新文章 */
export const updateArticle = (
  id: string,
  data: ArticleForm
): Promise<BaseResponse<ArticleResponse>> => {
  return http.request<BaseResponse<ArticleResponse>>(
    "put",
    baseUrlApi(`articles/${id}`),
    { data }
  );
};

/** @description 删除文章 (软删除) */
export const deleteArticle = (id: string): Promise<BaseResponse<null>> => {
  return http.request<BaseResponse<null>>(
    "delete",
    baseUrlApi(`articles/${id}`)
  );
};

// ===================================
//          文章标签 (PostTag)
// ===================================

/** @description 获取标签列表 */
export const getTagList = (): Promise<BaseResponse<TagListResponse>> => {
  return http.request<BaseResponse<TagListResponse>>(
    "get",
    baseUrlApi("post-tags")
  );
};

/** @description 创建新标签 */
export const createTag = (
  data: PostTagForm
): Promise<BaseResponse<PostTagResponse>> => {
  return http.request<BaseResponse<PostTagResponse>>(
    "post",
    baseUrlApi("post-tags"),
    { data }
  );
};

/** @description 更新标签 */
export const updateTag = (
  id: string,
  data: PostTagForm
): Promise<BaseResponse<PostTagResponse>> => {
  return http.request<BaseResponse<PostTagResponse>>(
    "put",
    baseUrlApi(`post-tags/${id}`),
    { data }
  );
};

/** @description 删除标签 */
export const deleteTag = (id: string): Promise<BaseResponse<null>> => {
  return http.request<BaseResponse<null>>(
    "delete",
    baseUrlApi(`post-tags/${id}`)
  );
};

// ===================================
//          文章分类 (PostCategory)
// ===================================

/** @description 获取分类列表 */
export const getCategoryList = (): Promise<
  BaseResponse<CategoryListResponse>
> => {
  return http.request<BaseResponse<CategoryListResponse>>(
    "get",
    baseUrlApi("post-categories")
  );
};

/** @description 创建新分类 */
export const createCategory = (
  data: PostCategoryForm
): Promise<BaseResponse<PostCategoryResponse>> => {
  return http.request<BaseResponse<PostCategoryResponse>>(
    "post",
    baseUrlApi("post-categories"),
    { data }
  );
};

/** @description 更新分类 */
export const updateCategory = (
  id: string,
  data: PostCategoryForm
): Promise<BaseResponse<PostCategoryResponse>> => {
  return http.request<BaseResponse<PostCategoryResponse>>(
    "put",
    baseUrlApi(`post-categories/${id}`),
    { data }
  );
};

/** @description 删除分类 */
export const deleteCategory = (id: string): Promise<BaseResponse<null>> => {
  return http.request<BaseResponse<null>>(
    "delete",
    baseUrlApi(`post-categories/${id}`)
  );
};

/** @description [公开]获取首页推荐文章 */
export const getHomeArticles = (): Promise<BaseResponse<Article[]>> => {
  return http.request<BaseResponse<Article[]>>(
    "get",
    baseUrlApi("public/articles/home")
  );
};

/** @description [公开]获取一篇随机文章 */
export const getRandomArticle = (): Promise<BaseResponse<ArticleResponse>> => {
  return http.request<BaseResponse<ArticleResponse>>(
    "get",
    baseUrlApi("public/articles/random")
  );
};

/** @description [公开]获取文章列表 */
export const getPublicArticles = (
  params: GetArticleListParams
): Promise<BaseResponse<ArticleListResponse>> => {
  return http.request<BaseResponse<ArticleListResponse>>(
    "get",
    baseUrlApi("public/articles"),
    { params }
  );
};
