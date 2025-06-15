// src/api/wallpaper.ts
import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";

// 导入 Pinia store
import { useSiteConfigStore } from "@/store/modules/siteConfig";

type Result = {
  success: boolean;
  data: {
    list: Array<any>;
    total: number;
    pageSize: number;
    pageNum: number;
  };
  code: number;
};

type addResult = {
  success: boolean;
  message: string;
  code: number;
};

/**
 * @description 获取动态 API 基础 URL。
 * 优先使用后端配置的 API_URL，如果不存在则回退到默认的 baseUrlApi。
 * @param endpointPath API 路径
 * @returns 完整的请求 URL。
 */
const getDynamicApiUrl = (endpointPath: string): string => {
  const siteConfigStore = useSiteConfigStore();
  const backendConfiguredApiUrl = siteConfigStore.getWallpaperBackendApiUrl;

  if (backendConfiguredApiUrl) {
    // 假设后端配置的 API_URL 已经包含基础路径，这里只需拼接具体接口路径
    // 例如：backendConfiguredApiUrl = "https://album.anheyu.com/"
    // endpointPath = "api/public/wallpapers"
    // 最终是 "https://album.anheyu.com/api/public/wallpapers"
    console.log(
      `使用后端配置的API地址: ${backendConfiguredApiUrl}${endpointPath}`
    );
    return `${backendConfiguredApiUrl}${endpointPath}`;
  } else {
    console.warn(
      `未能获取到后端配置的 API 地址 (API_URL)，回退到使用默认 baseUrlApi(${endpointPath})。`
    );
    return baseUrlApi(endpointPath);
  }
};

// 获取相册图片列表
export const getWallpapertList = (params: any) => {
  return http.request<Result>("get", baseUrlApi("wallpapers"), {
    params
  });
};

// 删除相册图片
export const deleteWallpaper = (data: { id: string }) => {
  return http.request<addResult>("delete", baseUrlApi(`wallpapers/${data.id}`));
};

// 更新相册图片信息
export const updateWallpaper = (data: any) => {
  return http.request<addResult>("put", baseUrlApi(`wallpapers/${data.id}`), {
    data
  });
};

// 添加相册图片
export const addWallpapert = (data: any) => {
  return http.request<addResult>("post", baseUrlApi("wallpapers"), { data });
};

// 获取公共相册图片列表
export const publicWallpapert = (params: any) => {
  const requestUrl = getDynamicApiUrl("api/public/wallpapers"); // 使用抽离的逻辑

  // 执行请求
  return http.request<Result>("get", requestUrl, {
    params
  });
};

// 更新相册图片统计信息 (浏览量、下载量等)
export const updateWallpaperStat = (params: { id: string; type: string }) => {
  const requestUrl = getDynamicApiUrl(`api/public/stat/${params.id}`); // 使用抽离的逻辑

  return http.request<Result>(
    "put",
    requestUrl, // 使用动态生成的 requestUrl
    null,
    {
      params: {
        type: params.type
      }
    }
  );
};
