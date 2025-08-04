/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-04 14:16:51
 * @LastEditTime: 2025-08-04 14:16:56
 * @LastEditors: 安知鱼
 */
// src/views/system/settings-management/utils.ts
import { set } from "lodash-es";
import type { SettingDescriptor } from "./settings.descriptor";

/**
 * 根据描述符列表创建响应式的表单初始状态
 */
export function createInitialFormState(
  descriptors: SettingDescriptor[]
): Record<string, any> {
  const state = {};
  for (const desc of descriptors) {
    // 使用 lodash.set 安全地创建嵌套对象
    set(state, desc.frontendPath, desc.defaultValue);
  }
  return state;
}

/**
 * 根据描述符列表创建一个从 frontendPath 到完整描述符的 Map，方便快速查找
 */
export function createDescriptorMap(
  descriptors: SettingDescriptor[]
): Map<string, SettingDescriptor> {
  const map = new Map<string, SettingDescriptor>();
  for (const desc of descriptors) {
    map.set(desc.frontendPath, desc);
  }
  return map;
}

/**
 * 将从后端获取的值解析为前端表单所需类型
 */
export function parseBackendValue(value: any, type: SettingDescriptor["type"]) {
  if (value === null || value === undefined) {
    return value;
  }

  switch (type) {
    case "boolean":
      return value === "true" || value === true;
    case "number":
      return Number(value);
    case "json":
      if (typeof value === "object") return value;
      try {
        return JSON.parse(value);
      } catch {
        return Array.isArray(value) ? [] : {};
      }
    case "string":
    default:
      return String(value);
  }
}

/**
 * 将前端表单中的值格式化为待保存的字符串
 */
export function formatValueForSave(
  value: any,
  type: SettingDescriptor["type"]
): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (type === "json") {
    return JSON.stringify(value);
  }
  return String(value);
}
