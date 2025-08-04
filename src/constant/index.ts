/*
 * @Description: 系统配置相关的常量，与后端 Go 定义和 API 响应保持同步。
 * @Author: 安知鱼
 * @Date: 2025-06-21 18:42:04
 * @LastEditTime: 2025-08-02 18:08:11
 * @LastEditors: 安知鱼
 */

/**
 * 定义配置键的类型，增强类型安全
 */
export type SettingKey = string;

// --- 站点基础配置 (可暴露给前端) ---
const KeyAppName: SettingKey = "APP_NAME";
const KeySiteURL: SettingKey = "SITE_URL";
const KeySubTitle: SettingKey = "SUB_TITLE";
const KeyAppVersion: SettingKey = "APP_VERSION";
const KeyApiURL: SettingKey = "API_URL";
const KeyAboutLink: SettingKey = "ABOUT_LINK";
const KeyIcpNumber: SettingKey = "ICP_NUMBER";
const KeySiteKeywords: SettingKey = "SITE_KEYWORDS";
const KeySiteDescription: SettingKey = "SITE_DESCRIPTION";
const KeyUserAvatar: SettingKey = "USER_AVATAR";
const KeyLogoURL: SettingKey = "LOGO_URL";
const KeyLogoURL192: SettingKey = "LOGO_URL_192x192";
const KeyLogoURL512: SettingKey = "LOGO_URL_512x512";
const KeyLogoHorizontalDay: SettingKey = "LOGO_HORIZONTAL_DAY";
const KeyLogoHorizontalNight: SettingKey = "LOGO_HORIZONTAL_NIGHT";
const KeyIconURL: SettingKey = "ICON_URL";
const KeyDefaultThumbParam: SettingKey = "DEFAULT_THUMB_PARAM";
const KeyDefaultBigParam: SettingKey = "DEFAULT_BIG_PARAM";
const KeyGravatarURL: SettingKey = "GRAVATAR_URL";
const KeyThemeColor: SettingKey = "THEME_COLOR";
const KeySiteAnnouncement: SettingKey = "SITE_ANNOUNCEMENT";
const KeyFooterCode: SettingKey = "FOOTER_CODE";
const KeyUploadAllowedExtensions: SettingKey = "UPLOAD_ALLOWED_EXTENSIONS";
const KeyUploadDeniedExtensions: SettingKey = "UPLOAD_DENIED_EXTENSIONS";

// --- Header/Nav 配置 ---
const KeyHeaderMenu: SettingKey = "header.menu";
const KeyHeaderNavTravel: SettingKey = "header.nav.travelling";
const KeyHeaderNavClock: SettingKey = "header.nav.clock";
const KeyHeaderNavMenu: SettingKey = "header.nav.menu";
const KeyHomeTop: SettingKey = "HOME_TOP";

// --- 前台及页脚配置 ---
const KeyFrontDeskSiteOwnerName: SettingKey = "frontDesk.siteOwner.name";
const KeyFrontDeskSiteOwnerEmail: SettingKey = "frontDesk.siteOwner.email";
const KeyFooterOwnerName: SettingKey = "footer.owner.name";
const KeyFooterOwnerSince: SettingKey = "footer.owner.since";
const KeyFooterCustomText: SettingKey = "footer.custom_text";
const KeyFooterRuntimeEnable: SettingKey = "footer.runtime.enable";
const KeyFooterRuntimeLaunchTime: SettingKey = "footer.runtime.launch_time";
const KeyFooterRuntimeWorkImg: SettingKey = "footer.runtime.work_img";
const KeyFooterRuntimeWorkDesc: SettingKey = "footer.runtime.work_description";
const KeyFooterRuntimeOffDutyImg: SettingKey = "footer.runtime.offduty_img";
const KeyFooterRuntimeOffDutyDesc: SettingKey =
  "footer.runtime.offduty_description";
const KeyFooterSocialBarCenterImg: SettingKey = "footer.socialBar.centerImg";
const KeyFooterListRandomFriends: SettingKey = "footer.list.randomFriends";
const KeyFooterBarAuthorLink: SettingKey = "footer.bar.authorLink";
const KeyFooterBarCCLink: SettingKey = "footer.bar.cc.link";
const KeyFooterBadge: SettingKey = "footer.badge.list";
const KeyFooterSocialBarLeft: SettingKey = "footer.socialBar.left";
const KeyFooterSocialBarRight: SettingKey = "footer.socialBar.right";
const KeyFooterList: SettingKey = "footer.project.list";
const KeyFooterBarLinkList: SettingKey = "footer.bar.linkList";
const KeyDefaultCover: SettingKey = "post.default.cover";
const KeyDoubleColumn: SettingKey = "post.default.double_column";
const KeyPostDefaultPageSize: SettingKey = "post.default.page_size";

