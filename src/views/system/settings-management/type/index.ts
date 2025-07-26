/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-07-24 17:29:16
 * @LastEditTime: 2025-07-26 15:34:28
 * @LastEditors: 安知鱼
 */
// src/views/system/settings-management/type/index.ts

/**
 * @description: 站点信息表单接口
 */
export interface SiteInfo {
  siteName: string;
  siteDescription: string;
  primaryUrl: string;
  footerCode: string;
  announcement: string;
  logoDay: string;
  logoNight: string;
  favicon: string;
  iconMedium: string;
  iconLarge: string;
}

/**
 * @description: 页面配置表单接口
 */
export interface PageSittingInfo {
  albumApiURL: string;
  defaultThumbParam?: string;
  defaultBigParam?: string;
}

/**
 * @description: 文件配置表单接口
 */
export interface FileSettingsInfo {
  uploadAllowedExtensions: string;
  uploadDeniedExtensions: string;

  enableVipsGenerator: boolean;
  vipsPath: string;
  vipsMaxFileSize: string;
  vipsSupportedExts: string;

  enableMusicCoverGenerator: boolean;
  musicCoverMaxFileSize: string;
  musicCoverSupportedExts: string;

  enableFfmpegGenerator: boolean;
  ffmpegPath: string;
  ffmpegMaxFileSize: string;
  ffmpegSupportedExts: string;
  ffmpegCaptureTime: string;

  enableBuiltinGenerator: boolean;
  builtinMaxFileSize: string;
  builtinDirectServeExts: string;

  queueThumbConcurrency: number;
  queueThumbMaxExecTime: number;
  queueThumbBackoffFactor: number;
  queueThumbMaxBackoff: number;
  queueThumbMaxRetries: number;
  queueThumbRetryDelay: number;

  enableExifExtractor: boolean;
  exifMaxSizeLocal: string;
  exifMaxSizeRemote: string;
  exifUseBruteForce: boolean;

  enableMusicExtractor: boolean;
  musicMaxSizeLocal: string;
  musicMaxSizeRemote: string;
}

/**
 * @description: 完整设置表单的聚合接口
 */
export interface SettingsForm {
  site: SiteInfo;
  page: PageSittingInfo;
  file: FileSettingsInfo;
  frontDesk: FrontDeskSettings;
}

export interface HomePageSettingsInfo {
  siteOwnerName: string;
  siteOwnerEmail: string;
  footerOwnerName: string;
  footerOwnerSince: string;
  footerRuntimeEnable: boolean;
  footerRuntimeLaunchTime: string;
  footerRuntimeWorkImg: string;
  footerRuntimeWorkDesc: string;
  footerRuntimeOffDutyImg: string;
  footerRuntimeOffDutyDesc: string;
  footerSocialBarCenterImg: string;
  footerListRandomFriends: string;
  footerBarAuthorLink: string;
  footerBarCCLink: string;
  footerBadgeJSON: string;
  footerSocialBarLeftJSON: string;
  footerSocialBarRightJSON: string;
  footerListJSON: string;
  footerBarLinkListJSON: string;
}

export interface FrontDeskSettings {
  home: HomePageSettingsInfo;
  // article: ArticlePageSettingsInfo;
}
