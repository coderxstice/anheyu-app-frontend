/*
 * @Description: 配置导入导出 API
 * @Author: 安知鱼
 * @Date: 2025-10-19
 */
import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";

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
