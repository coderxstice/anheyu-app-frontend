/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-21 18:30:32
 * @LastEditTime: 2025-06-21 18:55:13
 * @LastEditors: 安知鱼
 */
// src/api/sys-settings.ts

import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";

// 定义后端返回的数据结构
export type SettingsMap = Record<string, string>;

export interface SettingsResult {
  code: number;
  message: string;
  data: SettingsMap;
}

/**
 * 根据键名批量获取系统配置
 * @param keys - 需要获取的配置键名数组
 */
export const getSettingsApi = (keys: string[]) => {
  return http.request<SettingsResult>(
    "post",
    baseUrlApi("settings/get-by-keys"),
    { data: { keys } }
  );
};

/**
 * 批量更新系统配置
 * @param settings - 需要更新的配置项 (键值对)
 */
export const updateSettingsApi = (settings: SettingsMap) => {
  return http.request<SettingsResult>(
    "post",
    baseUrlApi("admin/settings/update"),
    { data: settings }
  );
};
