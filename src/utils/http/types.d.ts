import type {
  Method,
  AxiosError,
  AxiosResponse,
  AxiosRequestConfig
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

export interface AnHttpRequestConfig extends AxiosRequestConfig {
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
