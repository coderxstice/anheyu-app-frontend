import Axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type CustomParamsSerializer
} from "axios";
import type {
  AnHttpError,
  RequestMethods,
  AnHttpResponse,
  AnHttpRequestConfig
} from "./types.d";
import { stringify } from "qs";
import { getToken, formatToken, removeToken } from "@/utils/auth";
import { useUserStoreHook } from "@/store/modules/user";

// 相关配置请参考：www.axios-js.com/zh-cn/docs/#axios-request-config-1
const defaultConfig: AxiosRequestConfig = {
  timeout: 10000,
  headers: {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest"
  },
  paramsSerializer: {
    serialize: stringify as unknown as CustomParamsSerializer
  }
};

class AnHttp {
  /** 初始化配置对象 */
  private static initConfig: AnHttpRequestConfig = {};

  /** 保存当前`Axios`实例对象 */
  private static axiosInstance: AxiosInstance = Axios.create(defaultConfig);

  /** `token`过期后，暂存待执行的请求 */
  private static requests: ((token: string) => void)[] = [];

  /** 防止重复刷新`token` */
  private static isRefreshing = false;

  constructor() {
    this.httpInterceptorsRequest();
    this.httpInterceptorsResponse();
  }

  /**
   * 暂停当前请求，并将其放入待执行队列 (用于请求拦截器)
   * @param config 当前请求的配置
   * @returns 返回一个 Promise，该 Promise 会在 Token 刷新后被解析为更新后的 config
   */
  private static queueRequest(
    config: AnHttpRequestConfig
  ): Promise<AnHttpRequestConfig> {
    return new Promise(resolve => {
      AnHttp.requests.push((token: string) => {
        config.headers!["Authorization"] = formatToken(token);
        // 核心：用更新后的 config 来 resolve Promise
        resolve(config);
      });
    });
  }

  /**
   * 重连原始请求 (用于响应拦截器)
   * @param config 原始请求的配置
   * @returns 返回一个 Promise，该 Promise 会在 Token 刷新后，重新发起请求并返回新的 Response Promise
   */
  private static retryOriginalRequest(config: AnHttpRequestConfig) {
    return new Promise(resolve => {
      AnHttp.requests.push((token: string) => {
        config.headers!["Authorization"] = formatToken(token);
        // 核心：用重新发起请求的 Promise 来 resolve
        resolve(AnHttp.axiosInstance(config));
      });
    });
  }

  /**
   * 统一处理 Token 刷新逻辑
   * @returns 返回一个包含新 accessToken 的 Promise
   */
  private static async handleRefreshToken(): Promise<string> {
    try {
      const tokenData = getToken();

      if (!tokenData || !tokenData.refreshToken) {
        // 如果本地没有有效的 refreshToken，直接抛出错误，终止刷新流程
        throw new Error("No refresh token available.");
      }

      // 调用 store 中的方法，该方法负责调用刷新接口并持久化新 Token
      const res = await useUserStoreHook().handRefreshToken({
        refreshToken: tokenData.refreshToken
      });

      const newAccessToken = res.data?.accessToken;
      if (!newAccessToken) {
        // 如果刷新成功，但响应中没有 accessToken，也视为失败
        throw new Error("Refresh response did not contain an accessToken.");
      }

      // 成功获取新 Token 后，执行所有在队列中等待的请求
      AnHttp.requests.forEach(cb => cb(newAccessToken));
      // 清空队列
      AnHttp.requests = [];

      return newAccessToken;
    } catch (error) {
      // 如果刷新过程中的任何一步失败，则清空本地 Token 并强制登出
      removeToken();
      useUserStoreHook().logOut();
      // 将错误继续抛出，以便上层调用可以捕获
      return Promise.reject(error);
    }
  }

