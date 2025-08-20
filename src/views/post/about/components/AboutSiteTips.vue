<!--
 * @Description: 关于网站提示组件
 * @Author: 安知鱼
 * @Date: 2025-01-27
-->
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";
import type { AboutSiteTips } from "@/types/about";

interface Props {
  config: AboutSiteTips;
}

defineProps<Props>();

let pursuitInterval: NodeJS.Timeout | null = null;

onMounted(() => {
  pursuitInterval = setInterval(() => {
    const show = document.querySelector("span[data-show]");
    const next =
      show?.nextElementSibling || document.querySelector(".first-tips");
    const up = document.querySelector("span[data-up]");

    if (up) {
      up.removeAttribute("data-up");
    }

    if (show) {
      show.removeAttribute("data-show");
      show.setAttribute("data-up", "");
    }

    if (next) {
      next.setAttribute("data-show", "");
    }
  }, 2000);
});

onBeforeUnmount(() => {
  if (pursuitInterval) {
    clearInterval(pursuitInterval);
  }
});
</script>

<template>
  <div class="aboutsiteTips author-content-item">
    <div class="author-content-item-tips">{{ config.tips }}</div>
    <h2>
      {{ config.title1 }}<br />
      {{ config.title2 }}
      <div class="mask">
        <span
          v-for="(wordItem, index) in config.word.slice(0, -2)"
          :key="index"
          :class="{ 'first-tips': index === 0 }"
        >
          {{ wordItem }}
        </span>
        <span data-up>{{ config.word[config.word.length - 2] }}</span>
        <span data-show>{{ config.word[config.word.length - 1] }}</span>
      </div>
    </h2>
  </div>
</template>

<style lang="scss" scoped>
.aboutsiteTips {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  flex-direction: column;
  flex: 3;

  h2 {
    margin-right: auto;
    font-size: 36px;
    font-family: Helvetica;
    line-height: 1.06;
    letter-spacing: -0.02em;
    color: var(--anzhiyu-fontcolor);
    margin-top: 0;
  }

  .mask {
    height: 36px;
    position: relative;
    overflow: hidden;
    margin-top: 4px;

    span {
      display: block;
      box-sizing: border-box;
      position: absolute;
      top: 36px;
      padding-bottom: var(--offset);
      background-size: 100% 100%;
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      background-repeat: no-repeat;

      &[data-show] {
        transform: translateY(-100%);
        transition: 0.5s transform ease-in-out;
      }

      &[data-up] {
        transform: translateY(-200%);
        transition: 0.5s transform ease-in-out;
      }

      &:nth-child(1) {
        background-image: linear-gradient(45deg, #0ecffe 50%, #07a6f1);
      }

      &:nth-child(2) {
        background-image: linear-gradient(45deg, #18e198 50%, #0ec15d);
      }

      &:nth-child(3) {
        background-image: linear-gradient(45deg, #8a7cfb 50%, #633e9c);
      }

      &:nth-child(4) {
        background-image: linear-gradient(45deg, #fa7671 50%, #f45f7f);
      }
    }
  }
}
</style>
