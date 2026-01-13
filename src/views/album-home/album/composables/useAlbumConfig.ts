/**
 * @Description: 相册配置 composable
 * @Author: 安知鱼
 */
import { computed } from "vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

export interface AlbumConfig {
  layoutMode: string;
  pageSize: number;
  enableComment: boolean;
  waterfall: {
    columnCount: {
      large: number;
      medium: number;
      small: number;
    };
    gap: number;
  };
}

export function useAlbumConfig() {
  const siteConfigStore = useSiteConfigStore();

  const albumConfig = computed<AlbumConfig>(() => {
    const config = siteConfigStore.getSiteConfig;

    // 支持嵌套对象和扁平键两种格式
    const layoutMode =
      config?.album?.layout_mode || config?.["album.layout_mode"] || "grid";

    const pageSize =
      parseInt(config?.album?.page_size) ||
      parseInt(config?.["album.page_size"]) ||
      24;

    const gap =
      parseInt(config?.album?.waterfall?.gap) ||
      parseInt(config?.["album.waterfall.gap"]) ||
      16;

    let columnCount = { large: 4, medium: 3, small: 1 };
    try {
      const columnConfig =
        config?.album?.waterfall?.column_count ||
        config?.["album.waterfall.column_count"];
      if (typeof columnConfig === "string" && columnConfig) {
        columnCount = JSON.parse(columnConfig);
      } else if (columnConfig && typeof columnConfig === "object") {
        columnCount = columnConfig;
      }
    } catch {
      // 使用默认值
    }

    const enableComment =
      config?.album?.enable_comment === "true" ||
      config?.album?.enable_comment === true ||
      config?.["album.enable_comment"] === "true" ||
      config?.["album.enable_comment"] === true;

    return {
      layoutMode,
      pageSize,
      enableComment,
      waterfall: {
        columnCount,
        gap
      }
    };
  });

  const layoutMode = computed(() => albumConfig.value.layoutMode);
  const pageSize = computed(() => albumConfig.value.pageSize);
  const enableComment = computed(() => albumConfig.value.enableComment);
  const waterfallConfig = computed(() => albumConfig.value.waterfall);

  return {
    albumConfig,
    layoutMode,
    pageSize,
    enableComment,
    waterfallConfig
  };
}
