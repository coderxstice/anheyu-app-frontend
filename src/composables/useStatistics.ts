/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-20 15:47:09
 * @LastEditTime: 2025-08-20 16:02:40
 * @LastEditors: 安知鱼
 */
import { ref, onMounted } from "vue";
import { getStatistics } from "@/api/statistics";
import type { StatisticData } from "@/types/about";

/**
 * 统计数据获取 - 专门用于获取访问统计数据
 * 访问记录功能已移至 useGlobalStatistics
 */
export function useStatistics() {
  const stats = ref<StatisticData>({
    today_visitors: 0,
    today_views: 0,
    yesterday_visitors: 0,
    yesterday_views: 0,
    month_views: 0,
    year_views: 0
  });

  const isLoading = ref(true);
  const error = ref<string | null>(null);

  // 获取统计数据
  const fetchStats = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await getStatistics();
      if (response.data && response.code === 200) {
        stats.value = response.data;
      } else {
        throw new Error(response.message || "获取统计数据失败");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "获取统计数据失败";
      error.value = errorMessage;
      console.error("获取统计数据失败:", err);
    } finally {
      isLoading.value = false;
    }
  };

  // 自动获取数据
  onMounted(() => {
    fetchStats();
  });

  return {
    stats,
    isLoading,
    error,
    fetchStats
  };
}
