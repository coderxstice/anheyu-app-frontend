<!--
 * @Description: 相册首页
 * @Author: 安知鱼
 * @Date: 2025-04-09 12:23:48
 * @LastEditTime: 2025-12-29 16:00:00
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import Album from "./album/index.vue";
import AlbumHeader from "./header/index.vue";
import FrontendHeader from "@/layout/frontend/components/hearder/index.vue";
import FrontendFooter from "@/layout/frontend/components/footer/index.vue";
import PostComment from "../post/components/PostComment/index.vue";
import AnBannerCard from "@/components/AnBannerCard";

defineOptions({
  name: "AlbumHome"
});

const route = useRoute();
const siteConfigStore = useSiteConfigStore();
const postCommentRef = ref();

// 获取相册页配置
const albumConfig = computed(() => {
  const config = siteConfigStore.getSiteConfig;
  return {
    layoutMode:
      config?.album?.layout_mode || config?.["album.layout_mode"] || "grid",
    enableComment:
      config?.album?.enable_comment === "true" ||
      config?.album?.enable_comment === true ||
      config?.["album.enable_comment"] === "true" ||
      config?.["album.enable_comment"] === true
  };
});

// 获取相册 banner 配置
const albumBannerConfig = computed(() => {
  const config = siteConfigStore.getSiteConfig;
  return {
    tips: config?.album?.banner?.tip || config?.["album.banner.tip"],
    title: config?.album?.banner?.title || config?.["album.banner.title"],
    description:
      config?.album?.banner?.description ||
      config?.["album.banner.description"],
    backgroundImage:
      config?.album?.banner?.background || config?.["album.banner.background"]
  };
});

// 是否为瀑布流布局
const isWaterfallLayout = computed(
  () => albumConfig.value.layoutMode === "waterfall"
);

// 设置 body/html 背景色，防止下拉时出现黑色背景
watch(
  isWaterfallLayout,
  isWaterfall => {
    if (isWaterfall) {
      document.body.style.backgroundColor = "var(--anzhiyu-background)";
      document.documentElement.style.backgroundColor =
        "var(--anzhiyu-background)";
    } else {
      document.body.style.backgroundColor = "";
      document.documentElement.style.backgroundColor = "";
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (isWaterfallLayout.value) {
    document.body.style.backgroundColor = "var(--anzhiyu-background)";
    document.documentElement.style.backgroundColor =
      "var(--anzhiyu-background)";
  }
});

onUnmounted(() => {
  // 清理时恢复默认
  document.body.style.backgroundColor = "";
  document.documentElement.style.backgroundColor = "";
});
</script>

<template>
  <!-- 瀑布流布局：使用前台统一布局 -->
  <div v-if="isWaterfallLayout" class="album-waterfall-layout">
    <FrontendHeader />

    <main class="album-main">
      <div class="album-content">
        <!-- Banner 区域 -->
        <AnBannerCard
          v-if="albumBannerConfig.title || albumBannerConfig.backgroundImage"
          :tips="albumBannerConfig.tips"
          :title="albumBannerConfig.title"
          :description="albumBannerConfig.description"
          :background-image="albumBannerConfig.backgroundImage"
          :height="300"
          class="album-banner"
        />
        <Album />

        <!-- 评论区域 -->
        <div v-if="albumConfig.enableComment" class="album-comment-section">
          <PostComment ref="postCommentRef" :target-path="route.path" />
        </div>
      </div>
    </main>

    <FrontendFooter />
  </div>

  <!-- 网格布局：保持原有的全屏画廊风格 -->
  <div v-else class="album-grid-layout">
    <AlbumHeader />
    <Album />

    <!-- 评论区域 -->
    <div v-if="albumConfig.enableComment" class="album-comment-section">
      <PostComment ref="postCommentRef" :target-path="route.path" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
// 瀑布流布局样式
.album-waterfall-layout {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--anzhiyu-background);

  // 确保背景覆盖整个视口，防止滚动时露出黑色背景
  &::before {
    position: fixed;
    top: 0;
    left: 0;
    z-index: -1;
    width: 100%;
    height: 100%;
    content: "";
    background: var(--anzhiyu-background);
  }

  .album-main {
    flex: 1;
  }

  .album-content {
    max-width: 1400px;
    padding: 1rem 1.5rem;
    margin: 0 auto;
  }

  .album-banner {
    margin-bottom: 1.5rem;
  }

  .album-comment-section {
    max-width: 1400px;
    padding: 0 1.5rem 2rem;
    margin: 0 auto;
  }
}

// 网格布局样式（保持原有全屏画廊风格）
.album-grid-layout {
  width: 100%;
  min-height: 100vh;

  .album-comment-section {
    max-width: 1400px;
    padding: 0 1.5rem 2rem;
    margin: 0 auto;
  }
}
</style>
