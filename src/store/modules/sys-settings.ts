/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-21 18:29:45
 * @LastEditTime: 2025-06-21 18:36:27
 * @LastEditors: 安知鱼
 */
// src/store/modules/sys-settings.ts

import { defineStore } from "pinia";
import { ref } from "vue";
import {
  getSettingsApi,
  updateSettingsApi,
  type SettingsMap
} from "@/api/sys-settings";

export const useSettingsStore = defineStore("sys-settings", () => {
  // State: 存储从后端获取的配置
  const settings = ref<SettingsMap>({});
  const loading = ref(false);

  // Action: 根据指定的键获取配置
  async function fetchSettings(keys: string[]) {
    try {
      loading.value = true;
      const res = await getSettingsApi(keys);
      if (res.code === 200) {
        // 将获取到的新配置合并到现有状态中
        settings.value = { ...settings.value, ...res.data };
      } else {
        return Promise.reject(res.message);
      }
    } catch (error) {
      return Promise.reject(error);
    } finally {
      loading.value = false;
    }
  }

  // Action: 保存（更新）配置
  async function saveSettings(settingsToUpdate: SettingsMap) {
    try {
      loading.value = true;
      const res = await updateSettingsApi(settingsToUpdate);
      if (res.code === 200) {
        // 更新成功后，也更新本地的状态
        settings.value = { ...settings.value, ...settingsToUpdate };
        return Promise.resolve();
      } else {
        return Promise.reject(res.message);
      }
    } catch (error) {
      return Promise.reject(error);
    } finally {
      loading.value = false;
    }
  }

  return {
    settings,
    loading,
    fetchSettings,
    saveSettings
  };
});
