/*
 * @Description: 配置导入导出 & 备份管理 API
 * @Author: 安知鱼
 * @Date: 2025-10-19
 */
import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";

// ========== 备份信息类型 ==========
export interface BackupInfo {
  filename: string;
  size: number;
  created_at: string;
  description: string;
  is_auto: boolean;
}

// ========== 导入导出 API ==========

/**
 * 导出配置文件
 */
export const exportConfig = () => {
  return http.request<Blob>("get", baseUrlApi("config/export"), {
    responseType: "blob"
  });
};

/**
 * 导入配置文件
 * @param file 配置文件
 */
export const importConfig = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  return http.request("post", baseUrlApi("config/import"), {
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};

// ========== 备份管理 API ==========

/**
 * 获取备份列表
 */
export const listBackups = () => {
  return http.request<{ data: BackupInfo[] }>(
    "get",
    baseUrlApi("config/backup/list")
  );
};

/**
 * 创建备份
 * @param description 备份描述
 */
export const createBackup = (description: string) => {
  return http.request<{ data: BackupInfo }>(
    "post",
    baseUrlApi("config/backup/create"),
    {
      data: { description }
    }
  );
};

/**
 * 恢复备份
 * @param filename 备份文件名
 */
export const restoreBackup = (filename: string) => {
  return http.request("post", baseUrlApi("config/backup/restore"), {
    data: { filename }
  });
};

/**
 * 删除备份
 * @param filename 备份文件名
 */
export const deleteBackup = (filename: string) => {
  return http.request("post", baseUrlApi("config/backup/delete"), {
    data: { filename }
  });
};

/**
 * 清理旧备份
 * @param keepCount 保留的备份数量
 */
export const cleanOldBackups = (keepCount: number) => {
  return http.request("post", baseUrlApi("config/backup/clean"), {
    data: { keep_count: keepCount }
  });
};
