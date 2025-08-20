<!--
 * @Description: 地图和信息卡片组件
 * @Author: 安知鱼
 * @Date: 2025-01-27
-->
<script setup lang="ts">
import { onMounted } from "vue";
import type { Map, SelfInfo } from "@/types/about";

interface Props {
  map: Map;
  selfInfo: SelfInfo;
}

defineProps<Props>();

// 数字动画效果
const animateNumber = (element: HTMLElement, target: number) => {
  let current = 0;
  const increment = target / 60; // 60帧动画
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    element.textContent = Math.floor(current).toString();
  }, 16); // 约60fps
};

onMounted(() => {
  // 监听元素进入视口，触发数字动画
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const yearElement = document.getElementById("selfInfo-content-year");
        if (yearElement) {
          const yearValue = parseInt(yearElement.textContent || "0");
          if (yearValue > 0) {
            animateNumber(yearElement, yearValue);
          }
        }
        observer.disconnect();
      }
    });
  });

  const selfInfoElement = document.querySelector(
    ".author-content-item.selfInfo.single"
  );
  if (selfInfoElement) {
    observer.observe(selfInfoElement);
  }
});
</script>

<template>
  <div class="author-content-item-group column mapAndInfo">
    <div
      class="author-content-item map single"
      :style="{
        backgroundImage: `url(${map.background})`,
        '--dark-bg': `url(${map.backgroundDark})`
      }"
    >
      <span class="map-title">
        {{ map.title }}
        <b>{{ map.strengthenTitle }}</b>
      </span>
    </div>
    <div class="author-content-item selfInfo single">
      <div>
        <span class="selfInfo-title">{{ selfInfo.tips1 }}</span>
        <span
          id="selfInfo-content-year"
          class="selfInfo-content"
          style="color: #43a6c6"
        >
          {{ selfInfo.contentYear }}
        </span>
      </div>
      <div>
        <span class="selfInfo-title">{{ selfInfo.tips2 }}</span>
        <span class="selfInfo-content" style="color: #c69043">
          {{ selfInfo.content2 }}
        </span>
      </div>
      <div>
        <span class="selfInfo-title">{{ selfInfo.tips3 }}</span>
        <span class="selfInfo-content" style="color: #b04fe6">
          {{ selfInfo.content3 }}
        </span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.mapAndInfo {
  width: 59% !important;

  @media screen and (max-width: 768px) {
    width: 100% !important;
  }
}

.author-content-item-group.column {
  display: flex;
  flex-direction: column;
  width: 49%;
  justify-content: space-between;

  @media screen and (max-width: 768px) {
    width: 100% !important;
    flex-direction: row;
  }
}

.map {
  min-height: 160px;
  max-height: 400px;
  position: relative;
  overflow: hidden;
  margin-bottom: 0.5rem;
  height: 60%;
  transition: 1s ease-in-out;
  background-size: 100%;
  background-repeat: no-repeat;
  background-position: center;

  :deep([data-theme="dark"]) & {
    background-image: var(--dark-bg) !important;
  }

  @media screen and (max-width: 768px) {
    width: 50%;
    margin-bottom: 0;
  }

  &:hover {
    background-size: 120%;
    transition: 4s ease-in-out;
    background-position-x: 0;
    background-position-y: 36%;

    .map-title {
      bottom: -100%;
    }
  }

  .map-title {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    color: var(--font-color);
    background: var(--anzhiyu-maskbg);
    padding: 0.5rem 2rem;
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: blur(20px);
    transform: translateZ(0);
    transition:
      all 1s,
      color 0s ease-in-out;
    font-size: 20px;

    b {
      color: var(--font-color);
    }
  }
}

.selfInfo {
  display: flex;
  min-height: 100px;
  max-height: 400px;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  height: -webkit-fill-available;
  height: 40%;

  @media screen and (max-width: 768px) {
    height: 100%;
    width: 49%;
  }

  div {
    display: flex;
    flex-direction: column;
    margin: 0.5rem 2rem 0.5rem 0;
    min-width: 120px;
  }

  .selfInfo-title {
    opacity: 0.8;
    font-size: 12px;
    line-height: 1;
    margin-bottom: 8px;
  }

  .selfInfo-content {
    font-weight: 700;
    font-size: 34px;
    line-height: 1;

    &#selfInfo-content-year {
      @media screen and (max-width: 768px) {
        width: 90px;
      }
    }
  }
}

.single {
  width: 100%;
}
</style>
