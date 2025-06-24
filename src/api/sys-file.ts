/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-21 18:30:32
 * @LastEditTime: 2025-06-24 14:18:18
 * @LastEditors: 安知鱼
 */
// src/api/sys-File.ts

import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";
import type { FileItem } from "@/store/types";

// 定义后端返回的数据结构
export type FileMap = Record<string, string>;

export interface FileResult {
  code: number;
  message: string;
  data: FileMap;
}

/**
 * 根据键名批量获取系统配置
 * @param keys - 需要获取的配置键名数组
 */
export const getFileApi = (keys: string[]) => {
  return http.request<FileResult>("post", baseUrlApi("File/get-by-keys"), {
    data: { keys }
  });
};

/**
 * 批量更新系统配置
 * @param File - 需要更新的配置项 (键值对)
 */
export const updateFileApi = (File: FileMap) => {
  return http.request<FileResult>("post", baseUrlApi("File/update"), {
    data: File
  });
};

// 模拟文件系统的数据库
const allFiles: FileItem[] = [
  {
    id: "1",
    name: "A",
    type: "folder",
    size: 0,
    modified: Date.now() - 3 * 24 * 3600 * 1000,
    path: "/"
  },
  {
    id: "2",
    name: "das",
    type: "file",
    size: 0,
    modified: Date.now() - 3 * 24 * 3600 * 1000,
    path: "/",
    extension: "das"
  },
  {
    id: "3",
    name: "1.py",
    type: "file",
    size: 1024,
    modified: Date.now() - 3 * 3600 * 1000,
    path: "/",
    extension: "py"
  },
  {
    id: "4",
    name: "B",
    type: "folder",
    size: 0,
    modified: Date.now() - 2 * 24 * 3600 * 1000,
    path: "/"
  },
  {
    id: "5",
    name: "secret-project",
    type: "folder",
    size: 0,
    modified: Date.now() - 5 * 3600 * 1000,
    path: "/A"
  },
  {
    id: "6",
    name: "requirements.txt",
    type: "file",
    size: 512,
    modified: Date.now() - 10 * 60 * 1000,
    path: "/A",
    extension: "txt"
  },
  {
    id: "7",
    name: "image.png",
    type: "file",
    size: 204800,
    modified: Date.now() - 8 * 3600 * 1000,
    path: "/A/secret-project",
    extension: "png"
  },
  {
    id: "8",
    name: "video.mp4",
    type: "file",
    size: 1024 * 1024 * 5,
    modified: Date.now() - 30 * 60 * 1000,
    path: "/B",
    extension: "mp4"
  }
];

let nextId = 9;

// 模拟API调用
export const fetchFilesByPath = (path: string): Promise<FileItem[]> => {
  console.log(`Fetching files for path: ${path}`);
  return new Promise(resolve => {
    setTimeout(() => {
      const files = allFiles.filter(f => f.path === path);
      resolve(JSON.parse(JSON.stringify(files)));
    }, 300); // 模拟网络延迟
  });
};

// 模拟文件上传
export const uploadFile = (file: File, path: string): Promise<FileItem> => {
  return new Promise(resolve => {
    // 模拟上传过程
    setTimeout(() => {
      const newFile: FileItem = {
        id: String(nextId++),
        name: file.name,
        type: "file",
        size: file.size,
        modified: Date.now(),
        path: path,
        extension: file.name.split(".").pop() || ""
      };
      allFiles.push(newFile);
      resolve(newFile);
    }, 1500); // 模拟上传耗时
  });
};