// --- 文件生成及处理配置 ---
const KeyEnableVipsGenerator: SettingKey = "ENABLE_VIPS_GENERATOR";
const KeyVipsPath: SettingKey = "VIPS_PATH";
const KeyVipsSupportedExts: SettingKey = "VIPS_SUPPORTED_EXTS";
const KeyVipsMaxFileSize: SettingKey = "VIPS_MAX_FILE_SIZE";
const KeyEnableMusicCoverGenerator: SettingKey = "ENABLE_MUSIC_COVER_GENERATOR";
const KeyMusicCoverSupportedExts: SettingKey = "MUSIC_COVER_SUPPORTED_EXTS";
const KeyMusicCoverMaxFileSize: SettingKey = "MUSIC_COVER_MAX_FILE_SIZE";
const KeyEnableFfmpegGenerator: SettingKey = "ENABLE_FFMPEG_GENERATOR";
const KeyFfmpegPath: SettingKey = "FFMPEG_PATH";
const KeyFfmpegSupportedExts: SettingKey = "FFMPEG_SUPPORTED_EXTS";
const KeyFfmpegMaxFileSize: SettingKey = "FFMPEG_MAX_FILE_SIZE";
const KeyFfmpegCaptureTime: SettingKey = "FFMPEG_CAPTURE_TIME";
const KeyEnableBuiltinGenerator: SettingKey = "ENABLE_BUILTIN_GENERATOR";
const KeyBuiltinMaxFileSize: SettingKey = "BUILTIN_MAX_FILE_SIZE";
const KeyBuiltinDirectServeExts: SettingKey = "BUILTIN_DIRECT_SERVE_EXTS";

// --- 缩略图生成队列配置 ---
const KeyQueueThumbConcurrency: SettingKey = "QUEUE_THUMB_CONCURRENCY";
const KeyQueueThumbMaxExecTime: SettingKey = "QUEUE_THUMB_MAX_EXEC_TIME";
const KeyQueueThumbBackoffFactor: SettingKey = "QUEUE_THUMB_BACKOFF_FACTOR";
const KeyQueueThumbMaxBackoff: SettingKey = "QUEUE_THUMB_MAX_BACKOFF";
const KeyQueueThumbMaxRetries: SettingKey = "QUEUE_THUMB_MAX_RETRIES";
const KeyQueueThumbRetryDelay: SettingKey = "QUEUE_THUMB_RETRY_DELAY";

// --- 媒体信息提取配置 ---
const KeyEnableExifExtractor: SettingKey = "ENABLE_EXIF_EXTRACTOR";
const KeyExifMaxSizeLocal: SettingKey = "EXIF_MAX_SIZE_LOCAL";
const KeyExifMaxSizeRemote: SettingKey = "EXIF_MAX_SIZE_REMOTE";
const KeyExifUseBruteForce: SettingKey = "EXIF_USE_BRUTE_FORCE";
const KeyEnableMusicExtractor: SettingKey = "ENABLE_MUSIC_EXTRACTOR";
const KeyMusicMaxSizeLocal: SettingKey = "MUSIC_MAX_SIZE_LOCAL";
const KeyMusicMaxSizeRemote: SettingKey = "MUSIC_MAX_SIZE_REMOTE";

// --- 站点敏感或内部配置 (在管理后台使用) ---
const KeyJWTSecret: SettingKey = "JWT_SECRET";
const KeyResetPasswordSubject: SettingKey = "DEFAULT_RESET_PASSWORD_SUBJECT";
const KeyResetPasswordTemplate: SettingKey = "DEFAULT_RESET_PASSWORD_TEMPLATE";
const KeyActivateAccountSubject: SettingKey =
  "DEFAULT_ACTIVATE_ACCOUNT_SUBJECT";
const KeyActivateAccountTemplate: SettingKey =
  "DEFAULT_ACTIVATE_ACCOUNT_TEMPLATE";
const KeyEnableUserActivation: SettingKey = "ENABLE_USER_ACTIVATION";
const KeySmtpHost: SettingKey = "SMTP_HOST";
const KeySmtpPort: SettingKey = "SMTP_PORT";
const KeySmtpUsername: SettingKey = "SMTP_USERNAME";
const KeySmtpPassword: SettingKey = "SMTP_PASSWORD";
const KeySmtpSenderName: SettingKey = "SMTP_SENDER_NAME";
const KeySmtpSenderEmail: SettingKey = "SMTP_SENDER_EMAIL";
const KeySmtpReplyToEmail: SettingKey = "SMTP_REPLY_TO_EMAIL";
const KeySmtpForceSSL: SettingKey = "SMTP_FORCE_SSL";
const KeyIPAPI: SettingKey = "IP_API";
const KeyIPAPIToKen: SettingKey = "IP_API_TOKEN";

