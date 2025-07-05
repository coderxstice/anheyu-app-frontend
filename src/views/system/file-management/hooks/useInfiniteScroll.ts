/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-07-05 11:33:12
 * @LastEditTime: 2025-07-05 12:06:55
 * @LastEditors: 安知鱼
 */
// src/views/system/file-management/hooks/useInfiniteScroll.ts
import type { Ref } from "vue";
import { useFileStore } from "@/store/modules/fileStore";
// 修正：从正确的 store 文件中导入 UploaderActions 类型
import type { UploaderActions } from "@/store/modules/fileStore";

interface UseInfiniteScrollOptions {
  loading: Ref<boolean>;
  isMoreLoading: Ref<boolean>;
  hasMore: Ref<boolean>;
  path: Ref<string>;
  uploaderActions: UploaderActions;
}

export function useInfiniteScroll({
  loading,
  isMoreLoading,
  hasMore,
  path,
  uploaderActions
}: UseInfiniteScrollOptions) {
  const fileStore = useFileStore();
  let throttleTimer: number | null = null;

  const handleLoadMore = () => {
    if (throttleTimer) return;

    throttleTimer = window.setTimeout(() => {
      // 这里的逻辑保持不变
      if (hasMore.value && !loading.value && !isMoreLoading.value) {
        fileStore.loadFiles(path.value, uploaderActions);
      }
      throttleTimer = null;
    }, 200);
  };

  return {
    handleLoadMore
  };
}
