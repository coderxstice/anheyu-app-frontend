<!--
 * @Description: 音乐卡片组件
 * @Author: 安知鱼
 * @Date: 2025-01-27
-->
<script setup lang="ts">
import type { Music } from "@/types/about";

interface Props {
  music: Music;
  authorName: string;
}

defineProps<Props>();
</script>

<template>
  <div
    class="author-content-item like-music"
    :style="`background: url(${music.background}) top / cover no-repeat;`"
  >
    <div class="card-content">
      <div class="author-content-item-tips">{{ music.tips }}</div>
      <span class="author-content-item-title">{{ music.title }}</span>
      <div class="content-bottom">
        <div class="tips">跟 {{ authorName }} 一起欣赏更多音乐</div>
      </div>
      <!-- ToDo: 需要写完音乐界面和音乐球 -->
      <!-- <div class="banner-button-group">
        <a class="banner-button" @click="$router.push(music.link)">
          <i class="anzhiyufont anzhiyu-icon-arrow-circle-right" />
          <span class="banner-button-text">更多推荐</span>
        </a>
      </div> -->
    </div>
  </div>
</template>

<style lang="scss" scoped>
.like-music {
  min-height: 400px;
  color: var(--anzhiyu-white);
  overflow: hidden;

  @media screen and (max-width: 768px) {
    width: 100% !important;
  }

  @media screen and (min-width: 768px) and (max-width: 896px) {
    .content-bottom .tips {
      display: none;
    }
  }

  &::after {
    box-shadow: 0 -69px 203px 11px #453e38 inset;
    position: absolute;
    content: "";
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
  }

  .content-bottom {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}

.banner-button-group {
  position: absolute;
  bottom: 1.5rem;
  right: 2rem;

  @media screen and (max-width: 768px) {
    right: 1rem;
    bottom: 1rem;
  }

  .banner-button {
    height: 40px;
    border-radius: 20px;
    justify-content: center;
    background: var(--anzhiyu-white-op);
    color: var(--anzhiyu-white);
    display: inline-flex;
    align-items: center;
    z-index: 1;
    transition: 0.3s;
    cursor: pointer;
    border-bottom: 0 !important;
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: blur(20px);
    transform: translateZ(0);
    text-decoration: none;
    padding: 10px;

    @media screen and (max-width: 768px) {
      background: none;
      padding: 0;
      width: auto;
      backdrop-filter: unset;

      &:hover {
        background: none !important;
      }
    }

    :deep([data-theme="dark"]) & {
      @media screen and (max-width: 768px) {
        color: var(--anzhiyu-black) !important;
      }
    }

    i,
    svg {
      margin-right: 0.25rem;
      font-size: 22px;
      height: 40px;
      max-width: 40px;
      display: flex;
      border-radius: 50px;
      align-items: center;
      justify-content: center;

      @media screen and (max-width: 768px) {
        margin-right: 0.25rem;
        font-size: 1.5rem;
        background: white;
        border-radius: 50%;
        padding: 6px;
        margin-left: 80px;
        height: 40px;
        width: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--anzhiyu-fontcolor);
      }
    }

    .banner-button-text {
      margin-left: 4px;

      @media screen and (max-width: 768px) {
        display: none;
      }
    }

    &:hover {
      background: var(--anzhiyu-main);
      color: var(--anzhiyu-white);
      border-radius: 20px !important;

      @media screen and (max-width: 768px) {
        i {
          background: var(--anzhiyu-background) !important;
          color: var(--anzhiyu-theme);
        }
      }
    }
  }
}
</style>
