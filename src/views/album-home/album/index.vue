<!--
 * @Description: 相册页组件（支持网格和瀑布流布局）
 * @Author: 安知鱼
 * @Date: 2025-04-09 12:31:32
 * @LastEditTime: 2025-12-29 20:02:48
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import {
  ref,
  onMounted,
  watch,
  computed,
  nextTick,
  onBeforeUnmount
} from "vue";
import AzImage from "@/components/AzImage";
import AzImagePreview from "@/components/AzImagePreview";
import { useAlbumStore } from "@/store/modules/album";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { publicWallpapert } from "@/api/album-home";
import { message } from "@/utils/message";
import { storeToRefs } from "pinia";
import { useWaterfallLayout } from "@/composables/useWaterfallLayout";
import { Loading } from "@element-plus/icons-vue";
import gsap from "gsap";

defineOptions({
  name: "album"
});

const loadedImages = ref<boolean[]>([]);
const previewRef = ref<InstanceType<typeof AzImagePreview>>();
const isLoading = ref(false);

const albumStore = useAlbumStore();
const siteConfigStore = useSiteConfigStore();
const { sortOrder, categoryId } = storeToRefs(albumStore);

// 从配置获取相册设置
const albumConfig = computed(() => {
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

  return {
    layoutMode,
    pageSize,
    waterfall: {
      columnCount,
      gap
    }
  };
});

// 布局模式
const layoutMode = computed(() => albumConfig.value.layoutMode);

// 瀑布流布局 composable
const {
  waterfallRef,
  itemPositions,
  waterfallHeight,
  layoutReady,
  setItemRef,
  recalculateAfterImagesLoaded,
  resetLayout
} = useWaterfallLayout({
  columnCount: albumConfig.value.waterfall.columnCount,
  gap: albumConfig.value.waterfall.gap
});

// GSAP 动画：瀑布流项目入场（性能优化版，基于位置的stagger）
let cachedItems: NodeListOf<Element> | null = null;

const animateWaterfallItems = () => {
  if (layoutMode.value !== "waterfall" || !layoutReady.value) return;

  // 性能优化：缓存 DOM 查询结果
  if (!cachedItems || cachedItems.length === 0) {
    cachedItems = document.querySelectorAll(".waterfall-item");
  }
  const items = cachedItems;
  if (items.length === 0) return;

  // 性能优化：合并 gsap.set 调用，减少重排
  gsap.set(items, {
    opacity: 0,
    y: 50,
    scale: 0.92,
    force3D: true,
    clearProps: "transform" // 合并清除 transform
  });

  // 使用 requestAnimationFrame 确保 DOM 完全更新后再开始动画
  requestAnimationFrame(() => {
    // 按顺序逐个显示动画，每个元素依次出现
    // 增加间隔时间，让每个元素更明显地依次出现
    gsap.to(items, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.7,
      ease: "power2.out",
      force3D: true,
      stagger: {
        each: 0.08, // 每个元素之间间隔0.08秒，让动画更明显
        from: "start"
      }
    });
  });
};

// GSAP 动画：网格项目入场
const animateGridItems = () => {
  if (layoutMode.value !== "grid") return;

  const items = document.querySelectorAll(".thumb");
  if (items.length === 0) return;

  // 先隐藏所有项目
  gsap.set(items, { opacity: 0, scale: 0.9 });

  // 交错动画入场
  gsap.to(items, {
    opacity: 1,
    scale: 1,
    duration: 0.6,
    ease: "power2.out",
    stagger: {
      each: 0.08,
      from: "start"
    }
  });
};

const handleImageLoad = () => {
  loadedImages.value.splice(0, 24, ...Array(24).fill(true));

  // 瀑布流模式下，由于已使用 aspectRatio 预设高度，不需要重新计算布局
  // 避免图片加载完成后位置闪烁
};

// 记录加载失败的图片索引
const failedImageIndexes = ref<Set<number>>(new Set());

const handleImageError = (index: number) => {
  failedImageIndexes.value.add(index);

  // 即使图片加载失败，仍然触发布局重新计算
  if (layoutMode.value === "waterfall" && layoutReady.value) {
    nextTick(() => {
      recalculateAfterImagesLoaded();
    });
  }
};

