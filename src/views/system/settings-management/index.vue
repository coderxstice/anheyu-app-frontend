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
import PageSittingForm from "./components/PageSittingForm.vue";

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
export interface PageSittingInfo {
  albumApiURL: string;
  defaultThumbParam?: string;
  defaultBigParam?: string;
}
export interface SettingsForm {
  site: SiteInfo;
  page: PageSittingInfo;
}

let activeName = "siteConfig";
// 现在使用统一的 siteConfigStore
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
  }
});

// 表单字段到后端键名的映射关系
const formToKeysMap: Record<keyof SiteInfo | keyof PageSittingInfo, string> = {
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
  iconLarge: constant.KeyLogoURL512
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
    form.site.footerCode = newSettings[constant.KeyFooterCode] || "";
    form.site.announcement = newSettings[constant.KeySiteAnnouncement] || "";
    form.site.logoDay = newSettings[constant.KeyLogoHorizontalDay] || "";
    form.site.logoNight = newSettings[constant.KeyLogoHorizontalNight] || "";
    form.site.favicon = newSettings[constant.KeyIconURL] || "";
    form.site.iconMedium = newSettings[constant.KeyLogoURL192] || "";
    form.site.iconLarge = newSettings[constant.KeyLogoURL512] || "";

    form.page.albumApiURL = newSettings[constant.KeyApiURL] || "";
    form.page.defaultThumbParam =
      newSettings[constant.KeyDefaultThumbParam] || "";
    form.page.defaultBigParam = newSettings[constant.KeyDefaultBigParam] || "";
  },
  { deep: true, immediate: true }
);

onMounted(() => {
  // 当组件挂载时，调用新的 action 来获取本页面所需的详细配置
  siteConfigStore.fetchSystemSettings(allKeys);
});

const handleSave = async () => {
  const settingsToUpdate: Record<string, string> = {};
  const combinedForm = { ...form.site, ...form.page };

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
