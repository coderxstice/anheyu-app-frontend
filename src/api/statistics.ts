/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-20 15:13:49
 * @LastEditTime: 2025-08-20 15:57:06
 * @LastEditors: 安知鱼
 */
import { http } from "@/utils/http";
import type { StatisticData } from "@/types/about";

// 访问统计接口响应类型
interface StatisticsResponse {
  code: number;
  message: string;
  data: StatisticData | null;
}

// 访问记录请求类型
interface VisitRecordRequest {
  url_path: string;
  page_title: string;
  referer?: string;
  duration?: number;
}

// 访问记录响应类型
interface VisitRecordResponse {
  code: number;
  message: string;
  data: null;
}

// 获取访问统计数据
export function getStatistics() {
  return http.request<StatisticsResponse>(
    "get",
    "/api/public/statistics/basic"
  );
}

// 记录访问行为
export function recordVisit(data: VisitRecordRequest) {
  return http.request<VisitRecordResponse>(
    "post",
    "/api/public/statistics/visit",
    { data }
  );
}

// 备用的模拟数据获取函数
export function getMockStatistics(): Promise<StatisticData> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        today_visitors: Math.floor(Math.random() * 500) + 100,
        today_views: Math.floor(Math.random() * 1000) + 200,
        yesterday_visitors: Math.floor(Math.random() * 400) + 150,
        yesterday_views: Math.floor(Math.random() * 800) + 300,
        month_views: Math.floor(Math.random() * 20000) + 5000,
        year_views: Math.floor(Math.random() * 100000) + 50000
      });
    }, 1000);
  });
}
