import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";

/** 通用的后端响应结果类型 */
export interface Result<T> {
  code: number;
  message: string;
  data: T;
}

/** 存储策略的数据结构 */
export interface StoragePolicy {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  type: "local" | "onedrive";
  server?: string;
  bucket_name?: string;
  is_private: boolean;
  access_key?: string;
  secret_key?: string;
  max_size: number;
  dir_name_rule?: string;
  mount_dir?: string;
  settings?: any;
}

/** 列表请求的响应数据结构 */
export interface PolicyListResponse {
  list: StoragePolicy[];
  total: number;
}

/** 列表请求的参数结构 */
export interface PolicyListParams {
  page: number;
  pageSize: number;
}

/** 列表请求的参数结构 */
export interface PolicyListParams {
  page: number;
  pageSize: number;
}
// 获取存储策略列表
export const getPolicyList = (params: PolicyListParams) => {
  return http.request<Result<PolicyListResponse>>(
    "get",
    baseUrlApi("policies"),
    {
      params
    }
  );
};

// 创建存储策略
export const createPolicy = (data: Partial<StoragePolicy>) => {
  return http.request<Result<StoragePolicy>>("post", baseUrlApi("policies"), {
    data
  });
};

// 更新存储策略
export const updatePolicy = (data: Partial<StoragePolicy>) => {
  return http.request<Result<StoragePolicy>>(
    "put",
    baseUrlApi(`policies/${data.id}`),
    {
      data
    }
  );
};

// 删除存储策略
export const deletePolicy = (id: number) => {
  return http.request<Result<null>>("delete", baseUrlApi(`policies/${id}`));
};

// 根据 ID 获取单个存储策略
export const getPolicyById = (id: number) => {
  return http.request<Result<StoragePolicy>>(
    "get",
    baseUrlApi(`policies/${id}`)
  );
};
