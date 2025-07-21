/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-15 11:31:00
 * @LastEditTime: 2025-07-21 15:16:45
 * @LastEditors: 安知鱼
 */
import type {
  Method,
  AxiosError,
  AxiosResponse,
  AxiosRequestConfig,
  InternalAxiosRequestConfig
} from "axios";

export type resultType = {
  accessToken?: string;
};

export type RequestMethods = Extract<
  Method,
  "get" | "post" | "put" | "delete" | "patch" | "option" | "head"
>;

export interface AnHttpError extends AxiosError {
  isCancelRequest?: boolean;
}

export interface AnHttpResponse extends AxiosResponse {
  config: AnHttpRequestConfig;
}

export interface AnHttpRequestConfig extends InternalAxiosRequestConfig {
  beforeRequestCallback?: (request: AnHttpRequestConfig) => void;
  beforeResponseCallback?: (response: AnHttpResponse) => void;
}

export default class AnHttp {
  request<T>(
    method: RequestMethods,
    url: string,
    param?: AxiosRequestConfig,
    axiosConfig?: AnHttpRequestConfig
  ): Promise<T>;
  post<T, P>(url: string, params?: P, config?: AnHttpRequestConfig): Promise<T>;
  get<T, P>(url: string, params?: P, config?: AnHttpRequestConfig): Promise<T>;
}
