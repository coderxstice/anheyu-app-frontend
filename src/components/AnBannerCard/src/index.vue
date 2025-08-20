<!--
 * @Description: 横幅卡片组件 - 简化版本，专注于文字内容展示
 * @Author: 安知鱼
 * @Date: 2025-01-27
 * @LastEditTime: 2025-08-20 11:17:15
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { computed } from "vue";

defineOptions({
  name: "AnBannerCard"
});

interface Props {
  /** 提示文字 */
  tips?: string;
  /** 标题 */
  title?: string;
  /** 描述文字 */
  description?: string;
  /** 背景图片URL */
  backgroundImage?: string;
  /** 组件高度 */
  height?: string | number;
  /** 是否圆角 */
  rounded?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  tips: "好物",
  title: "实物装备推荐",
  description: "跟 安知鱼 一起享受科技带来的乐趣",
  height: 300,
  rounded: true
});

// 计算样式
const containerStyle = computed(() => ({
  height: typeof props.height === "number" ? `${props.height}px` : props.height,
  borderRadius: props.rounded ? "12px" : "0"
}));

const backgroundStyle = computed(() => ({
  background: props.backgroundImage
    ? `url(${props.backgroundImage}) left 37%/cover no-repeat`
    : "none"
}));
</script>

<template>
  <div class="an-banner-card" :style="containerStyle">
    <div class="author-content" :style="backgroundStyle">
      <div class="card-content">
        <div class="author-content-item-tips">{{ tips }}</div>
        <span class="author-content-item-title">{{ title }}</span>
        <div class="content-bottom">
          <div class="tips">{{ description }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.an-banner-card {
  width: 100%;
  overflow: hidden;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  background-color: var(--anzhiyu-main);
  background-position: left 28%;
  background-repeat: no-repeat;
  background-size: cover;
  color: var(--anzhiyu-white);
  overflow: hidden;
  margin-top: 0;
  background-image: linear-gradient(
    -45deg,
    var(--anzhiyu-main),
    #0f4667,
    #2a6973 150%,
    #67044d
  );
  background-size: 400%;
  animation: gradient 15s ease infinite;

  .author-content {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    padding: 2rem;
    color: white;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.4);
      z-index: 1;
    }

    .card-content {
      position: relative;
      z-index: 2;
      text-align: left;
      width: 100%;

      .author-content-item-tips {
        font-size: 0.75rem;
        font-weight: 500;
        margin-bottom: 0.5rem;
        opacity: 0.8;
      }

      .author-content-item-title {
        font-size: 2.25rem;
        font-weight: 700;
        margin-bottom: 1rem;
        line-height: 1.2;
        display: block;
      }

      .content-bottom {
        position: absolute;
        bottom: 0;
        .tips {
          font-size: 0.875rem;
          opacity: 0.9;
          line-height: 1.5;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .an-banner-card {
    .author-content {
      padding: 1.5rem;

      .card-content {
        .author-content-item-title {
          font-size: 1.5rem;
        }
      }
    }
  }
}
</style>