  /** 请求拦截 */
  private httpInterceptorsRequest(): void {
    AnHttp.axiosInstance.interceptors.request.use(
      async (config: AnHttpRequestConfig): Promise<any> => {
        // 开启进度条动画 (如果需要)
        // NProgress.start();

        // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
        if (typeof config.beforeRequestCallback === "function") {
          config.beforeRequestCallback(config);
          return config;
        }
        if (AnHttp.initConfig.beforeRequestCallback) {
          AnHttp.initConfig.beforeRequestCallback(config);
          return config;
        }

        /** 请求白名单，放置一些不需要`token`的接口（通过设置请求白名单，防止`token`过期后再请求造成的死循环问题） */
        const whiteList = [
          "auth/refresh-token",
          "auth/login",
          "auth/check-email",
          "public/wallpapers" // 示例公开接口
        ];

        // 如果是白名单内的请求，直接放行，不附加 Token
        if (whiteList.some(url => config.url?.endsWith(url))) {
          return config;
        }

        const data = getToken();
        if (data) {
          const now = new Date().getTime();
          // 后端已返回数字类型的时间戳，无需 parseInt
          const expired = data.expires - now <= 0;

          if (expired) {
            if (!AnHttp.isRefreshing) {
              AnHttp.isRefreshing = true;
              try {
                // Token 已过期，调用统一的刷新逻辑
                const newAccessToken = await AnHttp.handleRefreshToken();
                config.headers!["Authorization"] = formatToken(newAccessToken);
                return config;
              } catch (error) {
                return Promise.reject(error);
              } finally {
                AnHttp.isRefreshing = false;
              }
            } else {
              // 正在刷新 Token，将当前请求加入队列
              return AnHttp.queueRequest(config);
            }
          } else {
            // Token 未过期，正常附加 Token
            config.headers!["Authorization"] = formatToken(data.accessToken);
          }
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );
  }

  /** 响应拦截 */
  private httpInterceptorsResponse(): void {
    const instance = AnHttp.axiosInstance;
    instance.interceptors.response.use(
      (response: AnHttpResponse) => {
        // 关闭进度条动画
        // NProgress.done();

        const $config = response.config;
        if (typeof $config.beforeResponseCallback === "function") {
          $config.beforeResponseCallback(response);
          return response.data;
        }
        if (AnHttp.initConfig.beforeResponseCallback) {
          AnHttp.initConfig.beforeResponseCallback(response);
          return response.data;
        }
        return response.data;
      },
      async (error: AnHttpError) => {
        // 关闭进度条动画
        // NProgress.done();
        const { config, response } = error;

        // 如果是请求取消或配置不存在，则直接返回错误
        if (Axios.isCancel(error) || !config) {
          return Promise.reject(error.response || error);
        }

        // 刷新 Token 或登录接口本身出错（如返回401），直接拒绝，防止死循环
        const refreshTokenWhiteList = ["auth/refresh-token", "auth/login"];
        if (
          config.url &&
          refreshTokenWhiteList.some(url => config.url!.endsWith(url)) &&
          response?.status === 401
        ) {
          removeToken();
          useUserStoreHook().logOut();
          return Promise.reject(response.data || error);
        }

        // 如果收到 401 错误，且当前没有正在刷新 Token
        if (response?.status === 401 && !AnHttp.isRefreshing) {
          AnHttp.isRefreshing = true;
          try {
            const newAccessToken = await AnHttp.handleRefreshToken();
            // 使用新的 Token 重新发起原始请求
            config.headers!["Authorization"] = formatToken(newAccessToken);
            return AnHttp.axiosInstance(config);
          } catch (refreshError) {
            return Promise.reject(refreshError);
          } finally {
            AnHttp.isRefreshing = false;
          }
        }

        // 如果是 401 错误，但正在刷新 Token，则将当前请求加入待定队列
        if (response?.status === 401 && AnHttp.isRefreshing) {
          return AnHttp.retryOriginalRequest(config);
        }

        // 其他错误直接抛出
        return Promise.reject(error);
      }
    );
  }

  /** 通用请求工具函数 */
  public request<T>(
    method: RequestMethods,
    url: string,
    param?: AxiosRequestConfig,
    axiosConfig?: AnHttpRequestConfig
  ): Promise<T> {
    const config = {
      method,
      url,
      ...param,
      ...axiosConfig
    } as AnHttpRequestConfig;

    return new Promise((resolve, reject) => {
      AnHttp.axiosInstance
        .request(config)
        .then((response: any) => {
          resolve(response);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /** 单独抽离的`post`工具函数 */
  public post<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: AnHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("post", url, params, config);
  }

  /** 单独抽离的`get`工具函数 */
  public get<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: AnHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("get", url, params, config);
  }
}

export const http = new AnHttp();
