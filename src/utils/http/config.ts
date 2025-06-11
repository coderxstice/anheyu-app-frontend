/*
 * @Description: 服务器baseURL
 * @Author: 安知鱼
 * @Email: anzhiyu-c@qq.com
 * @Date: 2023-02-26 20:12:37
 * @LastEditTime: 2025-04-12 23:54:44
 * @LastEditors: 安知鱼
 */

let baseUrlApi;
if (process.env.NODE_ENV === "production") {
  baseUrlApi = (url: string) => location.origin + `/api/${url}`;
} else {
  baseUrlApi = (url: string) => `http://localhost:8091/api/${url}`;
  // baseUrlApi = (url: string) => `https://wallpaper.anheyu.com/api/${url}`;
}

export { baseUrlApi };
