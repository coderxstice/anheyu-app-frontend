<!--
 * @Description: 作者头像框组件
 * @Author: 安知鱼
 * @Date: 2025-01-27
-->
<script setup lang="ts">
import type { AvatarSkills } from "@/types/about";

interface Props {
  avatarImg: string;
  avatarSkills: AvatarSkills;
}

defineProps<Props>();
</script>

<template>
  <div class="author-box">
    <div class="author-tag-left">
      <span
        v-for="(item, index) in avatarSkills.left"
        :key="index"
        class="author-tag"
      >
        {{ item }}
      </span>
    </div>
    <div class="author-img">
      <img
        class="no-lightbox entered loaded"
        :src="avatarImg"
        alt="avatar"
        data-ll-status="loaded"
      />
    </div>
    <div class="author-tag-right">
      <span
        v-for="(item, index) in avatarSkills.right"
        :key="index"
        class="author-tag"
      >
        {{ item }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.author-box {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 0 16px 0;

  .author-tag-left {
    display: flex;
    flex-direction: column;
    align-items: flex-end;

    @media screen and (max-width: 768px) {
      display: none;
    }

    .author-tag {
      &:first-child,
      &:last-child {
        margin-right: -16px;
      }
    }
  }

  .author-tag-right {
    display: flex;
    flex-direction: column;
    align-items: flex-start;

    @media screen and (max-width: 768px) {
      display: none;
    }

    .author-tag {
      &:first-child,
      &:last-child {
        margin-left: -16px;
      }
    }
  }

  .author-tag {
    transform: translate(0, -4px);
    padding: 1px 8px;
    background: var(--anzhiyu-card-bg);
    border: var(--style-border-always);
    border-radius: 40px;
    margin-top: 6px;
    font-size: 14px;
    font-weight: 700;
    box-shadow: var(--anzhiyu-shadow-lightblack);
    animation: 6s ease-in-out 0s infinite normal none running floating;

    &:nth-child(1) {
      animation-delay: 0s;
    }

    &:nth-child(2) {
      animation-delay: 0.6s;
    }

    &:nth-child(3) {
      animation-delay: 1.2s;
    }

    &:nth-child(4) {
      animation-delay: 1.8s;
    }
  }

  .author-img {
    margin: 0 30px;
    border-radius: 50%;
    width: 180px;
    height: 180px;
    position: relative;
    background: var(--anzhiyu-secondbg);
    user-select: none;
    transition: 0.3s;

    @media screen and (max-width: 768px) {
      width: 120px;
      height: 120px;
    }

    &:hover {
      transform: scale(1.1);
    }

    img {
      border-radius: 50%;
      overflow: hidden;
      width: 180px;
      height: 180px;

      @media screen and (max-width: 768px) {
        width: 120px;
        height: 120px;
      }
    }

    &::before {
      content: "";
      transition: 1s;
      width: 30px;
      height: 30px;
      background: var(--anzhiyu-green);
      position: absolute;
      border-radius: 50%;
      border: 5px solid var(--anzhiyu-background);
      bottom: 5px;
      right: 10px;
      z-index: 2;
      box-sizing: content-box;

      @media screen and (max-width: 768px) {
        bottom: -5px;
        right: -5px;
      }
    }
  }
}
</style>
