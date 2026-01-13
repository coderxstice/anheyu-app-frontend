<!--
 * @Description: 相册页组件（支持网格和瀑布流布局）
 * @Author: 安知鱼
 * @Date: 2025-04-09 12:31:32
 * @LastEditTime: 2025-12-29 20:02:48
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import AzImagePreview from "@/components/AzImagePreview";
import { useAlbumStore } from "@/store/modules/album";
import { publicWallpapert } from "@/api/album-home";
import { message } from "@/utils/message";
import { storeToRefs } from "pinia";
import { Loading } from "@element-plus/icons-vue";
import { useAlbumConfig } from "./composables/useAlbumConfig";
import AlbumGridItem from "./components/AlbumGridItem.vue";
import AlbumWaterfallItem from "./components/AlbumWaterfallItem.vue";
import { LazyImg, Waterfall } from "vue-waterfall-plugin-next";
import "vue-waterfall-plugin-next/dist/style.css";

defineOptions({
  name: "album"
});

// 配置
const { layoutMode, pageSize, enableComment, waterfallConfig } =
  useAlbumConfig();

// 状态
const previewRef = ref<InstanceType<typeof AzImagePreview>>();
const isLoading = ref(false);
const wallpapers = ref<any[]>([]);
const totalItems = ref(0);
const currentPage = ref(1);
const failedImageIndexes = ref<Set<number>>(new Set());

// Store
const albumStore = useAlbumStore();
const { sortOrder, categoryId } = storeToRefs(albumStore);

// 数据请求
const fetchWallpapers = async () => {
  isLoading.value = true;

  try {
    const params: any = {
      page: currentPage.value,
      pageSize: pageSize.value,
      sort: sortOrder.value
    };

    if (categoryId.value !== null) {
      params.categoryId = categoryId.value;
    }

    const res = await publicWallpapert(params);

    if (res.code === 200) {
      wallpapers.value = res.data.list;
      totalItems.value = res.data.total;
    }
  } catch (error) {
    message("请求错误" + error, { type: "error" });
  } finally {
    isLoading.value = false;
  }
};

// 预览
const handlePreview = (index: number) => {
  previewRef.value?.open(wallpapers.value, index);
};

// 评论
const handleComment = () => {
  const commentSection = document.querySelector(".album-comment-section");
  if (commentSection) {
    commentSection.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => {
      const commentInput = commentSection.querySelector("textarea, input");
      if (commentInput) {
        (commentInput as HTMLElement).focus();
      }
    }, 500);
  }
};

// 分页
const handlePageChange = (page: number) => {
  currentPage.value = page;
  window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  fetchWallpapers();
};

// 监听
watch(sortOrder, newVal => {
  if (newVal) {
    currentPage.value = 1;
    fetchWallpapers();
  }
});

watch(categoryId, () => {
  currentPage.value = 1;
  fetchWallpapers();
});

onMounted(() => {
  fetchWallpapers();
});
</script>

<template>
  <div id="album-wrapper">
    <div
      id="album-main"
      :class="{ 'waterfall-mode': layoutMode === 'waterfall' }"
    >
      <!-- 加载状态 -->
      <Transition name="fade">
        <div v-if="isLoading && wallpapers.length === 0" class="global-loading">
          <div class="loading-spinner">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>加载中...</span>
          </div>
        </div>
      </Transition>

      <!-- 网格布局 -->
      <template v-if="layoutMode === 'grid'">
        <AlbumGridItem
          v-for="(item, index) in wallpapers"
          :key="item.id"
          :item="item"
          :index="index"
          :wallpapers="wallpapers"
          @preview="handlePreview"
        />
      </template>

      <!-- 瀑布流布局 -->
      <template v-else>
        <Waterfall
          :list="wallpapers"
          :gutter="waterfallConfig.gap"
          :has-around-gutter="false"
          img-selector="imageUrl"
          :breakpoints="{
            9999: { rowPerView: waterfallConfig.columnCount.large },
            1200: { rowPerView: waterfallConfig.columnCount.medium },
            500: { rowPerView: waterfallConfig.columnCount.small }
          }"
          :animation-effect="'fadeInUp'"
          :animation-duration="400"
          :animation-delay="100"
          background-color="transparent"
          class="waterfall-container"
        >
          <template #default="{ item, url, index }">
            <AlbumWaterfallItem
              :item="item"
              :index="index"
              :wallpapers="wallpapers"
              :image-url="url"
              :enable-comment="enableComment"
              @preview="handlePreview"
              @comment="handleComment"
            />
          </template>
        </Waterfall>
      </template>

      <!-- 空状态 -->
      <div v-if="!isLoading && wallpapers.length === 0" class="empty-state">
        <el-empty description="暂无图片" />
      </div>

      <!-- 分页 -->
      <div v-if="wallpapers.length > 0" class="an-pagination">
        <el-pagination
          v-if="totalItems > 0"
          :current-page="currentPage"
          :page-size="pageSize"
          :total="totalItems"
          layout="total, prev, pager, next, jumper"
          size="large"
          @current-change="handlePageChange"
        />
      </div>

      <AzImagePreview ref="previewRef" page="album" :download-btn="true" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
#album-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 0 0 4em;
  font-family: "Source Sans Pro", Helvetica, sans-serif;

  #album-main {
    display: flex;
    flex-wrap: wrap;
    -webkit-tap-highlight-color: rgb(255 255 255 / 0%);

    &.waterfall-mode {
      display: block;
    }
  }
}

/* 加载状态 */
.global-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 400px;

  .loading-spinner {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
    padding: 2rem;

    .el-icon {
      font-size: 3rem;
      color: var(--anzhiyu-main, #49b1f5);
    }

    span {
      font-size: 1rem;
      font-weight: 500;
      color: var(--anzhiyu-fontcolor, #333);
    }
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 300px;
}

/* 瀑布流容器 */
.waterfall-container {
  :deep(.album-waterfall-item) {
    cursor: pointer;
    transition: transform 0.3s ease;
  }
}

/* 分页 */
.an-pagination {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin: 20px 0 40px;
  clear: both;
  text-align: center;

  :deep(.el-pager) {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin: 0 5px;

    li {
      margin: 0 5px;
    }
  }

  :deep(.el-pager li.is-active),
  :deep(.el-pager li:hover) {
    color: #fff;
    background: var(--anzhiyu-main, #0d00ff);
    transition: 0.2s;
  }

  :deep(.el-pagination button.is-active),
  :deep(.el-pagination button:hover) {
    color: var(--anzhiyu-main, #0d00ff);
  }
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