// 存储相册图片数据
const wallpapers = ref<any[]>([]);
// 分页相关
const totalItems = ref<number>(0);
const currentPage = ref<number>(1);
const pageSize = computed(() => albumConfig.value.pageSize);

// 请求相册图片列表
const fetchWallpapers = async () => {
  isLoading.value = true;

  try {
    // 重置瀑布流布局
    if (layoutMode.value === "waterfall") {
      resetLayout();
      // 清除动画缓存，确保使用最新的 DOM 元素
      cachedItems = null;
    }

    const params: any = {
      page: currentPage.value,
      pageSize: pageSize.value,
      sort: sortOrder.value
    };

    // 如果选择了分类，添加 categoryId 参数
    if (categoryId.value !== null) {
      params.categoryId = categoryId.value;
    }

    const res = await publicWallpapert(params);

    if (res.code === 200) {
      wallpapers.value = res.data.list;
      totalItems.value = res.data.total;

      // 等待 DOM 更新
      await nextTick();

      // 瀑布流模式下，数据加载后计算布局并执行动画
      if (layoutMode.value === "waterfall") {
        await recalculateAfterImagesLoaded();
        // 布局完成后，等待布局完全稳定再执行入场动画
        await nextTick();
        // 使用 setTimeout 确保浏览器完成渲染
        setTimeout(() => {
          animateWaterfallItems();
        }, 50);
      } else {
        // 网格模式执行入场动画
        nextTick(() => {
          animateGridItems();
        });
      }
    }
  } catch (error) {
    message("请求错误" + error, {
      type: "error"
    });
  } finally {
    isLoading.value = false;
  }
};

watch(sortOrder, newSortValue => {
  if (newSortValue) {
    currentPage.value = 1;
    fetchWallpapers();
  }
});

// 监听分类变化
watch(categoryId, () => {
  currentPage.value = 1;
  fetchWallpapers();
});

// 监听布局模式变化
watch(layoutMode, () => {
  if (wallpapers.value.length > 0) {
    nextTick(() => {
      if (layoutMode.value === "waterfall") {
        recalculateAfterImagesLoaded().then(async () => {
          await nextTick();
          // 使用 setTimeout 确保浏览器完成渲染
          setTimeout(() => {
            animateWaterfallItems();
          }, 50);
        });
      } else {
        animateGridItems();
      }
    });
  }
});

const handlePreview = (index: number) => {
  previewRef.value?.open(wallpapers.value, index);
};

// 监听分页变化
const handlePageChange = (page: number) => {
  currentPage.value = page;
  // 平滑滑动到顶部
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "smooth"
  });
  fetchWallpapers();
};

// 检测是否为触摸设备
const isTouchDevice = () => {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
};

// 鼠标/触摸悬停动画（仅用于瀑布流布局）
const handleMouseEnter = (event: MouseEvent | TouchEvent) => {
  // 网格布局不需要 hover 效果
  if (layoutMode.value === "grid") return;
  // 触摸设备上不执行悬停动画，避免触摸后卡住
  if (isTouchDevice() && event.type === "mouseenter") return;

  const target = event.currentTarget as HTMLElement;
  const image = target.querySelector("img");

  gsap.to(target, {
    y: -8,
    boxShadow: "0 12px 32px rgba(0, 0, 0, 0.2)",
    duration: 0.3,
    ease: "power2.out"
  });

  if (image) {
    gsap.to(image, {
      scale: 1.05,
      duration: 0.4,
      ease: "power2.out"
    });
  }
};

const handleMouseLeave = (event: MouseEvent | TouchEvent) => {
  // 网格布局不需要 hover 效果
  if (layoutMode.value === "grid") return;
  // 触摸设备上不执行悬停动画
  if (isTouchDevice() && event.type === "mouseleave") return;

  const target = event.currentTarget as HTMLElement;
  const image = target.querySelector("img");

  gsap.to(target, {
    y: 0,
    boxShadow: "var(--anzhiyu-shadow-border, 0 2px 8px rgba(0, 0, 0, 0.1))",
    duration: 0.3,
    ease: "power2.out"
  });

  if (image) {
    gsap.to(image, {
      scale: 1,
      duration: 0.4,
      ease: "power2.out"
    });
  }
};

