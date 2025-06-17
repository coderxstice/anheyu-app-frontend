/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-11 11:59:32
 * @LastEditTime: 2025-06-17 21:28:01
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

export type SiteConfig = {
  APP_NAME: string;
  APP_VERSION: string;
  ICP_NUMBER: string;
  USER_AVATAR: string;
  ABOUT_LINK: string;
  API_URL: string;
  LOGO_URL: string;
  ICON_URL: string;
  LOGO_HORIZONTAL_DAY: string;
  LOGO_HORIZONTAL_NIGHT: string;
  LOGO_URL_192x192: string;
  LOGO_URL_512x512: string;
  DEFAULT_THUMB_PARAM: string;
  DEFAULT_BIG_PARAM: string;
};

export type SiteConfigResult = {
  code: number; // 后端返回的code，这里约定为0表示成功
  msg: string;
  data: SiteConfig;
};

export type RegisterUserResult = {
  code: number;
  data: object;
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
  return http.request<UserResult>("post", baseUrlApi("user/login"), { data });
};

/** 刷新`token` */
export const refreshTokenApi = (data?: object) => {
  return http.request<RefreshTokenResult>(
    "post",
    baseUrlApi("user/refresh-token"),
    { data }
  );
};

/** 获取站点配置 */
export const getSiteConfigApi = () => {
  return http.request<SiteConfigResult>(
    "get",
    baseUrlApi("public/site-config")
  );
};

/** 检查邮箱是否存在 */
export const checkEmailExistsApi = (email: string) => {
  return http.request<CheckEmailExistsResult>(
    "get",
    baseUrlApi("user/check-email"),
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
  return http.request<RegisterUserResult>("post", baseUrlApi("user/register"), {
    data
  });
};
