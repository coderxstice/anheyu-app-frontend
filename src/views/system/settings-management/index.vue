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

// [MODIFIED] Import types from the new central location
import type {
  SettingsForm,
  SiteInfo,
  PageSittingInfo,
  FileSettingsInfo
} from "./type";

import BaseInfoForm from "./components/BaseInfoForm.vue";
import IconSettingsForm from "./components/IconSettingsForm.vue";
import PageSittingForm from "./components/PageSittingForm.vue";
import FileSettings from "./components/fileSetting/FileSettingsForm.vue";

// [REMOVED] Interface definitions are now in ./type/index.ts

let activeName = "siteConfig";
const siteConfigStore = useSiteConfigStore();

const form = reactive<SettingsForm>({
  site: {
    siteName: "",
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
  page: {
    albumApiURL: "",
    defaultThumbParam: "",
    defaultBigParam: ""
  },
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
  }
});

const formToKeysMap: Record<
  keyof SiteInfo | keyof PageSittingInfo | keyof FileSettingsInfo,
  string
> = {
  siteName: constant.KeyAppName,
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
  // File Upload
  uploadAllowedExtensions: constant.KeyUploadAllowedExtensions,
  uploadDeniedExtensions: constant.KeyUploadDeniedExtensions,
  // VIPS
  enableVipsGenerator: constant.KeyEnableVipsGenerator,
  vipsPath: constant.KeyVipsPath,
  vipsMaxFileSize: constant.KeyVipsMaxFileSize,
  vipsSupportedExts: constant.KeyVipsSupportedExts,
  // Music Cover
  enableMusicCoverGenerator: constant.KeyEnableMusicCoverGenerator,
  musicCoverMaxFileSize: constant.KeyMusicCoverMaxFileSize,
  musicCoverSupportedExts: constant.KeyMusicCoverSupportedExts,
  // FFmpeg
  enableFfmpegGenerator: constant.KeyEnableFfmpegGenerator,
  ffmpegPath: constant.KeyFfmpegPath,
  ffmpegMaxFileSize: constant.KeyFfmpegMaxFileSize,
  ffmpegSupportedExts: constant.KeyFfmpegSupportedExts,
  ffmpegCaptureTime: constant.KeyFfmpegCaptureTime,
  // Built-in
  enableBuiltinGenerator: constant.KeyEnableBuiltinGenerator,
  builtinMaxFileSize: constant.KeyBuiltinMaxFileSize,
  builtinDirectServeExts: constant.KeyBuiltinDirectServeExts,
  // Queue
  queueThumbConcurrency: constant.KeyQueueThumbConcurrency,
  queueThumbMaxExecTime: constant.KeyQueueThumbMaxExecTime,
  queueThumbBackoffFactor: constant.KeyQueueThumbBackoffFactor,
  queueThumbMaxBackoff: constant.KeyQueueThumbMaxBackoff,
  queueThumbMaxRetries: constant.KeyQueueThumbMaxRetries,
  queueThumbRetryDelay: constant.KeyQueueThumbRetryDelay,
  // EXIF
  enableExifExtractor: constant.KeyEnableExifExtractor,
  exifMaxSizeLocal: constant.KeyExifMaxSizeLocal,
  exifMaxSizeRemote: constant.KeyExifMaxSizeRemote,
  exifUseBruteForce: constant.KeyExifUseBruteForce,
  // Music Meta
  enableMusicExtractor: constant.KeyEnableMusicExtractor,
  musicMaxSizeLocal: constant.KeyMusicMaxSizeLocal,
  musicMaxSizeRemote: constant.KeyMusicMaxSizeRemote
};

const allKeys = Object.values(formToKeysMap);

const toBoolean = (val: string | undefined) => val === "true";

