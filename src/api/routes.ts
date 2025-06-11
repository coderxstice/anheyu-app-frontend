/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-04-12 16:34:01
 * @LastEditTime: 2025-04-12 16:34:14
 * @LastEditors: 安知鱼
 */
// import { http } from "@/utils/http";

// type Result = {
//   success: boolean;
//   data: Array<any>;
// };

// export const getAsyncRoutes = () => {
//   return http.request<Result>("get", "/get-async-routes");
// };

export const getAsyncRoutes = () => {
  return Promise.resolve({
    data: []
  });
};
