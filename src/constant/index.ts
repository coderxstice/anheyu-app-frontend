/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-21 18:42:04
 * @LastEditTime: 2025-06-21 18:42:09
 * @LastEditors: 安知鱼
 */
/**
 * @description: 系统配置相关的常量，与后端保持同步。
 * @Author: 安知鱼
 * @Date: 2025-06-21 18:40:00
 */

/**
 * 定义配置键的类型，增强类型安全
 */
export type SettingKey = string;

/**
 * 站点基础配置 (可暴露给前端)
 */
const KeyAppName: SettingKey = "APP_NAME";
const KeySiteURL: SettingKey = "SITE_URL";
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

/**
 * 站点敏感或内部配置 (不暴露给前端)
 */
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
const KeySiteAnnouncement: SettingKey = "SITE_ANNOUNCEMENT";
const KeyFooterCode: SettingKey = "FOOTER_CODE";

/**
 * 将所有常量组合到一个对象中导出
 */
export const constant = {
  KeyAppName,
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
  KeySiteAnnouncement,
  KeyFooterCode
};
