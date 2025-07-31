<template>
  <el-card v-loading="siteConfigStore.loading" shadow="never">
    <el-tabs v-model="activeName" class="setting-tabs">
      <el-tab-pane label="站点信息" name="siteConfig">
        <el-form :model="form" label-position="top" class="setting-form">
          <BaseInfoForm v-model="form.site" />
          <IconSettingsForm v-model="form.site" />
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="页面配置" name="pageSetting">
        <el-form :model="form" label-position="top" class="setting-form">
          <PageSittingForm v-model="form.page" />
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="文件配置" name="fileSetting">
        <el-form :model="form" label-position="top" class="setting-form">
          <FileSettings v-model="form.file" />
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="前台配置" name="frontDeskSetting">
        <FrontDeskSettings v-model="form.frontDesk" />
      </el-tab-pane>
    </el-tabs>

    <div class="save-button-container">
      <el-button type="primary" size="large" @click="handleSave">
        保存设置
      </el-button>
    </div>
  </el-card>
</template>

<script lang="ts" setup>
import { reactive, onMounted, watch } from "vue";
import { ElMessage } from "element-plus";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { constant } from "@/constant";

import type {
  SettingsForm,
  SiteInfo,
  PageSittingInfo,
  FileSettingsInfo,
  HomePageSettingsInfo
} from "./type";

import BaseInfoForm from "./components/BaseInfoForm.vue";
import IconSettingsForm from "./components/IconSettingsForm.vue";
import PageSittingForm from "./components/PageSittingForm.vue";
import FileSettings from "./components/fileSetting/FileSettingsForm.vue";
import FrontDeskSettings from "./components/FrontDeskSettings.vue";

let activeName = "siteConfig";
const siteConfigStore = useSiteConfigStore();

type HomePageFormInfo = Omit<HomePageSettingsInfo, "footerCustomText">;
type FormType = Omit<SettingsForm, "frontDesk"> & {
  frontDesk: { home: HomePageFormInfo };
};
type FormKeys =
  | keyof SiteInfo
  | keyof PageSittingInfo
  | keyof FileSettingsInfo
  | keyof HomePageFormInfo;

const form = reactive<FormType>({
  site: {
    siteName: "",
    subTitle: "",
    siteDescription: "",
    primaryUrl: "",
    footerCode: "",
    announcement: "",
    logoDay: "",
    logoNight: "",
    favicon: "",
    iconMedium: "",
    iconLarge: ""
  },
  page: { albumApiURL: "", defaultThumbParam: "", defaultBigParam: "" },
  file: {
    uploadAllowedExtensions: "",
    uploadDeniedExtensions: "",
    enableVipsGenerator: false,
    vipsPath: "vips",
    vipsMaxFileSize: "0",
    vipsSupportedExts: "",
    enableMusicCoverGenerator: true,
    musicCoverMaxFileSize: "0",
    musicCoverSupportedExts: "mp3,m4a,ogg,flac",
    enableFfmpegGenerator: false,
    ffmpegPath: "ffmpeg",
    ffmpegMaxFileSize: "0",
    ffmpegSupportedExts: "",
    ffmpegCaptureTime: "00:00:01.00",
    enableBuiltinGenerator: true,
    builtinMaxFileSize: "0",
    builtinDirectServeExts: "avif,webp",
    queueThumbConcurrency: 15,
    queueThumbMaxExecTime: 300,
    queueThumbBackoffFactor: 2,
    queueThumbMaxBackoff: 60,
    queueThumbMaxRetries: 3,
    queueThumbRetryDelay: 5,
    enableExifExtractor: true,
    exifMaxSizeLocal: "0",
    exifMaxSizeRemote: "0",
    exifUseBruteForce: false,
    enableMusicExtractor: true,
    musicMaxSizeLocal: "0",
    musicMaxSizeRemote: "0"
  },
  frontDesk: {
    home: {
      siteOwnerName: "",
      siteOwnerEmail: "",
      footerOwnerName: "",
      footerOwnerSince: "",
      footerRuntimeEnable: false,
      footerRuntimeLaunchTime: "",
      footerRuntimeWorkImg: "",
      footerRuntimeWorkDesc: "",
      footerRuntimeOffDutyImg: "",
      footerRuntimeOffDutyDesc: "",
      footerSocialBarCenterImg: "",
      footerListRandomFriends: "0",
      footerBarAuthorLink: "",
      footerBarCCLink: "",
      footerBadgeJSON: "[]",
      footerSocialBarLeftJSON: "[]",
      footerSocialBarRightJSON: "[]",
      footerListJSON: "[]",
      footerBarLinkListJSON: "[]",
      menuJSON: "[]",
      navTravel: false,
      navClock: false,
      navMenuItemsJSON: "[]"
    }
  }
});

