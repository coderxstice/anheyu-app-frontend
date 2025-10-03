/**
 * @Description: 用户中心相关 API
 * @Author: 安知鱼
 * @Date: 2025-10-03
 */

import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";

/**
 * @description 更新用户信息的请求参数
 */
export type UpdateUserProfileRequest = {
  nickname?: string;
  website?: string;
};

/**
 * @description 修改密码的请求参数
 */
export type UpdatePasswordRequest = {
  oldPassword: string;
  newPassword: string;
};

/**
 * @description 通用响应类型
 */
export type CommonResponse = {
  code: number;
  message: string;
  data?: any;
};

/**
 * 更新用户信息（昵称、网站等）
 * TODO: 等待后端实现 PUT /user/profile 或 PATCH /user/profile 接口
 */
export const updateUserProfile = (data: UpdateUserProfileRequest) => {
  return http.request<CommonResponse>(
    "put",
    baseUrlApi("user/profile"), // 或使用 "patch"
    { data }
  );
};

/**
 * 修改用户密码
 * 对接后端接口：POST /user/update-password
 */
export const updateUserPassword = (data: UpdatePasswordRequest) => {
  return http.request<CommonResponse>(
    "post",
    baseUrlApi("user/update-password"),
    { data }
  );
};
