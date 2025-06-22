<template>
  <el-card v-loading="siteConfigStore.loading" shadow="never">
    <el-tabs v-model="activeName" class="setting-tabs">
      <el-tab-pane label="站点信息" name="siteConfig">
        <el-form :model="form" label-position="top" class="setting-form">
          <BaseInfoForm v-model="form.site" />
          <IconSettingsForm v-model="form.site" />
        </el-form>
      </el-tab-pane>

      <!-- <el-tab-pane label="用户会话" name="userSession">
        <el-form :model="form" label-position="top" class="setting-form">
          <UserSessionForm v-model="form.user" />
        </el-form>
      </el-tab-pane> -->
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

import BaseInfoForm from "./components/BaseInfoForm.vue";
import IconSettingsForm from "./components/IconSettingsForm.vue";
// import UserSessionForm from "./components/UserSessionForm.vue";

// 保留了这些接口定义，它们依然有用
export interface SiteInfo {
  siteName: string;
  siteDescription: string;
  primaryUrl: string;
  albumApiURL: string;
  footerCode: string;
  announcement: string;
  logoDay: string;
  logoNight: string;
  favicon: string;
  iconMedium: string;
  iconLarge: string;
}
export interface UserSessionInfo {
  enableRegistration: boolean;
}
export interface SettingsForm {
  site: SiteInfo;
  user: UserSessionInfo;
}

const activeName = "siteConfig";
// 现在使用统一的 siteConfigStore
const siteConfigStore = useSiteConfigStore();

const form = reactive<SettingsForm>({
  site: {
    siteName: "",
    siteDescription: "",
    primaryUrl: "",
    albumApiURL: "",
    footerCode: "",
    announcement: "",
    logoDay: "",
    logoNight: "",
    favicon: "",
    iconMedium: "",
    iconLarge: ""
  },
  user: {
    enableRegistration: false
  }
});

// 表单字段到后端键名的映射关系
const formToKeysMap: Record<keyof SiteInfo | keyof UserSessionInfo, string> = {
  siteName: constant.KeyAppName,
  siteDescription: constant.KeySiteDescription,
  primaryUrl: constant.KeySiteURL,
  albumApiURL: constant.KeyApiURL,
  footerCode: constant.KeyFooterCode,
  announcement: constant.KeySiteAnnouncement,
  logoDay: constant.KeyLogoHorizontalDay,
  logoNight: constant.KeyLogoHorizontalNight,
  favicon: constant.KeyIconURL,
  iconMedium: constant.KeyLogoURL192,
  iconLarge: constant.KeyLogoURL512,
  enableRegistration: constant.KeyEnableUserActivation
};

const allKeys = Object.values(formToKeysMap);

// 将 watch 的目标改为了 siteConfigStore.siteConfig
// 并增加了 immediate: true，以便在组件加载时立即用 store 中的数据填充表单
watch(
  () => siteConfigStore.siteConfig,
  newSettings => {
    if (!newSettings) return;

    form.site.siteName = newSettings[constant.KeyAppName] || "";
    form.site.siteDescription = newSettings[constant.KeySiteDescription] || "";
    form.site.primaryUrl = newSettings[constant.KeySiteURL] || "";
    form.site.albumApiURL = newSettings[constant.KeyApiURL] || "";
    form.site.footerCode = newSettings[constant.KeyFooterCode] || "";
    form.site.announcement = newSettings[constant.KeySiteAnnouncement] || "";
    form.site.logoDay = newSettings[constant.KeyLogoHorizontalDay] || "";
    form.site.logoNight = newSettings[constant.KeyLogoHorizontalNight] || "";
    form.site.favicon = newSettings[constant.KeyIconURL] || "";
    form.site.iconMedium = newSettings[constant.KeyLogoURL192] || "";
    form.site.iconLarge = newSettings[constant.KeyLogoURL512] || "";
    form.user.enableRegistration =
      newSettings[constant.KeyEnableUserActivation] === "true";
  },
  { deep: true, immediate: true }
);

onMounted(() => {
  // 当组件挂载时，调用新的 action 来获取本页面所需的详细配置
  siteConfigStore.fetchSystemSettings(allKeys);
});

const handleSave = async () => {
  const settingsToUpdate: Record<string, string> = {};
  const combinedForm = { ...form.site, ...form.user };

  (Object.keys(formToKeysMap) as Array<keyof typeof combinedForm>).forEach(
    formKey => {
      const backendKey = formToKeysMap[formKey];
      let value = combinedForm[formKey];

      if (typeof value === "boolean") {
        value = value ? "true" : "false";
      }

      settingsToUpdate[backendKey] = value;
    }
  );

  try {
    // 调用了新的保存 action，它会处理后续的 API 请求、状态更新和缓存
    await siteConfigStore.saveSystemSettings(settingsToUpdate);
    // 成功消息现在由 store 内部处理，这里也可以保留
    // ElMessage.success("设置已成功保存！");
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
