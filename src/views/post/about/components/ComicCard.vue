<!--
 * @Description: 漫画卡片组件
 * @Author: 安知鱼
 * @Date: 2025-01-27
-->
<script setup lang="ts">
import type { Comic } from "@/types/about";

interface Props {
  comic: Comic;
}

defineProps<Props>();
</script>

<template>
  <div class="author-content-item comic-content">
    <div class="card-content">
      <div class="author-content-item-tips">{{ comic.tips }}</div>
      <div class="author-content-item-title">{{ comic.title }}</div>
      <div class="comic-box">
        <a
          v-for="(item, index) in comic.list"
          :key="index"
          class="comic-item"
          :href="item.href"
          target="_blank"
          :title="item.name"
        >
          <div class="comic-item-cover">
            <img :src="item.cover" :alt="item.name" />
          </div>
        </a>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.comic-content {
  flex: 1;
  width: 39%;
  min-height: 300px;
  overflow: hidden;

  @media screen and (width <= 768px) {
    width: 100% !important;
  }

  &::after {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    content: "";
    box-shadow: 0 -48px 203px 11px #fbe9b8 inset;
  }

  .author-content-item-tips,
  .author-content-item-title {
    z-index: 2;
    color: var(--anzhiyu-white);
    pointer-events: none;
  }

  .comic-box {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    gap: 2px;
    width: 100%;
    height: 100%;
    padding: 0;
  }

  .comic-item {
    position: relative;
    flex: 1;
    height: 100%;
    overflow: hidden;
    color: white;
    text-decoration: none;
    transition: flex 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;

    &::before {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
      width: 100%;
      height: 100%;
      content: "";
      background: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0) 0%,
        rgba(0, 0, 0, 0.3) 50%,
        rgba(0, 0, 0, 0.7) 100%
      );
      opacity: 0;
      transition: opacity 0.6s ease;
    }

    &:hover {
      flex: 2.5;
      z-index: 3;

      &::before {
        opacity: 1;
      }

      .comic-item-cover img {
        transform: scale(1.15);
      }
    }

    .comic-item-cover {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
        transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      }
    }
  }
}
</style>
