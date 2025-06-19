/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-11 11:59:32
 * @LastEditTime: 2025-06-19 01:39:23
 * @LastEditors: 安知鱼
 */
// src/api/user.ts
import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";

export type UserResult = {
  code: number;
  data: {
    /** 头像 */
    avatar: string;
    /** 用户名 */
    username: string;
    /** 昵称 */
    nickname: string;
    /** 当前登录用户的角色 */
    roles: Array<string>;
    /** 按钮级别权限 */
    // permissions: Array<string>;
    /** `token` */
    accessToken: string;
    /** 用于调用刷新`accessToken`的接口时所需的`token` */
    refreshToken: string;
    /** `accessToken`的过期时间（格式'xxxx/xx/xx xx:xx:xx'） */
    expires: Date;
  };
  message: string;
};

export type RefreshTokenResult = {
  code: number;
  data: {
    /** `token` */
    accessToken: string;
    /** 用于调用刷新`accessToken`的接口时所需的`token` */
    refreshToken: string;
    /** `accessToken`的过期时间（格式'xxxx/xx/xx xx:xx:xx'） */
    expires: Date;
  };
};

export type RegisterUserResult = {
  code: number;
  data: {
    activation_required: boolean;
  };
  message?: string;
};

export type CheckEmailExistsResult = {
  code: number;
  data: {
    exists: boolean;
  };
  message?: string;
};

/** 登录 */
export const getLogin = (data?: object) => {
  return http.request<UserResult>("post", baseUrlApi("auth/login"), { data });
};

/** 刷新`token` */
export const refreshTokenApi = (data?: object) => {
  return http.request<RefreshTokenResult>(
    "post",
    baseUrlApi("auth/refresh-token"),
    { data }
  );
};

/** 检查邮箱是否存在 */
export const checkEmailExistsApi = (email: string) => {
  return http.request<CheckEmailExistsResult>(
    "get",
    baseUrlApi("auth/check-email"),
    {
      params: { email }
    }
  );
};

/** 注册用户 */
export const registerUserApi = (data: {
  email: string;
  password: string;
  repeat_password: string;
}) => {
  return http.request<RegisterUserResult>("post", baseUrlApi("auth/register"), {
    data
  });
};