const formToKeysMap: Record<FormKeys, string> = {
  siteName: constant.KeyAppName,
  subTitle: constant.KeySubTitle,
  siteDescription: constant.KeySiteDescription,
  primaryUrl: constant.KeySiteURL,
  albumApiURL: constant.KeyApiURL,
  defaultThumbParam: constant.KeyDefaultThumbParam,
  defaultBigParam: constant.KeyDefaultBigParam,
  footerCode: constant.KeyFooterCode,
  announcement: constant.KeySiteAnnouncement,
  logoDay: constant.KeyLogoHorizontalDay,
  logoNight: constant.KeyLogoHorizontalNight,
  favicon: constant.KeyIconURL,
  iconMedium: constant.KeyLogoURL192,
  iconLarge: constant.KeyLogoURL512,
  siteOwnerName: constant.KeyFrontDeskSiteOwnerName,
  siteOwnerEmail: constant.KeyFrontDeskSiteOwnerEmail,
  footerOwnerName: constant.KeyFooterOwnerName,
  footerOwnerSince: constant.KeyFooterOwnerSince,
  footerRuntimeEnable: constant.KeyFooterRuntimeEnable,
  footerRuntimeLaunchTime: constant.KeyFooterRuntimeLaunchTime,
  footerRuntimeWorkImg: constant.KeyFooterRuntimeWorkImg,
  footerRuntimeWorkDesc: constant.KeyFooterRuntimeWorkDesc,
  footerRuntimeOffDutyImg: constant.KeyFooterRuntimeOffDutyImg,
  footerRuntimeOffDutyDesc: constant.KeyFooterRuntimeOffDutyDesc,
  footerSocialBarCenterImg: constant.KeyFooterSocialBarCenterImg,
  footerListRandomFriends: constant.KeyFooterListRandomFriends,
  footerBarAuthorLink: constant.KeyFooterBarAuthorLink,
  footerBarCCLink: constant.KeyFooterBarCCLink,
  footerBadgeJSON: constant.KeyFooterBadgeJSON,
  footerSocialBarLeftJSON: constant.KeyFooterSocialBarLeftJSON,
  footerSocialBarRightJSON: constant.KeyFooterSocialBarRightJSON,
  footerListJSON: constant.KeyFooterListJSON,
  footerBarLinkListJSON: constant.KeyFooterBarLinkListJSON,
  menuJSON: constant.KeyHeaderMenu,
  navTravel: constant.KeyHeaderNavTravel,
  navClock: constant.KeyHeaderNavClock,
  navMenuItemsJSON: constant.KeyHeaderNavMenu,
  uploadAllowedExtensions: constant.KeyUploadAllowedExtensions,
  uploadDeniedExtensions: constant.KeyUploadDeniedExtensions,
  enableVipsGenerator: constant.KeyEnableVipsGenerator,
  vipsPath: constant.KeyVipsPath,
  vipsMaxFileSize: constant.KeyVipsMaxFileSize,
  vipsSupportedExts: constant.KeyVipsSupportedExts,
  enableMusicCoverGenerator: constant.KeyEnableMusicCoverGenerator,
  musicCoverMaxFileSize: constant.KeyMusicCoverMaxFileSize,
  musicCoverSupportedExts: constant.KeyMusicCoverSupportedExts,
  enableFfmpegGenerator: constant.KeyEnableFfmpegGenerator,
  ffmpegPath: constant.KeyFfmpegPath,
  ffmpegMaxFileSize: constant.KeyFfmpegMaxFileSize,
  ffmpegSupportedExts: constant.KeyFfmpegSupportedExts,
  ffmpegCaptureTime: constant.KeyFfmpegCaptureTime,
  enableBuiltinGenerator: constant.KeyEnableBuiltinGenerator,
  builtinMaxFileSize: constant.KeyBuiltinMaxFileSize,
  builtinDirectServeExts: constant.KeyBuiltinDirectServeExts,
  queueThumbConcurrency: constant.KeyQueueThumbConcurrency,
  queueThumbMaxExecTime: constant.KeyQueueThumbMaxExecTime,
  queueThumbBackoffFactor: constant.KeyQueueThumbBackoffFactor,
  queueThumbMaxBackoff: constant.KeyQueueThumbMaxBackoff,
  queueThumbMaxRetries: constant.KeyQueueThumbMaxRetries,
  queueThumbRetryDelay: constant.KeyQueueThumbRetryDelay,
  enableExifExtractor: constant.KeyEnableExifExtractor,
  exifMaxSizeLocal: constant.KeyExifMaxSizeLocal,
  exifMaxSizeRemote: constant.KeyExifMaxSizeRemote,
  exifUseBruteForce: constant.KeyExifUseBruteForce,
  enableMusicExtractor: constant.KeyEnableMusicExtractor,
  musicMaxSizeLocal: constant.KeyMusicMaxSizeLocal,
  musicMaxSizeRemote: constant.KeyMusicMaxSizeRemote
};