const DEFAULT_CHUNK_SIZE = 50 * 1024 * 1024;

/**
 * 将所有常量组合到一个对象中导出
 */
export const constant = {
  // --- 站点基础配置 ---
  KeyAppName,
  KeySubTitle,
  KeySiteURL,
  KeyAppVersion,
  KeyApiURL,
  KeyAboutLink,
  KeyIcpNumber,
  KeySiteKeywords,
  KeySiteDescription,
  KeyUserAvatar,
  KeyLogoURL,
  KeyLogoURL192,
  KeyLogoURL512,
  KeyLogoHorizontalDay,
  KeyLogoHorizontalNight,
  KeyIconURL,
  KeyDefaultThumbParam,
  KeyDefaultBigParam,
  KeyGravatarURL,
  KeyThemeColor,
  KeySiteAnnouncement,
  KeyFooterCode,
  KeyUploadAllowedExtensions,
  KeyUploadDeniedExtensions,

  // --- 前台及页脚配置 ---
  KeyFrontDeskSiteOwnerName,
  KeyFrontDeskSiteOwnerEmail,
  KeyFooterOwnerName,
  KeyFooterOwnerSince,
  KeyFooterCustomText,
  KeyFooterRuntimeEnable,
  KeyFooterRuntimeLaunchTime,
  KeyFooterRuntimeWorkImg,
  KeyFooterRuntimeWorkDesc,
  KeyFooterRuntimeOffDutyImg,
  KeyFooterRuntimeOffDutyDesc,
  KeyFooterSocialBarCenterImg,
  KeyFooterListRandomFriends,
  KeyFooterBarAuthorLink,
  KeyFooterBarCCLink,
  KeyFooterBadge,
  KeyFooterSocialBarLeft,
  KeyFooterSocialBarRight,
  KeyFooterList,
  KeyFooterBarLinkList,
  KeyDefaultCover,
  KeyDoubleColumn,
  KeyPostDefaultPageSize,
  KeyHeaderMenu,
  KeyHeaderNavTravel,
  KeyHeaderNavClock,
  KeyHeaderNavMenu,
  KeyHomeTop,

  // --- 文件生成及处理配置 ---
  KeyEnableVipsGenerator,
  KeyVipsPath,
  KeyVipsSupportedExts,
  KeyVipsMaxFileSize,
  KeyEnableMusicCoverGenerator,
  KeyMusicCoverSupportedExts,
  KeyMusicCoverMaxFileSize,
  KeyEnableFfmpegGenerator,
  KeyFfmpegPath,
  KeyFfmpegSupportedExts,
  KeyFfmpegMaxFileSize,
  KeyFfmpegCaptureTime,
  KeyEnableBuiltinGenerator,
  KeyBuiltinMaxFileSize,
  KeyBuiltinDirectServeExts,

  // --- 缩略图生成队列配置 ---
  KeyQueueThumbConcurrency,
  KeyQueueThumbMaxExecTime,
  KeyQueueThumbBackoffFactor,
  KeyQueueThumbMaxBackoff,
  KeyQueueThumbMaxRetries,
  KeyQueueThumbRetryDelay,

  // --- 媒体信息提取配置 ---
  KeyEnableExifExtractor,
  KeyExifMaxSizeLocal,
  KeyExifMaxSizeRemote,
  KeyExifUseBruteForce,
  KeyEnableMusicExtractor,
  KeyMusicMaxSizeLocal,
  KeyMusicMaxSizeRemote,

  // --- 站点敏感或内部配置 ---
  KeyJWTSecret,
  KeyResetPasswordSubject,
  KeyResetPasswordTemplate,
  KeyActivateAccountSubject,
  KeyActivateAccountTemplate,
  KeyEnableUserActivation,
  KeySmtpHost,
  KeySmtpPort,
  KeySmtpUsername,
  KeySmtpPassword,
  KeySmtpSenderName,
  KeySmtpSenderEmail,
  KeySmtpReplyToEmail,
  KeySmtpForceSSL,
  KeyIPAPI,
  KeyIPAPIToKen,

  // --- 其他 ---
  DEFAULT_CHUNK_SIZE
};
