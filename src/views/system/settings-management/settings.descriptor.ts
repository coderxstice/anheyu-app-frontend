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
    frontendPath: "post.expirationTime",
    backendKey: constant.KeyPostExpirationTime,
    defaultValue: "",
    type: "number"
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
  },
  {
    frontendPath: "post.theme.primaryColorApiUrl",
    backendKey: constant.KeyPostThemePrimaryColorAPIURL,
    defaultValue: 12,
    type: "string"
  },
  {
    frontendPath: "post.theme.primaryColorApiToken",
    backendKey: constant.KeyPostThemePrimaryColorAPIToken,
    defaultValue: 12,
    type: "string"
  },
  {
    frontendPath: "post.reward.enable",
    backendKey: constant.KeyPostRewardEnable,
    defaultValue: 12,
    type: "boolean"
  },
  {
    frontendPath: "post.reward.weChat",
    backendKey: constant.KeyPostRewardWeChatQR,
    defaultValue: 12,
    type: "string"
  },
  {
    frontendPath: "post.reward.aliPay",
    backendKey: constant.KeyPostRewardAlipayQR,
    defaultValue: 12,
    type: "string"
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

const sidebarDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "frontDesk.sidebar.authorEnable",
    backendKey: constant.KeySidebarAuthorEnable,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.sidebar.userAvatar",
    backendKey: constant.KeyUserAvatar,
    defaultValue: "/static/img/avatar.jpg",
    type: "string"
  },
  {
    frontendPath: "frontDesk.sidebar.authorDescription",
    backendKey: constant.KeySidebarAuthorDescription,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.sidebar.authorStatusImg",
    backendKey: constant.KeySidebarAuthorStatusImg,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.sidebar.authorSkills",
    backendKey: constant.KeySidebarAuthorSkills,
    defaultValue: [],
    type: "json"
  },
  {
    frontendPath: "frontDesk.sidebar.authorSocial",
    backendKey: constant.KeySidebarAuthorSocial,
    defaultValue: {},
    type: "json"
  },
  {
    frontendPath: "frontDesk.sidebar.wechatEnable",
    backendKey: constant.KeySidebarWechatEnable,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.sidebar.wechatFace",
    backendKey: constant.KeySidebarWechatFace,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.sidebar.wechatBackFace",
    backendKey: constant.KeySidebarWechatBackFace,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.sidebar.wechatBlurredBackground",
    backendKey: constant.KeySidebarWechatBlurredBackground,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.sidebar.tagsEnable",
    backendKey: constant.KeySidebarTagsEnable,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.sidebar.tagsHighlight",
    backendKey: constant.KeySidebarTagsHighlight,
    defaultValue: [],
    type: "json"
  },
  {
    frontendPath: "frontDesk.sidebar.siteInfoTotalPostCount",
    backendKey: constant.KeySidebarSiteInfoTotalPostCount,
    defaultValue: true,
    type: "number"
  },
  {
    frontendPath: "frontDesk.sidebar.siteInfoRuntimeEnable",
    backendKey: constant.KeySidebarSiteInfoRuntimeEnable,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.sidebar.siteInfoTotalWordCount",
    backendKey: constant.KeySidebarSiteInfoTotalWordCount,
    defaultValue: true,
    type: "number"
  },
  {
    frontendPath: "frontDesk.sidebar.archiveDisplayMonths",
    backendKey: constant.KeySidebarArchiveDisplayMonths,
    defaultValue: 6,
    type: "number"
  }
];

const commentDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "frontDesk.comment.loginRequired",
    backendKey: constant.KeyCommentLoginRequired,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.comment.pageSize",
    backendKey: constant.KeyCommentPageSize,
    defaultValue: 10,
    type: "number"
  },
  {
    frontendPath: "frontDesk.comment.masterTag",
    backendKey: constant.KeyCommentMasterTag,
    defaultValue: "博主",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.placeholder",
    backendKey: constant.KeyCommentPlaceholder,
    defaultValue: "欢迎留下宝贵的建议啦～",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.emojiCDN",
    backendKey: constant.KeyCommentEmojiCDN,
    defaultValue:
      "https://npm.elemecdn.com/anzhiyu-theme-static@1.1.3/twikoo/twikoo.json",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.bloggerEmail",
    backendKey: constant.KeyCommentBloggerEmail,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.showUA",
    backendKey: constant.KeyCommentShowUA,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.comment.showRegion",
    backendKey: constant.KeyCommentShowRegion,
    defaultValue: true,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.comment.limitPerMinute",
    backendKey: constant.KeyCommentLimitPerMinute,
    defaultValue: 5,
    type: "number"
  },
  {
    frontendPath: "frontDesk.comment.limitLength",
    backendKey: constant.KeyCommentLimitLength,
    defaultValue: 10000,
    type: "number"
  },
  {
    frontendPath: "frontDesk.comment.forbiddenWords",
    backendKey: constant.KeyCommentForbiddenWords,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.notifySpam",
    backendKey: constant.KeyCommentNotifySpam,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.comment.mailSubject",
    backendKey: constant.KeyCommentMailSubject,
    defaultValue: "您在 [${SITE_NAME}] 上的评论收到了回复",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.mailSubjectAdmin",
    backendKey: constant.KeyCommentMailSubjectAdmin,
    defaultValue: "[${SITE_NAME}] 上有新评论了",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.mailTemplate",
    backendKey: constant.KeyCommentMailTemplate,
    defaultValue:
      "您在文章《${POST_TITLE}》下的评论收到了来自 ${NICK} 的回复：<br/>${COMMENT}<br/>点击查看：${POST_URL}",
    type: "string"
  },
  {
    frontendPath: "frontDesk.comment.mailTemplateAdmin",
    backendKey: constant.KeyCommentMailTemplateAdmin,
    defaultValue:
      "文章《${POST_TITLE}》下有来自 ${NICK} 的新评论：<br/>${COMMENT}<br/>点击管理：${MANAGE_URL}",
    type: "string"
  }
];

