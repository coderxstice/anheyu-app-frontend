/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-15 11:31:00
 * @LastEditTime: 2025-06-24 14:17:17
 * @LastEditors: 安知鱼
 */
import type { RouteRecordName } from "vue-router";

export type cacheType = {
  mode: string;
  name?: RouteRecordName;
};

export type positionType = {
  startIndex?: number;
  length?: number;
};

export type appType = {
  sidebar: {
    opened: boolean;
    withoutAnimation: boolean;
    // 判断是否手动点击Collapse
    isClickCollapse: boolean;
  };
  layout: string;
  device: string;
  viewportSize: { width: number; height: number };
};

export type multiType = {
  path: string;
  name: string;
  meta: any;
  query?: object;
  params?: object;
};

export type setType = {
  title: string;
  fixedHeader: boolean;
  hiddenSideBar: boolean;
};

export type userType = {
  avatar?: string;
  username?: string;
  nickname?: string;
  roles?: Array<string>;
  // permissions?: Array<string>;
  isRemembered?: boolean;
  loginDay?: number;
};

export interface FileItem {
  id: string;
  name: string;
  type: "folder" | "file";
  size: number;
  modified: number;
  path: string;
  extension?: string;
}

export interface UploadItem {
  id: number;
  name: string;
  size: number;
  status: "uploading" | "success" | "error";
  progress: number;
  file: File;
}
