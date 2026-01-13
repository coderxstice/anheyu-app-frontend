<!--
 * @Description: 相册网格布局项目组件
 * @Author: 安知鱼
-->
<script setup lang="ts">
import AzImage from "@/components/AzImage";

interface Props {
  item: {
    id: number;
    imageUrl: string;
    title?: string;
    description?: string;
    tags?: string;
  };
  index: number;
  wallpapers: any[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  load: [];
  preview: [index: number];
}>();

const handleLoad = () => {
  emit("load");
};

const handlePreview = () => {
  emit("preview", props.index);
};

// 解析标签
const parsedTags = computed(() => {
  if (!props.item.tags) return [];
  return props.item.tags.split(",").map(tag => tag.trim());
});
</script>

<script lang="ts">
import { computed } from "vue";
</script>

<template>
  <div class="album-grid-item" :style="{ '--item-index': index }">
    <AzImage
      :src="item.imageUrl"
      :preview-src-list="wallpapers"
      fit="cover"
      lazy
      @load="handleLoad"
      @open-preview="handlePreview"
    />

    <div v-if="item.title || item.description" class="image-info">
      <h2 v-if="item.title">{{ item.title }}</h2>
      <p v-if="item.description" class="image-desc">
        {{ item.description }}
      </p>
    </div>

    <div v-if="parsedTags.length > 0" class="tag-info">
      <span class="tag-categorys">
        <a
          v-for="(tag, tagIndex) in parsedTags"
          :key="tagIndex"
          href="javascript:;"
          class="tag"
        >
          {{ tag }}
        </a>
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.album-grid-item {
  position: relative;
  width: 25%;
  height: calc(40vh - 2em);
  min-height: 20em;
  overflow: hidden;
  pointer-events: auto;
  cursor: pointer;
  -webkit-tap-highlight-color: rgb(255 255 255 / 0%);

  // 入场动画 - 简洁淡入
  animation: fade-in 0.3s ease-out both;
  animation-delay: calc(var(--item-index, 0) * 0.02s);

  :deep(img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.35s ease;
  }

  &:hover :deep(img) {
    transform: scale(1.03);
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

    a {
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

/* 响应式设计 */
@media screen and (width <= 1680px) {
  .album-grid-item {
    width: 33.3333%;
  }
}

@media screen and (width <= 1280px) {
  .album-grid-item {
    width: 50%;
  }
}

@media screen and (width <= 980px) {
  .album-grid-item {
    height: calc(28.5714vh - 1.3333em);
    min-height: 18em;
  }
}

@media screen and (width <= 736px) {
  .album-grid-item {
    .image-info {
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

    .tag-info {
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
}

@media screen and (width <= 480px) {
  .album-grid-item {
    width: 100%;
  }
}

/* 减少运动偏好 */
@media (prefers-reduced-motion: reduce) {
  .album-grid-item {
    animation: none !important;
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>
