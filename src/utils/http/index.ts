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
// import NProgress from "../progress"; // 假设这里不需要动
import { getToken, formatToken, removeToken } from "@/utils/auth"; // 增加 removeToken
import { useUserStoreHook } from "@/store/modules/user";

// 相关配置请参考：www.axios-js.com/zh-cn/docs/#axios-request-config-1
const defaultConfig: AxiosRequestConfig = {
  // 请求超时时间
  timeout: 10000,
  headers: {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest"
  },
  // 数组格式参数序列化（https://github.com/axios/axios/issues/5142）
  paramsSerializer: {
    serialize: stringify as unknown as CustomParamsSerializer
  }
};

class AnHttp {
  constructor() {
    this.httpInterceptorsRequest();
    this.httpInterceptorsResponse();
  }

  /** `token`过期后，暂存待执行的请求 */
  private static requests: ((token: string) => void)[] = [];

  /** 防止重复刷新`token` */
  private static isRefreshing = false;

  /** 初始化配置对象 */
  private static initConfig: AnHttpRequestConfig = {};

  /** 保存当前`Axios`实例对象 */
  private static axiosInstance: AxiosInstance = Axios.create(defaultConfig);

  /**
   * 重连原始请求
   * 当 Token 正在刷新时，将后续请求放入队列，待刷新完成后重新发起
   */
  private static retryOriginalRequest(config: AnHttpRequestConfig) {
    return new Promise(resolve => {
      AnHttp.requests.push((token: string) => {
        config.headers!["Authorization"] = formatToken(token); // 确保 headers 存在
        resolve(AnHttp.axiosInstance(config)); // 返回重新发起请求的 Promise
      });
    });
  }

  /** 请求拦截 */
  private httpInterceptorsRequest(): void {
    AnHttp.axiosInstance.interceptors.request.use(
      async (config: AnHttpRequestConfig): Promise<any> => {
        // 开启进度条动画
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
          "user/refresh-token",
          "user/login",
          "user/check-email",
          "public/wallpapers"
        ];

        // 如果是白名单内的请求，直接放行
        if (whiteList.some(url => config.url?.endsWith(url))) {
          return config;
        }

        const data = getToken();
        if (data) {
          const now = new Date().getTime();
          const expired = parseInt(data.expires) - now <= 0;

          // 本地判断 Access Token 已过期
          if (expired) {
            if (!AnHttp.isRefreshing) {
              AnHttp.isRefreshing = true;
              // Token 过期，尝试使用 Refresh Token 刷新
              return useUserStoreHook()
                .handRefreshToken({ refreshToken: data.refreshToken })
                .then(res => {
                  const token = res.data.accessToken;
                  config.headers!["Authorization"] = formatToken(token); // 设置新 Token
                  AnHttp.requests.forEach(cb => cb(token)); // 执行队列中的请求
                  AnHttp.requests = []; // 清空队列
                  return config; // 返回带有新 Token 的当前请求配置
                })
                .catch(err => {
                  // Refresh Token 刷新失败，强制登出
                  removeToken(); // 清除所有 Token
                  useUserStoreHook().logOut();
                  return Promise.reject(err);
                })
                .finally(() => {
                  AnHttp.isRefreshing = false; // 无论成功失败，重置刷新状态
                });
            } else {
              // 正在刷新中，将当前请求加入队列
              return AnHttp.retryOriginalRequest(config);
            }
          } else {
            // Token 未过期，直接设置 Access Token
            config.headers!["Authorization"] = formatToken(data.accessToken);
            return config;
          }
        } else {
          // 没有 Token，对于需要认证的接口，最终会由响应拦截器处理 401 错误
          return config;
        }
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
        const $config = response.config;
        // 关闭进度条动画
        // NProgress.done();

        // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
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
        // 异步处理错误
        const { config, response } = error;
        // 关闭进度条动画
        // NProgress.done();

        // 检查是否是取消请求，或者 config 不存在（某些错误可能没有config）
        if (Axios.isCancel(error) || !config) {
          return Promise.reject(error.response || error);
        }

        /** Token 刷新接口白名单，防止刷新Token接口自身因 401 导致死循环 */
        const refreshTokenWhiteList = ["user/refresh-token", "user/login"];
        if (
          config.url &&
          refreshTokenWhiteList.some(url => config.url!.endsWith(url))
        ) {
          // 如果是刷新 Token 或登录接口自身返回 401，直接拒绝，不再尝试刷新
          removeToken(); // 清除可能存在的无效 Token
          useUserStoreHook().logOut(); // 强制登出
          // 可以选择在这里跳转到登录页，或让业务层自己处理
          // router.push('/login');
          return Promise.reject(error);
        }

        // 如果收到 401 错误，且不是正在刷新 Token
        if (response && response.status === 401 && !AnHttp.isRefreshing) {
          AnHttp.isRefreshing = true; // 标记正在刷新 Token

          try {
            const tokenData = getToken(); // 获取当前存储的 Token 信息
            if (!tokenData || !tokenData.refreshToken) {
              // 没有 refreshToken，或者 refreshToken 也无效，直接登出
              removeToken();
              useUserStoreHook().logOut();
              // 可以选择跳转到登录页，或让业务层自己处理
              // router.push('/login');
              return Promise.reject(error); // 拒绝当前请求
            }

            // 尝试刷新 Token
            const res = await useUserStoreHook().handRefreshToken({
              refreshToken: tokenData.refreshToken
            });
            const newToken = res.data.accessToken;

            // 刷新成功，执行待定请求，并用新 Token 重新发起原始请求
            AnHttp.requests.forEach(cb => cb(newToken));
            AnHttp.requests = []; // 清空队列

            config.headers!["Authorization"] = formatToken(newToken); // 设置新 Token
            return AnHttp.axiosInstance(config); // 使用新 Token 重新发起原始请求
          } catch (refreshError) {
            // 刷新 Token 失败（例如 refreshToken 也过期或无效）
            console.error("刷新 Token 失败:", refreshError);
            removeToken(); // 清除所有 Token
            useUserStoreHook().logOut(); // 登出用户
            // 可以选择跳转到登录页
            // router.push('/login');
            return Promise.reject(refreshError); // 拒绝当前请求并抛出刷新失败的错误
          } finally {
            AnHttp.isRefreshing = false; // 无论成功失败，重置刷新状态
          }
        } else if (response && response.status === 401 && AnHttp.isRefreshing) {
          // 如果是 401 错误，但正在刷新 Token，则将当前请求加入待定队列
          return AnHttp.retryOriginalRequest(config);
        }

        // 所有的响应异常 区分来源为取消请求/非取消请求，其他错误直接抛出
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

    // 单独处理自定义请求/响应回调
    return new Promise((resolve, reject) => {
      AnHttp.axiosInstance
        .request(config)
        .then((response: any) => {
          // 将 undefined 改为 any 或更具体的类型
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