const emailDescriptors: SettingDescriptor[] = [
  {
    frontendPath: "frontDesk.email.resetPasswordSubject",
    backendKey: constant.KeyResetPasswordSubject,
    defaultValue: "【{{.AppName}}】重置您的账户密码",
    type: "string"
  },
  {
    frontendPath: "frontDesk.email.resetPasswordTemplate",
    backendKey: constant.KeyResetPasswordTemplate,
    defaultValue: `<!DOCTYPE html><html><head><title>重置密码</title></head><body><p>您好, {{.Nickname}}！</p><p>您正在请求重置您在 <strong>{{.AppName}}</strong> 的账户密码。</p><p>请点击以下链接以完成重置（此链接24小时内有效）：</p><p><a href="{{.ResetLink}}">重置我的密码</a></p><p>如果链接无法点击，请将其复制到浏览器地址栏中打开。</p><p>如果您没有请求重置密码，请忽略此邮件。</p><br/><p>感谢, <br/>{{.AppName}} 团队</p></body></html>`,
    type: "string"
  },
  {
    frontendPath: "frontDesk.email.activateAccountSubject",
    backendKey: constant.KeyActivateAccountSubject,
    defaultValue: "【{{.AppName}}】激活您的账户",
    type: "string"
  },
  {
    frontendPath: "frontDesk.email.activateAccountTemplate",
    backendKey: constant.KeyActivateAccountTemplate,
    defaultValue: `<!DOCTYPE html><html><head><title>激活您的账户</title></head><body><p>您好, {{.Nickname}}！</p><p>欢迎注册 <strong>{{.AppName}}</strong>！</p><p>请点击以下链接以激活您的账户（此链接24小时内有效）：</p><p><a href="{{.ActivateLink}}">激活我的账户</a></p><p>如果链接无法点击，请将其复制到浏览器地址栏中打开。</p><p>如果您并未注册，请忽略此邮件。</p><br/><p>感谢, <br/>{{.AppName}} 团队</p></body></html>`,
    type: "string"
  },
  {
    frontendPath: "frontDesk.email.enableUserActivation",
    backendKey: constant.KeyEnableUserActivation,
    defaultValue: false,
    type: "boolean"
  },
  {
    frontendPath: "frontDesk.email.smtpHost",
    backendKey: constant.KeySmtpHost,
    defaultValue: "smtp.example.com",
    type: "string"
  },
  {
    frontendPath: "frontDesk.email.smtpPort",
    backendKey: constant.KeySmtpPort,
    defaultValue: 587,
    type: "number"
  },
  {
    frontendPath: "frontDesk.email.smtpUsername",
    backendKey: constant.KeySmtpUsername,
    defaultValue: "user@example.com",
    type: "string"
  },
  {
    frontendPath: "frontDesk.email.smtpPassword",
    backendKey: constant.KeySmtpPassword,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.email.smtpSenderName",
    backendKey: constant.KeySmtpSenderName,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.email.smtpSenderEmail",
    backendKey: constant.KeySmtpSenderEmail,
    defaultValue: "noreply@example.com",
    type: "string"
  },
  {
    frontendPath: "frontDesk.email.smtpReplyToEmail",
    backendKey: constant.KeySmtpReplyToEmail,
    defaultValue: "",
    type: "string"
  },
  {
    frontendPath: "frontDesk.email.smtpForceSSL",
    backendKey: constant.KeySmtpForceSSL,
    defaultValue: false,
    type: "boolean"
  }
];

export const allSettingDescriptors = [
  ...siteDescriptors,
  ...pageDescriptors,
  ...fileDescriptors,
  ...postDescriptors,
  ...frontDeskDescriptors,
  ...sidebarDescriptors,
  ...commentDescriptors,
  ...emailDescriptors
];
