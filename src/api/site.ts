/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-19 01:17:38
 * @LastEditTime: 2025-06-21 23:29:42
 * @LastEditors: 安知鱼
 */

import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";

export type SiteConfig = {
  APP_NAME: string;
  APP_VERSION: string;
  ICP_NUMBER: string;
  USER_AVATAR: string;
  ABOUT_LINK: string;
  API_URL: string;
  ICON_URL: string;
  LOGO_HORIZONTAL_DAY: string;
  LOGO_HORIZONTAL_NIGHT: string;
  LOGO_URL: string;
  LOGO_URL_192x192: string;
  LOGO_URL_512x512: string;
  DEFAULT_THUMB_PARAM: string;
  DEFAULT_BIG_PARAM: string;
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