// 触摸开始动画（用于移动端反馈，仅瀑布流布局）
const handleTouchStart = (event: TouchEvent) => {
  // 网格布局不需要触摸反馈
  if (layoutMode.value === "grid") return;

  const target = event.currentTarget as HTMLElement;

  gsap.to(target, {
    scale: 0.98,
    duration: 0.15,
    ease: "power2.out"
  });
};

// 触摸结束动画
const handleTouchEnd = (event: TouchEvent) => {
  // 网格布局不需要触摸反馈
  if (layoutMode.value === "grid") return;

  const target = event.currentTarget as HTMLElement;

  gsap.to(target, {
    scale: 1,
    duration: 0.2,
    ease: "power2.out"
  });
};

// 在组件加载时请求数据
onMounted(() => {
  fetchWallpapers();
});

// 清理 GSAP 动画
onBeforeUnmount(() => {
  gsap.killTweensOf(".waterfall-item");
  gsap.killTweensOf(".thumb");
  // 清除动画缓存
  cachedItems = null;
});
</script>

<template>
  <div id="wrapper">
    <div id="main" :class="{ 'waterfall-mode': layoutMode === 'waterfall' }">
      <!-- 全局加载状态 -->
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
        <div v-for="(item, index) in wallpapers" :key="item.id" class="thumb">
          <AzImage
            :src="item.imageUrl"
            :preview-src-list="wallpapers"
            fit="cover"
            lazy
            @load="handleImageLoad"
            @open-preview="handlePreview(index)"
          />

          <div class="image-info">
            <h2 v-if="item.title">{{ item.title }}</h2>
            <p v-if="item.description" class="image-desc">
              {{ item.description }}
            </p>
          </div>
          <div v-if="item.tags" class="tag-info">
            <span class="tag-categorys">
              <a
                v-for="(tag, tagIndex) in item.tags.split(',')"
                :key="tagIndex"
                href="javascript:;"
                class="tag"
              >
                {{ tag.trim() }}
              </a>
            </span>
          </div>
        </div>
      </template>

      <!-- 瀑布流布局 -->
      <template v-else>
        <!-- 瀑布流列表 -->
        <ul
          ref="waterfallRef"
          class="waterfall-list"
          :style="{ position: 'relative', height: waterfallHeight + 'px' }"
        >
          <li
            v-for="(item, index) in wallpapers"
            :key="item.id"
            :ref="el => setItemRef(el as HTMLElement, index)"
            class="waterfall-item"
            :style="itemPositions[index]"
          >
            <div
              class="waterfall-item-content"
              :style="{
                aspectRatio:
                  item.width && item.height
                    ? `${item.width} / ${item.height}`
                    : 'auto'
              }"
            >
              <AzImage
                :src="item.imageUrl"
                :preview-src-list="wallpapers"
                fit="cover"
                lazy
                @load="handleImageLoad"
                @error="handleImageError(index)"
                @open-preview="handlePreview(index)"
              />

              <div class="image-info">
                <h2 v-if="item.title">{{ item.title }}</h2>
                <p v-if="item.description" class="image-desc">
                  {{ item.description }}
                </p>
              </div>
              <div v-if="item.tags" class="tag-info">
                <span class="tag-categorys">
                  <a
                    v-for="(tag, tagIndex) in item.tags.split(',')"
                    :key="tagIndex"
                    href="javascript:;"
                    class="tag"
                  >
                    {{ tag.trim() }}
                  </a>
                </span>
              </div>
            </div>
          </li>
        </ul>
      </template>

      <!-- 空状态 -->
      <div v-if="!isLoading && wallpapers.length === 0" class="empty-state">
        <el-empty description="暂无图片" />
      </div>

      <!-- 分页组件 -->
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
#wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 0 0 4em;
  font-family: "Source Sans Pro", Helvetica, sans-serif;
  transition: filter 0.5s ease;

  #main {
    display: flex;
    flex-wrap: wrap;
    transition: filter 0.5s ease;
    -webkit-tap-highlight-color: rgb(255 255 255 / 0%);

    // 瀑布流模式下的样式调整
    &.waterfall-mode {
      display: block;
    }

    /* 减少运动偏好 */
    @media (prefers-reduced-motion: reduce) {
      .thumb,
      .waterfall-item {
        opacity: 1 !important;
        transition: none !important;
        transform: none !important;
      }
    }

    /* 响应式设计 */

    @media screen and (width <= 1680px) {
      div.thumb {
        width: 33.3333%;
      }
    }

    @media screen and (width <= 1280px) {
      div.thumb {
        width: 50%;
      }
    }

    @media screen and (width <= 980px) {
      div.thumb {
        height: calc(28.5714vh - 1.3333em);
        min-height: 18em;
      }
    }

    @media screen and (width <= 736px) {
      h2 {
        font-size: 1em;
      }

      h3 {
        font-size: 0.9em;
      }

      h4 {
        font-size: 0.8em;
      }

      h5 {
        font-size: 0.7em;
      }

      h6 {
        font-size: 0.7em;
      }

      .thumb .image-info,
      .waterfall-item .image-info {
        right: 12px;
        bottom: 12px;
        left: 12px;

        h2 {
          font-size: 13px;
        }

        .image-desc {
          margin-top: 3px;
          font-size: 11px;
          line-clamp: 2;
          -webkit-line-clamp: 2;
        }
      }

      .thumb .tag-info,
      .waterfall-item .tag-info {
        top: 12px;
        left: 12px;
      }

      .tag-categorys a {
        padding: 6px;
        margin-top: 8px;
        margin-left: 8px;
        font-size: 11px;
      }
    }

    @media screen and (width <= 480px) {
      div.thumb {
        width: 100%;
      }
    }

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
    }

    .thumb {
      position: relative;
      width: 25%;
      height: calc(40vh - 2em);
      min-height: 20em;
      overflow: hidden;
      pointer-events: auto;
      cursor: pointer;
      will-change: transform, box-shadow;
      -webkit-tap-highlight-color: rgb(255 255 255 / 0%);

      :deep(img) {
        width: 100%;
        height: 100%;
        object-fit: cover;
        will-change: transform;
      }

      /* 渐变遮罩 */
      &::after {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        content: "";
        background: linear-gradient(
          to top,
          rgb(10 17 25 / 45%) 5%,
          transparent 40%
        );
        transition: opacity 0.3s ease;
      }

      &:hover::after {
        opacity: 0.8;
      }

      /* 标题和描述 */
      .image-info {
        position: absolute;
        right: 16px;
        bottom: 16px;
        left: 16px;
        z-index: 1;
        pointer-events: none;
        opacity: 0.9;
        transition:
          opacity 0.3s ease,
          transform 0.3s ease;

        h2 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          line-height: 1.4;
          color: #fff;
          text-shadow: 0 1px 3px rgb(0 0 0 / 50%);
        }

        .image-desc {
          display: -webkit-box;
          margin: 4px 0 0;
          overflow: hidden;
          font-size: 12px;
          line-height: 1.5;
          color: rgb(255 255 255 / 85%);
          text-shadow: 0 1px 2px rgb(0 0 0 / 50%);
          line-clamp: 2;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
      }

      &:hover .image-info {
        opacity: 1;
        transform: translateY(-4px);
      }

      .link {
        position: absolute;
        right: 16px;
        bottom: 16px;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4px 10px 4px 4px;
        margin: 0;
        font-size: 14px;
        font-weight: bold;
        color: #fff;
        cursor: pointer;
        background: rgb(0 0 0 / 80%);
        border-radius: 5px;

        &:hover {
          background: var(--anzhiyu-main, #0d00ff);
        }
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

    /* 遮罩层 */
    &::after {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
      width: 100%;
      height: 100%;
      pointer-events: none;
      visibility: hidden;
      content: "";
      background: rgb(36 38 41 / 25%);
      opacity: 0;
      transition:
        opacity 0.5s ease,
        visibility 0.5s;
    }

    .tag-info {
      position: absolute;
      top: 16px;
      left: 16px;
      z-index: 1;
      display: flex;
      gap: 16px;
      align-items: center;
      margin: 0;
      font-size: 14px;
      font-weight: bold;
      color: #fff;
      pointer-events: none;
    }

    .tag-categorys {
      display: flex;
      flex-wrap: wrap;
    }

    .tag-categorys a {
      z-index: 1;
      padding: 8px;
      margin-top: 12px;
      margin-left: 12px;
      font-size: 12px;
      line-height: 1;
      color: #f7f7fa;
      text-decoration: none;
      background: rgb(0 0 0 / 30%);
      backdrop-filter: saturate(180%) blur(20px);
      border-radius: 8px;
      transition: all 0.3s ease;

      &:first-child {
        margin-left: 0;
      }

      &:hover {
        color: #fff;
        background: var(--anzhiyu-main, #0d00ff);
        transform: scale(1.05);
      }
    }
  }
}

/* 全局加载状态 */
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

/* 瀑布流布局样式 */
.waterfall-list {
  padding: 0;
  margin: 0;
  list-style: none;
}

.waterfall-item {
  overflow: hidden;
  cursor: pointer;
  background: var(--anzhiyu-card-bg, #fff);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border, 0 2px 8px rgba(0, 0, 0, 0.1));
  will-change: transform, box-shadow;
  backface-visibility: hidden;
  transform: translateZ(0);

  .waterfall-item-content {
    position: relative;
    overflow: hidden;
    border-radius: 12px;

    :deep(.az-image-wrapper) {
      height: auto; // 覆盖 100%，让容器高度由内容撑开
    }

    :deep(.az-image) {
      position: static; // 覆盖 absolute，让图片撑开容器高度
      display: block;
      width: 100%;
      height: auto;
    }

    :deep(img) {
      display: block;
      width: 100%;
      height: auto;
      object-fit: cover;
      will-change: transform;
    }

    /* 渐变遮罩 */
    &::after {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      content: "";
      background: linear-gradient(
        to top,
        rgb(10 17 25 / 45%) 5%,
        transparent 40%
      );
      opacity: 0.8;
      transition: opacity 0.3s ease;
    }

    .image-info {
      position: absolute;
      right: 16px;
      bottom: 16px;
      left: 16px;
      z-index: 1;
      pointer-events: none;
      opacity: 0.9;
      transition:
        opacity 0.3s ease,
        transform 0.3s ease;

      h2 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        line-height: 1.4;
        color: #fff;
        text-shadow: 0 1px 3px rgb(0 0 0 / 50%);
      }

      .image-desc {
        display: -webkit-box;
        margin: 4px 0 0;
        overflow: hidden;
        font-size: 12px;
        line-height: 1.5;
        color: rgb(255 255 255 / 85%);
        text-shadow: 0 1px 2px rgb(0 0 0 / 50%);
        line-clamp: 2;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
    }

    .tag-info {
      position: absolute;
      top: 16px;
      left: 16px;
      z-index: 1;
      display: flex;
      gap: 16px;
      align-items: center;
      margin: 0;
      font-size: 14px;
      font-weight: bold;
      color: #fff;
      pointer-events: none;

      .tag-categorys {
        display: flex;
        flex-wrap: wrap;

        a {
          padding: 8px;
          margin-top: 0;
          margin-left: 8px;
          font-size: 12px;
          line-height: 1;
          color: #f7f7fa;
          text-decoration: none;
          background: rgb(0 0 0 / 30%);
          backdrop-filter: saturate(180%) blur(20px);
          border-radius: 8px;
          transition: all 0.3s ease;

          &:first-child {
            margin-left: 0;
          }

          &:hover {
            color: #fff;
            background: var(--anzhiyu-main, #0d00ff);
            transform: scale(1.05);
          }
        }
      }
    }
  }

  &:hover .waterfall-item-content {
    .image-info {
      opacity: 1;
      transform: translateY(-4px);
    }

    &::after {
      opacity: 1;
    }
  }
}

// 全局过渡动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// 触摸设备优化
@media (hover: none) and (pointer: coarse) {
  .thumb,
  .waterfall-item {
    // 移动端禁用 hover 效果的 CSS transition，让 GSAP 完全控制
    &:hover {
      transform: none;
      box-shadow: var(--anzhiyu-shadow-border, 0 2px 8px rgba(0, 0, 0, 0.1));
    }

    &:active {
      transform: scale(0.98);
    }
  }
}

// Loading 占位符过渡动画
.fade-loading-enter-active {
  transition: all 0.2s ease-out;
}

.fade-loading-leave-active {
  transition: all 0.3s ease-in;
}

.fade-loading-enter-from {
  opacity: 0;
  transform: scale(0.96);
}

.fade-loading-leave-to {
  opacity: 0;
  transform: scale(0.98);
}
</style>
