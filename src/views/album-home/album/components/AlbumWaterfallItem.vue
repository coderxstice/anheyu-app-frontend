<!--
 * @Description: 相册瀑布流布局项目组件
 * @Author: 安知鱼
-->
<script setup lang="ts">
import { computed } from "vue";
import { LazyImg } from "vue-waterfall-plugin-next";
import { formatRelativeTime } from "@/utils/format";

interface Props {
  item: {
    id: number;
    imageUrl: string;
    title?: string;
    description?: string;
    tags?: string;
    width?: number;
    height?: number;
    created_at?: string;
    location?: string;
  };
  index: number;
  wallpapers: any[];
  imageUrl: string;
  enableComment?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  enableComment: false,
  imageUrl: ""
});

const emit = defineEmits<{
  preview: [index: number];
  comment: [item: Props["item"]];
}>();

// 计算宽高比（数字）
const aspectRatioNumber = computed(() => {
  if (props.item.width && props.item.height) {
    return props.item.width / props.item.height;
  }
  return 4 / 3;
});

// 计算宽高比（字符串，用于其他元素）
const aspectRatio = computed(() => {
  if (props.item.width && props.item.height) {
    return `${props.item.width} / ${props.item.height}`;
  }
  return "4 / 3";
});

// 解析标签
const parsedTags = computed(() => {
  if (!props.item.tags) return [];
  return props.item.tags.split(",").map(tag => tag.trim());
});

const handlePreview = () => {
  emit("preview", props.index);
};

const handleComment = () => {
  emit("comment", props.item);
};
</script>

<template>
  <div class="album-waterfall-item" @click="handlePreview">
    <div class="waterfall-item-content">
      <LazyImg
        :url="imageUrl"
        :ratio="aspectRatioNumber"
        class="waterfall-image"
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

    <!-- 底部信息栏 -->
    <div class="album-item-bottom">
      <div class="album-item-info">
        <div v-if="item.created_at" class="album-info-time">
          <i class="anzhiyufont anzhiyu-icon-clock" />
          <time class="datatime" :datetime="item.created_at">
            {{ formatRelativeTime(item.created_at) }}
          </time>
        </div>
        <div v-if="item.location" class="album-info-location">
          <i class="anzhiyufont anzhiyu-icon-location-dot" />
          <span>{{ item.location }}</span>
        </div>
      </div>
      <div v-if="enableComment" class="album-reply" @click.stop="handleComment">
        <IconifyIconOffline icon="ri:chat-1-fill" class="w-6 h-6" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.album-waterfall-item {
  display: flex;
  flex-flow: column nowrap;
  align-items: flex-start;
  justify-content: space-between;
  overflow: hidden;
  cursor: pointer;
  padding: 1rem 1rem 0.5rem;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border-always);
  border: var(--style-border-always);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);
  transition: border 0.3s ease;

  &:hover {
    border: var(--style-border-hover);

    :deep(img) {
      transform: scale(1.02);
    }
  }

  .waterfall-item-content {
    position: relative;
    width: 100%;
    overflow: hidden;
    border-radius: 12px;
    margin-bottom: 1rem;

    .waterfall-image {
      width: 100%;
      border-radius: 12px;

      :deep(img) {
        display: block;
        width: 100%;
        height: auto;
        object-fit: cover;
        border-radius: 12px;
        transition: transform 0.35s ease;
      }
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

  // 底部信息栏
  .album-item-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .album-item-info {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
    font-size: 0.8125rem;

    .album-info-time,
    .album-info-location {
      display: flex;
      gap: 0.2rem;
      align-items: center;
      padding: 0 8px;
      font-size: 0.7rem;
      color: var(--anzhiyu-fontcolor);
      cursor: default;
      background-color: var(--anzhiyu-gray-op);
      border-radius: 20px;

      i {
        font-size: 0.875rem;
      }
    }

    .album-info-location {
      span {
        max-width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  .album-reply {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    color: var(--anzhiyu-secondtext);
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.3s ease;

    svg {
      width: 1.125rem;
      height: 1.125rem;
    }

    &:hover {
      color: var(--anzhiyu-main);
      background: var(--anzhiyu-main-op);
    }
  }
}

/* 响应式设计 */
@media screen and (width <= 736px) {
  .album-waterfall-item {
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

/* 减少运动偏好 */
@media (prefers-reduced-motion: reduce) {
  .album-waterfall-item {
    transition: none !important;
    opacity: 1 !important;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .album-waterfall-item {
    &:hover {
      box-shadow: var(--anzhiyu-shadow-border);
    }
  }
}
</style>
