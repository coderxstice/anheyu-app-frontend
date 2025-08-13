/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-19 01:17:38
 * @LastEditTime: 2025-08-13 10:23:49
 * @LastEditors: 安知鱼
 */

import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";
import type { BaseResponse } from "./post/type";

export type SiteConfig = {
  APP_NAME: string;
  APP_VERSION: string;
  ICP_NUMBER: string;
  USER_AVATAR: string;
  ABOUT_LINK: string;
  API_URL: string;
  SiteURL: string;
  ICON_URL: string;
  LOGO_HORIZONTAL_DAY: string;
  LOGO_HORIZONTAL_NIGHT: string;
  LOGO_URL: string;
  LOGO_URL_192x192: string;
  LOGO_URL_512x512: string;
  DEFAULT_THUMB_PARAM: string;
  DEFAULT_BIG_PARAM: string;
  KeySiteAnnouncement: string;
};

export type SiteConfigResult = {
  code: number;
  message: string;
  data: SiteConfig;
};

/** 获取站点配置 */
export const getSiteConfigApi = () => {
  return http.request<SiteConfigResult>(
    "get",
    baseUrlApi("public/site-config")
  );
};

/**
 * @description 发送测试邮件
 * @param to_email 接收测试邮件的目标邮箱地址
 */
export const sendTestEmail = (
  to_email: string
): Promise<BaseResponse<null>> => {
  return http.request<BaseResponse<null>>(
    "post",
    baseUrlApi("settings/test-email"),
    {
      data: { to_email }
    }
  );
};
