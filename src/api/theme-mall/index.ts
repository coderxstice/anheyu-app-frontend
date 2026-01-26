/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-09-18 16:28:43
 * @LastEditTime: 2026-01-26 19:50:00
 * @LastEditors: 安知鱼
 */
import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";
import type {
  ThemeListResponse,
  ThemeListParams,
  ThemeUploadResponse,
  ThemeValidationResult,
  Theme,
  ThemeSettingGroup,
  ThemeConfigResponse,
  ThemeConfigSaveRequest,
  SSRThemeInfo,
  SSRThemeInstallRequest,
  SSRThemeStartRequest
} from "./type";

/**
 * 主题商城 API
 */
export const themeMallApi = {
  /**
   * 获取主题列表（调用本地后端API，后端会获取外部主题商城数据）
   */
  getThemes: (params?: ThemeListParams): Promise<ThemeListResponse> => {
    return http.get(baseUrlApi("public/theme/market"), params);
  },

  /**
   * 检查静态模式状态
   */
  checkStaticMode: (): Promise<{
    code: number;
    message: string;
    data: { is_active: boolean };
  }> => {
    return http.get(baseUrlApi("public/theme/static-mode"));
  },

  /**
   * 获取当前主题信息（需要登录）
   */
  getCurrentTheme: (): Promise<{
    code: number;
    message: string;
    data: Theme;
  }> => {
    return http.get(baseUrlApi("theme/current"));
  },

  /**
   * 获取已安装主题列表（需要登录）
   */
  getInstalledThemes: (): Promise<{
    code: number;
    message: string;
    data: Theme[];
  }> => {
    return http.get(baseUrlApi("theme/installed"));
  },

  /**
   * 安装主题（需要登录）
   */
  installTheme: (data: {
    theme_name: string;
    download_url: string;
    theme_market_id?: number;
  }): Promise<{
    code: number;
    message: string;
    data: any;
  }> => {
    return http.post(baseUrlApi("theme/install"), data);
  },

  /**
   * 切换主题（需要登录）
   */
  switchTheme: (data: {
    theme_name: string;
  }): Promise<{
    code: number;
    message: string;
    data: any;
  }> => {
    return http.post(baseUrlApi("theme/switch"), data);
  },

  /**
   * 切换到官方主题（需要登录）
   */
  switchToOfficial: (): Promise<{
    code: number;
    message: string;
    data: any;
  }> => {
    return http.post(baseUrlApi("theme/official"));
  },

  /**
   * 卸载主题（需要登录）
   */
  uninstallTheme: (data: {
    theme_name: string;
  }): Promise<{
    code: number;
    message: string;
    data: any;
  }> => {
    return http.post(baseUrlApi("theme/uninstall"), data);
  },

  /**
   * 上传主题压缩包（需要登录）
   */
  uploadTheme: (
    file: File,
    forceUpdate: boolean = false
  ): Promise<{
    code: number;
    message: string;
    data: ThemeUploadResponse;
  }> => {
    const formData = new FormData();
    formData.append("file", file);
    if (forceUpdate) {
      formData.append("force_update", "true");
    }

    return http.post(baseUrlApi("theme/upload"), formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      } as any
    });
  },

  /**
   * 验证主题压缩包（需要登录）
   */
  validateTheme: (
    file: File
  ): Promise<{
    code: number;
    message: string;
    data: ThemeValidationResult;
  }> => {
    const formData = new FormData();
    formData.append("file", file);

    return http.post(baseUrlApi("theme/validate"), formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      } as any
    });
  },

  // ===== 主题配置相关 API =====

  /**
   * 获取主题配置定义（需要登录）
   * @param themeName 主题名称
   */
  getThemeSettings: (
    themeName: string
  ): Promise<{
    code: number;
    message: string;
    data: ThemeSettingGroup[];
  }> => {
    return http.get(baseUrlApi("theme/settings"), { theme_name: themeName });
  },

  /**
   * 获取用户主题配置（需要登录）
   * @param themeName 主题名称
   */
  getUserThemeConfig: (
    themeName: string
  ): Promise<{
    code: number;
    message: string;
    data: Record<string, any>;
  }> => {
    return http.get(baseUrlApi("theme/config"), { theme_name: themeName });
  },

  /**
   * 保存用户主题配置（需要登录）
   * @param data 主题配置
   */
  saveUserThemeConfig: (
    data: ThemeConfigSaveRequest
  ): Promise<{
    code: number;
    message: string;
    data: any;
  }> => {
    return http.post(baseUrlApi("theme/config"), data);
  },

  /**
   * 获取当前主题的完整配置（定义+值，需要登录）
   */
  getCurrentThemeConfig: (): Promise<{
    code: number;
    message: string;
    data: ThemeConfigResponse;
  }> => {
    return http.get(baseUrlApi("theme/current-config"));
  },

  /**
   * 获取当前主题配置（公开接口，供前端主题使用）
   */
  getPublicThemeConfig: (): Promise<{
    code: number;
    message: string;
    data: Record<string, any>;
  }> => {
    return http.get(baseUrlApi("public/theme/config"));
  },

  // ===== SSR 主题管理 API =====

  /**
   * 安装 SSR 主题
   */
  installSSRTheme: (
    data: SSRThemeInstallRequest
  ): Promise<{
    code: number;
    message: string;
    data: any;
  }> => {
    return http.post(baseUrlApi("admin/ssr-theme/install"), data);
  },

  /**
   * 卸载 SSR 主题
   */
  uninstallSSRTheme: (
    themeName: string
  ): Promise<{
    code: number;
    message: string;
    data: any;
  }> => {
    return http.request("delete", baseUrlApi(`admin/ssr-theme/${themeName}`));
  },

  /**
   * 启动 SSR 主题
   */
  startSSRTheme: (
    themeName: string,
    data?: SSRThemeStartRequest
  ): Promise<{
    code: number;
    message: string;
    data: { port: number };
  }> => {
    return http.post(
      baseUrlApi(`admin/ssr-theme/${themeName}/start`),
      data || {}
    );
  },

  /**
   * 停止 SSR 主题
   */
  stopSSRTheme: (
    themeName: string
  ): Promise<{
    code: number;
    message: string;
    data: any;
  }> => {
    return http.post(baseUrlApi(`admin/ssr-theme/${themeName}/stop`));
  },

  /**
   * 获取 SSR 主题状态
   */
  getSSRThemeStatus: (
    themeName: string
  ): Promise<{
    code: number;
    message: string;
    data: SSRThemeInfo;
  }> => {
    return http.get(baseUrlApi(`admin/ssr-theme/${themeName}/status`));
  },

  /**
   * 获取已安装的 SSR 主题列表
   */
  getInstalledSSRThemes: (): Promise<{
    code: number;
    message: string;
    data: SSRThemeInfo[];
  }> => {
    return http.get(baseUrlApi("admin/ssr-theme/list"));
  }
};
