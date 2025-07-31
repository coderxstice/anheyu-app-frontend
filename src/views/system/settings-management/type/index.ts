/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-07-24 17:29:16
 * @LastEditTime: 2025-07-31 18:18:36
 * @LastEditors: 安知鱼
 */
// src/views/system/settings-management/type/index.ts

/**
 * @description: 站点信息表单接口
 */
export interface SiteInfo {
  siteName: string;
  subTitle: string;
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

  menuJSON: string;
  navTravel: boolean;
  navClock: boolean;
  navMenuItemsJSON: string;
}

export interface FrontDeskSettings {
  home: HomePageSettingsInfo;
  // article: ArticlePageSettingsInfo;
}

/**
 * @description: 用于 JsonEditorTable 组件的列定义
 */
export interface JsonEditorTableColumn {
  prop: string;
  label: string;
  slot?: string;
  width?: string;
}

/**
 * @description: 导航栏的子菜单项类型
 */
export interface SubMenuItem {
  title: string;
  path: string;
  icon: string;
  isExternal: boolean; // 对应“是否新页面打开”
}

/**
 * @description: 页眉下拉菜单的链接项类型
 */
export interface NavMenuItem {
  name: string;
  link: string;
  icon: string;
}