const allKeys = Object.values(formToKeysMap);

const toBoolean = (val: any) => val === "true" || val === true;

const getNestedValue = (obj: any, path: string): any => {
  if (!path || !obj) return undefined;
  if (!path.includes(".")) return obj[path];
  return path
    .split(".")
    .reduce(
      (o, key) => (o && typeof o === "object" && key in o ? o[key] : undefined),
      obj
    );
};

watch(
  () => siteConfigStore.siteConfig,
  newSettings => {
    if (!newSettings || Object.keys(newSettings).length === 0) return;

    Object.keys(formToKeysMap).forEach(formKeyStr => {
      const formKey = formKeyStr as FormKeys;
      const backendKey = formToKeysMap[formKey];
      const value = getNestedValue(newSettings, backendKey);

      let targetForm: any;
      if (formKey in form.site) targetForm = form.site;
      else if (formKey in form.page) targetForm = form.page;
      else if (formKey in form.file) targetForm = form.file;
      else if (formKey in form.frontDesk.home) targetForm = form.frontDesk.home;

      if (targetForm && value !== undefined && value !== null) {
        if (typeof targetForm[formKey] === "boolean") {
          targetForm[formKey] = toBoolean(value);
        } else if (formKey.toUpperCase().endsWith("JSON")) {
          targetForm[formKey] =
            typeof value === "string" ? value : JSON.stringify(value, null, 2);
        } else if (
          formKey === "queueThumbConcurrency" ||
          formKey === "queueThumbMaxExecTime" ||
          formKey === "queueThumbBackoffFactor" ||
          formKey === "queueThumbMaxBackoff" ||
          formKey === "queueThumbMaxRetries" ||
          formKey === "queueThumbRetryDelay"
        ) {
          // 转换成数字类型
          targetForm[formKey] = Number(value);
        } else {
          targetForm[formKey] = String(value);
        }
      }
    });
  },
  { deep: true, immediate: true }
);

onMounted(() => {
  siteConfigStore.fetchSystemSettings(allKeys);
});

const handleSave = async () => {
  const originalSettings = siteConfigStore.siteConfig;
  const settingsToUpdate: Record<string, any> = {};
  const combinedForm = {
    ...form.site,
    ...form.page,
    ...form.file,
    ...form.frontDesk.home
  };

  (Object.keys(formToKeysMap) as FormKeys[]).forEach(formKey => {
    const backendKey = formToKeysMap[formKey];
    if (!backendKey) return;

    const currentValue = combinedForm[formKey];
    const originalValue = getNestedValue(originalSettings, backendKey);

    // Normalize original value for comparison
    const normalizedOriginalValue =
      originalValue === null || originalValue === undefined
        ? ""
        : String(originalValue);

    let currentStringValue = String(currentValue);
    let originalStringValue = String(originalValue ?? "");

    if (formKey.toUpperCase().endsWith("JSON")) {
      try {
        const parsedCurrent = JSON.stringify(
          JSON.parse(currentStringValue || "[]")
        );
        const originalJsonString =
          typeof originalValue === "object" && originalValue !== null
            ? JSON.stringify(originalValue)
            : originalValue || "[]";
        const parsedOriginal = JSON.stringify(JSON.parse(originalJsonString));

        if (parsedCurrent !== parsedOriginal) {
          settingsToUpdate[backendKey] = currentStringValue;
        }
      } catch (e) {
        if (currentStringValue !== originalStringValue) {
          settingsToUpdate[backendKey] = currentStringValue;
        }
      }
    } else if (typeof combinedForm[formKey] === "boolean") {
      if (String(currentValue) !== String(toBoolean(originalValue))) {
        settingsToUpdate[backendKey] = String(currentValue);
      }
    } else if (currentStringValue !== normalizedOriginalValue) {
      settingsToUpdate[backendKey] = currentStringValue;
    }
  });

  if (Object.keys(settingsToUpdate).length === 0) {
    ElMessage.info("没有检测到任何更改。");
    return;
  }

  try {
    await siteConfigStore.saveSystemSettings(settingsToUpdate);
  } catch (error: any) {
    ElMessage.error(`保存失败: ${error.message || String(error)}`);
  }
};
</script>

<style scoped lang="scss">
.setting-form {
  max-width: 800px;
}
.save-button-container {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>
