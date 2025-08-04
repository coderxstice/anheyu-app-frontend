// src/views/system/settings-management/settings.descriptor.ts
import { constant } from "@/constant";
import type { SettingKey } from "@/constant";

/**
 * @description 单个设置的描述符接口
 * @param frontendPath - 在前端 form 对象中的路径 (e.g., 'site.siteName')
 * @param backendKey - 在后端API中的键名 (e.g., 'APP_NAME')
 * @param defaultValue - 该项的默认值
 * @param type - 数据类型，用于自动转换。'string' | 'boolean' | 'number' | 'json'
 */
export interface SettingDescriptor {
  frontendPath: string;
  backendKey: SettingKey;
  defaultValue: any;
  type: "string" | "boolean" | "number" | "json";
}

const siteDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "site.siteName",
    backendKey: constant.KeyAppName,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "site.subTitle",
    backendKey: constant.KeySubTitle,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "site.siteDescription",
    backendKey: constant.KeySiteDescription,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "site.primaryUrl",
    backendKey: constant.KeySiteURL,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "site.footerCode",
    backendKey: constant.KeyFooterCode,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "site.announcement",
    backendKey: constant.KeySiteAnnouncement,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "site.logoDay",
    backendKey: constant.KeyLogoHorizontalDay,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "site.logoNight",
    backendKey: constant.KeyLogoHorizontalNight,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "site.favicon",
    backendKey: constant.KeyIconURL,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "site.iconMedium",
    backendKey: constant.KeyLogoURL192,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "site.iconLarge",
    backendKey: constant.KeyLogoURL512,
    defaultValue: "",
    type: "string"
  }
];

const pageDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "page.albumApiURL",
    backendKey: constant.KeyApiURL,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "page.defaultThumbParam",
    backendKey: constant.KeyDefaultThumbParam,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "page.defaultBigParam",
    backendKey: constant.KeyDefaultBigParam,
    defaultValue: "",
    type: "string"
  }
];

const fileDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "file.uploadAllowedExtensions",
    backendKey: constant.KeyUploadAllowedExtensions,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "file.uploadDeniedExtensions",
    backendKey: constant.KeyUploadDeniedExtensions,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "file.enableVipsGenerator",
    backendKey: constant.KeyEnableVipsGenerator,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "file.vipsPath",
    backendKey: constant.KeyVipsPath,
    defaultValue: "vips",
    type: "string"
  },
  {
    frontendPath: "file.vipsMaxFileSize",
    backendKey: constant.KeyVipsMaxFileSize,
    defaultValue: "0",
    type: "string"
  }, // 使用字符串以匹配el-input
  {
    frontendPath: "file.vipsSupportedExts",
    backendKey: constant.KeyVipsSupportedExts,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "file.enableMusicCoverGenerator",
    backendKey: constant.KeyEnableMusicCoverGenerator,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "file.musicCoverMaxFileSize",
    backendKey: constant.KeyMusicCoverMaxFileSize,
    defaultValue: "0",
    type: "string"
  },
  {
    frontendPath: "file.musicCoverSupportedExts",
    backendKey: constant.KeyMusicCoverSupportedExts,
    defaultValue: "mp3,m4a,ogg,flac",
    type: "string"
  },
  {
    frontendPath: "file.enableFfmpegGenerator",
    backendKey: constant.KeyEnableFfmpegGenerator,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "file.ffmpegPath",
    backendKey: constant.KeyFfmpegPath,
    defaultValue: "ffmpeg",
    type: "string"
  },
  {
    frontendPath: "file.ffmpegMaxFileSize",
    backendKey: constant.KeyFfmpegMaxFileSize,
    defaultValue: "0",
    type: "string"
  },
  {
    frontendPath: "file.ffmpegSupportedExts",
    backendKey: constant.KeyFfmpegSupportedExts,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "file.ffmpegCaptureTime",
    backendKey: constant.KeyFfmpegCaptureTime,
    defaultValue: "00:00:01.00",
    type: "string"
  },
  {
    frontendPath: "file.enableBuiltinGenerator",
    backendKey: constant.KeyEnableBuiltinGenerator,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "file.builtinMaxFileSize",
    backendKey: constant.KeyBuiltinMaxFileSize,
    defaultValue: "0",
    type: "string"
  },
  {
    frontendPath: "file.builtinDirectServeExts",
    backendKey: constant.KeyBuiltinDirectServeExts,
    defaultValue: "avif,webp",
    type: "string"
  },
  {
    frontendPath: "file.queueThumbConcurrency",
    backendKey: constant.KeyQueueThumbConcurrency,
    defaultValue: 15,
    type: "number"
  },
  {
    frontendPath: "file.queueThumbMaxExecTime",
    backendKey: constant.KeyQueueThumbMaxExecTime,
    defaultValue: 300,
    type: "number"
  },
  {
    frontendPath: "file.queueThumbBackoffFactor",
    backendKey: constant.KeyQueueThumbBackoffFactor,
    defaultValue: 2,
    type: "number"
  },
  {
    frontendPath: "file.queueThumbMaxBackoff",
    backendKey: constant.KeyQueueThumbMaxBackoff,
    defaultValue: 60,
    type: "number"
  },
  {
    frontendPath: "file.queueThumbMaxRetries",
    backendKey: constant.KeyQueueThumbMaxRetries,
    defaultValue: 3,
    type: "number"
  },
  {
    frontendPath: "file.queueThumbRetryDelay",
    backendKey: constant.KeyQueueThumbRetryDelay,
    defaultValue: 5,
    type: "number"
  },
  {
    frontendPath: "file.enableExifExtractor",
    backendKey: constant.KeyEnableExifExtractor,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "file.exifMaxSizeLocal",
    backendKey: constant.KeyExifMaxSizeLocal,
    defaultValue: "0",
    type: "string"
  },
  {
    frontendPath: "file.exifMaxSizeRemote",
    backendKey: constant.KeyExifMaxSizeRemote,
    defaultValue: "0",
    type: "string"
  },
  {
    frontendPath: "file.exifUseBruteForce",
    backendKey: constant.KeyExifUseBruteForce,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "file.enableMusicExtractor",
    backendKey: constant.KeyEnableMusicExtractor,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "file.musicMaxSizeLocal",
    backendKey: constant.KeyMusicMaxSizeLocal,
    defaultValue: "0",
    type: "string"
  },
  {
    frontendPath: "file.musicMaxSizeRemote",
    backendKey: constant.KeyMusicMaxSizeRemote,
    defaultValue: "0",
    type: "string"
  }
];

const postDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "post.ipApi",
    backendKey: constant.KeyIPAPI,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "post.ipApiToken",
    backendKey: constant.KeyIPAPIToKen,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "post.default.defaultCover",
    backendKey: constant.KeyDefaultCover,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "post.default.doubleColumn",
    backendKey: constant.KeyDoubleColumn,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "post.default.pageSize",
    backendKey: constant.KeyPostDefaultPageSize,
    defaultValue: 12,
    type: "number"
  }
];

const frontDeskDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "frontDesk.home.siteOwnerName",
    backendKey: constant.KeyFrontDeskSiteOwnerName,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.siteOwnerEmail",
    backendKey: constant.KeyFrontDeskSiteOwnerEmail,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.footerOwnerName",
    backendKey: constant.KeyFooterOwnerName,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.footerOwnerSince",
    backendKey: constant.KeyFooterOwnerSince,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.footerRuntimeEnable",
    backendKey: constant.KeyFooterRuntimeEnable,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.home.footerRuntimeLaunchTime",
    backendKey: constant.KeyFooterRuntimeLaunchTime,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.footerRuntimeWorkImg",
    backendKey: constant.KeyFooterRuntimeWorkImg,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.footerRuntimeWorkDesc",
    backendKey: constant.KeyFooterRuntimeWorkDesc,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.footerRuntimeOffDutyImg",
    backendKey: constant.KeyFooterRuntimeOffDutyImg,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.footerRuntimeOffDutyDesc",
    backendKey: constant.KeyFooterRuntimeOffDutyDesc,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.footerSocialBarCenterImg",
    backendKey: constant.KeyFooterSocialBarCenterImg,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.footerListRandomFriends",
    backendKey: constant.KeyFooterListRandomFriends,
    defaultValue: "0",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.footerBarAuthorLink",
    backendKey: constant.KeyFooterBarAuthorLink,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.footerBarCCLink",
    backendKey: constant.KeyFooterBarCCLink,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.home.navTravel",
    backendKey: constant.KeyHeaderNavTravel,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.home.navClock",
    backendKey: constant.KeyHeaderNavClock,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.home.homeTop",
    backendKey: constant.KeyHomeTop,
    defaultValue: {},
    type: "json"
  },
  {
    frontendPath: "frontDesk.home.footerBadges",
    backendKey: constant.KeyFooterBadge,
    defaultValue: [],
    type: "json"
  },
  {
    frontendPath: "frontDesk.home.footerSocialBarLeft",
    backendKey: constant.KeyFooterSocialBarLeft,
    defaultValue: [],
    type: "json"
  },
  {
    frontendPath: "frontDesk.home.footerSocialBarRight",
    backendKey: constant.KeyFooterSocialBarRight,
    defaultValue: [],
    type: "json"
  },
  {
    frontendPath: "frontDesk.home.footerList",
    backendKey: constant.KeyFooterList,
    defaultValue: [],
    type: "json"
  },
  {
    frontendPath: "frontDesk.home.footerBarLinkList",
    backendKey: constant.KeyFooterBarLinkList,
    defaultValue: [],
    type: "json"
  },
  {
    frontendPath: "frontDesk.home.menu",
    backendKey: constant.KeyHeaderMenu,
    defaultValue: [],
    type: "json"
  },
  {
    frontendPath: "frontDesk.home.navMenuItems",
    backendKey: constant.KeyHeaderNavMenu,
    defaultValue: [],
    type: "json"
  }
];

// 导出合并后的所有描述符
export const allSettingDescriptors = [
  ...siteDescriptors,
  ...pageDescriptors,
  ...fileDescriptors,
  ...postDescriptors,
  ...frontDeskDescriptors
];
