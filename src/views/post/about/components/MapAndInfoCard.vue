<!--
 * @Description: 地图和信息卡片组件
 * @Author: 安知鱼
 * @Date: 2025-01-27
-->
<script setup lang="ts">
import { onMounted, computed, ref, onUnmounted } from "vue";
import type { Map, SelfInfo } from "@/types/about";

interface Props {
  map: Map;
  selfInfo: SelfInfo;
}

const props = defineProps<Props>();

// 监听主题变化
const isDarkMode = ref(
  document.documentElement.getAttribute("data-theme") === "dark"
);

// 监听主题变化
const themeObserver = new MutationObserver(() => {
  isDarkMode.value =
    document.documentElement.getAttribute("data-theme") === "dark";
});

// 根据主题动态计算背景图片
const mapBackgroundStyle = computed(() => {
  const backgroundImage = isDarkMode.value
    ? props.map.backgroundDark
    : props.map.background;
  return {
    backgroundImage: `url(${backgroundImage})`
  };
});

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
  // 开始监听主题变化
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"]
  });

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

onUnmounted(() => {
  // 清理主题监听器
  themeObserver.disconnect();
});
</script>

<template>
  <div class="author-content-item-group column mapAndInfo">
    <div class="author-content-item map single" :style="mapBackgroundStyle">
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

  @media screen and (width <= 768px) {
    width: 100% !important;
  }
}

.author-content-item-group.column {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 49%;

  @media screen and (width <= 768px) {
    flex-direction: column;
    width: 100% !important;
  }
}

.map {
  position: relative;
  height: 60%;
  min-height: 160px;
  max-height: 400px;
  margin-bottom: 0.5rem;
  overflow: hidden;
  background-repeat: no-repeat;
  background-position: center;
  background-size: 100%;
  transition: 1s ease-in-out;

  @media screen and (width <= 768px) {
    width: 100% !important;
    height: 200px;
    margin-bottom: 1rem;
  }

  &:hover {
    background-position-x: 0;
    background-position-y: 36%;
    background-size: 120%;
    transition: 4s ease-in-out;

    .map-title {
      bottom: -100%;
    }
  }

  .map-title {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 0.5rem 2rem;
    font-size: 20px;
    color: var(--font-color);
    background: var(--anzhiyu-maskbg);
    backdrop-filter: blur(20px);
    backdrop-filter: saturate(180%) blur(20px);
    transition:
      all 1s,
      color 0s ease-in-out;
    transform: translateZ(0);

    b {
      color: var(--font-color);
    }
  }
}

.selfInfo {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  height: -webkit-fill-available;
  height: 40%;
  min-height: 100px;
  max-height: 400px;

  @media screen and (width <= 768px) {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
    width: 100% !important;
    height: auto;
  }

  div {
    display: flex;
    flex-direction: column;
    min-width: 120px;
    margin: 0.5rem 2rem 0.5rem 0;

    @media screen and (width <= 768px) {
      width: 100%;
      min-width: auto;
      margin: 0;
    }
  }

  .selfInfo-title {
    margin-bottom: 8px;
    font-size: 12px;
    line-height: 1;
    opacity: 0.8;
  }

  .selfInfo-content {
    font-size: 34px;
    font-weight: 700;
    line-height: 1;

    @media screen and (width <= 768px) {
      font-size: 28px;
    }

    &#selfInfo-content-year {
      @media screen and (width <= 768px) {
        width: auto;
      }
    }
  }
}

.single {
  width: 100%;
}
</style>
