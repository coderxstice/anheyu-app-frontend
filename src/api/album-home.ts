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

export const getWallpapertList = params => {
  return http.request<Result>("get", baseUrlApi("wallpapers"), {
    params
  });
};

export const deleteWallpaper = data => {
  return http.request<addResult>("delete", baseUrlApi(`wallpapers/${data.id}`));
};

export const updateWallpaper = data => {
  return http.request<addResult>("put", baseUrlApi(`wallpapers/${data.id}`), {
    data
  });
};

export const addWallpapert = data => {
  return http.request<addResult>("post", baseUrlApi("wallpapers"), { data });
};

export const publicWallpapert = async params => {
  let requestUrl: string;

  const siteConfigStore = useSiteConfigStore();
  const backendConfiguredApiUrl = siteConfigStore.getWallpaperBackendApiUrl;

  if (backendConfiguredApiUrl) {
    console.log("使用后端配置的API地址获取壁纸:", backendConfiguredApiUrl);
    requestUrl = `${backendConfiguredApiUrl}api/public/wallpapers`;
  } else {
    console.warn(
      "未能获取到后端配置的壁纸 API 地址 (API_URL)，回退到使用默认 baseUrlApi。"
    );
    requestUrl = baseUrlApi("public/wallpapers");
  }

  // 执行请求
  return http.request<Result>("get", requestUrl, {
    params
  });
};

export const updateWallpaperStat = params => {
  return http.request<Result>(
    "put",
    baseUrlApi(`public/stat/${params.id}`),
    null,
    {
      params: {
        type: params.type
      }
    }
  );
};