watch(
  () => siteConfigStore.siteConfig,
  newSettings => {
    if (!newSettings) return;

    // Site Info
    form.site.siteName = newSettings[constant.KeyAppName] || "";
    form.site.siteDescription = newSettings[constant.KeySiteDescription] || "";
    form.site.primaryUrl = newSettings[constant.KeySiteURL] || "";
    form.site.footerCode = newSettings[constant.KeyFooterCode] || "";
    form.site.announcement = newSettings[constant.KeySiteAnnouncement] || "";
    form.site.logoDay = newSettings[constant.KeyLogoHorizontalDay] || "";
    form.site.logoNight = newSettings[constant.KeyLogoHorizontalNight] || "";
    form.site.favicon = newSettings[constant.KeyIconURL] || "";
    form.site.iconMedium = newSettings[constant.KeyLogoURL192] || "";
    form.site.iconLarge = newSettings[constant.KeyLogoURL512] || "";

    // Page Settings
    form.page.albumApiURL = newSettings[constant.KeyApiURL] || "";
    form.page.defaultThumbParam =
      newSettings[constant.KeyDefaultThumbParam] || "";
    form.page.defaultBigParam = newSettings[constant.KeyDefaultBigParam] || "";

    // File Settings
    form.file.uploadAllowedExtensions =
      newSettings[constant.KeyUploadAllowedExtensions] || "";
    form.file.uploadDeniedExtensions =
      newSettings[constant.KeyUploadDeniedExtensions] || "";

    form.file.enableVipsGenerator = toBoolean(
      newSettings[constant.KeyEnableVipsGenerator]
    );
    form.file.vipsPath = newSettings[constant.KeyVipsPath] || "";
    form.file.vipsMaxFileSize = newSettings[constant.KeyVipsMaxFileSize] || "";
    form.file.vipsSupportedExts =
      newSettings[constant.KeyVipsSupportedExts] || "";

    form.file.enableMusicCoverGenerator = toBoolean(
      newSettings[constant.KeyEnableMusicCoverGenerator]
    );
    form.file.musicCoverMaxFileSize =
      newSettings[constant.KeyMusicCoverMaxFileSize] || "";
    form.file.musicCoverSupportedExts =
      newSettings[constant.KeyMusicCoverSupportedExts] || "";

    form.file.enableFfmpegGenerator = toBoolean(
      newSettings[constant.KeyEnableFfmpegGenerator]
    );
    form.file.ffmpegPath = newSettings[constant.KeyFfmpegPath] || "";
    form.file.ffmpegMaxFileSize =
      newSettings[constant.KeyFfmpegMaxFileSize] || "";
    form.file.ffmpegSupportedExts =
      newSettings[constant.KeyFfmpegSupportedExts] || "";
    form.file.ffmpegCaptureTime =
      newSettings[constant.KeyFfmpegCaptureTime] || "";

    form.file.enableBuiltinGenerator = toBoolean(
      newSettings[constant.KeyEnableBuiltinGenerator]
    );
    form.file.builtinMaxFileSize =
      newSettings[constant.KeyBuiltinMaxFileSize] || "";
    form.file.builtinDirectServeExts =
      newSettings[constant.KeyBuiltinDirectServeExts] || "";

    form.file.queueThumbConcurrency =
      Number(newSettings[constant.KeyQueueThumbConcurrency]) || 15;
    form.file.queueThumbMaxExecTime =
      Number(newSettings[constant.KeyQueueThumbMaxExecTime]) || 300;
    form.file.queueThumbBackoffFactor =
      Number(newSettings[constant.KeyQueueThumbBackoffFactor]) || 2;
    form.file.queueThumbMaxBackoff =
      Number(newSettings[constant.KeyQueueThumbMaxBackoff]) || 60;
    form.file.queueThumbMaxRetries =
      Number(newSettings[constant.KeyQueueThumbMaxRetries]) || 3;
    form.file.queueThumbRetryDelay =
      Number(newSettings[constant.KeyQueueThumbRetryDelay]) || 5;

    form.file.enableExifExtractor = toBoolean(
      newSettings[constant.KeyEnableExifExtractor]
    );
    form.file.exifMaxSizeLocal =
      newSettings[constant.KeyExifMaxSizeLocal] || "";
    form.file.exifMaxSizeRemote =
      newSettings[constant.KeyExifMaxSizeRemote] || "";
    form.file.exifUseBruteForce = toBoolean(
      newSettings[constant.KeyExifUseBruteForce]
    );

    form.file.enableMusicExtractor = toBoolean(
      newSettings[constant.KeyEnableMusicExtractor]
    );
    form.file.musicMaxSizeLocal =
      newSettings[constant.KeyMusicMaxSizeLocal] || "";
    form.file.musicMaxSizeRemote =
      newSettings[constant.KeyMusicMaxSizeRemote] || "";
  },
  { deep: true, immediate: true }
);

onMounted(() => {
  siteConfigStore.fetchSystemSettings(allKeys);
});

const handleSave = async () => {
  const settingsToUpdate: Record<string, string> = {};
  const combinedForm = { ...form.site, ...form.page, ...form.file };

  (Object.keys(formToKeysMap) as Array<keyof typeof combinedForm>).forEach(
    formKey => {
      const backendKey = formToKeysMap[formKey];
      if (backendKey === undefined) return;

      const value = combinedForm[formKey];

      // Backend expects all values as strings
      settingsToUpdate[backendKey] = String(value ?? "");
    }
  );

  try {
    await siteConfigStore.saveSystemSettings(settingsToUpdate);
    // Success message is handled by the store
  } catch (error) {
    ElMessage.error(`保存失败: ${error}`);
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
