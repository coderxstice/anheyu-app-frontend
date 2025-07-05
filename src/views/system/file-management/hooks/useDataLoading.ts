/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-07-05 11:39:04
 * @LastEditTime: 2025-07-05 11:39:09
 * @LastEditors: 安知鱼
 */
// src/views/system/file-management/hooks/useDataLoading.ts
import { watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useFileStore, type UploaderActions } from "@/store/modules/fileStore";
import { buildFullUri, extractLogicalPathFromUri } from "@/utils/fileUtils";

interface UseDataLoadingOptions {
  uploaderActions: UploaderActions;
  clearSelection: () => void;
}

export function useDataLoading({
  uploaderActions,
  clearSelection
}: UseDataLoadingOptions) {
  const route = useRoute();
  const router = useRouter();
  const fileStore = useFileStore();
  const { path, hasMore, loading, isMoreLoading } = storeToRefs(fileStore);

  const loadFilesFromRoute = (
    pathQuery: string | string[] | null | undefined
  ) => {
    const pathUri = Array.isArray(pathQuery) ? pathQuery[0] : pathQuery;
    const logicalPathToLoad = pathUri
      ? extractLogicalPathFromUri(pathUri)
      : "/";
    if (logicalPathToLoad !== fileStore.path || fileStore.files.length === 0) {
      clearSelection();
      fileStore.loadFiles(logicalPathToLoad, uploaderActions, true);
    }
  };

  watch(
    () => route.query.path,
    newPathQuery => {
      loadFilesFromRoute(newPathQuery);
    },
    { immediate: true }
  );

  const handleRefresh = () => {
    fileStore.refreshCurrentPath(uploaderActions);
  };

  const handleNavigate = (newLogicalPath: string) => {
    const fullUri = buildFullUri(newLogicalPath);
    if (route.query.path !== fullUri) {
      router.push({ query: { path: fullUri } });
    }
  };

  let throttleTimer: number | null = null;
  const handleLoadMore = () => {
    if (throttleTimer) return;
    throttleTimer = window.setTimeout(() => {
      if (hasMore.value && !loading.value && !isMoreLoading.value) {
        fileStore.loadFiles(path.value, uploaderActions);
      }
      throttleTimer = null;
    }, 200);
  };

  return {
    handleRefresh,
    handleNavigate,
    handleLoadMore
  };
}
