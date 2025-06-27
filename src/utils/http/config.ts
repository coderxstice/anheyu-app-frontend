/*
 * @Description: 服务器baseURL
 * @Author: 安知鱼
 * @Email: anzhiyu-c@qq.com
 * @Date: 2023-02-26 20:12:37
 * @LastEditTime: 2025-06-28 04:29:53
 * @LastEditors: 安知鱼
 */

let baseUrlApi;
if (process.env.NODE_ENV === "production") {
  baseUrlApi = (url: string) => {
    if (url.startsWith("/")) {
      return location.origin + `/api${url}`;
    } else {
      return location.origin + `/api/${url}`;
    }
  };
} else {
  baseUrlApi = (url: string) => {
    if (url.startsWith("/")) {
      return `http://localhost:8091/api${url}`;
    } else {
      return `http://localhost:8091/api/${url}`;
    }
  };
  // baseUrlApi = (url: string) => `https://album.anheyu.com/api/${url}`;
}

export { baseUrlApi };
