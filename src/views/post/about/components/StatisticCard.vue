<!--
 * @Description: 访问统计卡片组件
 * @Author: 安知鱼
 * @Date: 2025-01-27
-->
<script setup lang="ts">
import { useStatistics } from "@/composables/useStatistics";

interface Props {
  cover: string;
  link: string;
  text: string;
}

defineProps<Props>();

const { stats, isLoading, error } = useStatistics();
</script>

<template>
  <div
    class="about-statistic author-content-item"
    :style="`background: url(${cover}) top / cover no-repeat;`"
  >
    <div class="card-content">
      <div class="author-content-item-tips">数据</div>
      <span class="author-content-item-title">访问统计</span>

      <!-- 统计数据 -->
      <div v-if="!isLoading && !error" id="statistic">
        <div>
          <span>今日人数</span>
          <span>{{ stats.today_visitors }}</span>
        </div>
        <div>
          <span>今日访问</span>
          <span>{{ stats.today_views }}</span>
        </div>
        <div>
          <span>昨日人数</span>
          <span>{{ stats.yesterday_visitors }}</span>
        </div>
        <div>
          <span>昨日访问</span>
          <span>{{ stats.yesterday_views }}</span>
        </div>
        <div>
          <span>本月访问</span>
          <span>{{ stats.month_views }}</span>
        </div>
        <div>
          <span>年访问量</span>
          <span>{{ stats.year_views }}</span>
        </div>
      </div>

      <div v-else-if="isLoading" class="loading">加载中...</div>

      <div v-else-if="error" class="error">
        {{ error }}
      </div>

      <div class="banner-button-group">
        <a class="banner-button" @click="$router.push(link)">
          <i class="anzhiyufont anzhiyu-icon-arrow-circle-right" />
          <span class="banner-button-text">{{ text }}</span>
        </a>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.about-statistic {
  min-height: 380px;
  width: 39%;
  background-size: cover;
  color: var(--anzhiyu-white);
  overflow: hidden;

  &::after {
    box-shadow: 0 -159px 173px 71px #0c1c2c inset;
    position: absolute;
    content: "";
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
  }
}

#statistic {
  font-size: 16px;
  border-radius: 15px;
  width: 100%;
  color: var(--anzhiyu-white);
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  flex-wrap: wrap;
  margin-top: 1rem;
  margin-bottom: 2rem;

  div {
    display: flex;
    justify-content: space-between;
    flex-direction: column;
    width: 50%;
    margin-bottom: 0.5rem;

    span:first-child {
      opacity: 0.8;
      font-size: 12px;
    }

    span:last-child {
      font-weight: 700;
      font-size: 34px;
      line-height: 1;
      white-space: nowrap;
    }
  }
}

.loading {
  color: var(--anzhiyu-white);
  opacity: 0.8;
  margin-top: 1rem;
}

.error {
  color: #ff6b6b;
  opacity: 0.8;
  margin-top: 1rem;
  font-size: 14px;
}

.post-tips {
  color: var(--anzhiyu-gray);
  font-size: 14px;
  position: absolute;
  bottom: 1rem;
  left: 2rem;

  a {
    color: var(--anzhiyu-gray) !important;
    border: none !important;

    &:hover {
      color: var(--anzhiyu-main) !important;
      background: none !important;
    }
  }
}

.banner-button-group {
  position: absolute;
  bottom: 1.5rem;
  right: 2rem;

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
    }

    .banner-button-text {
      margin-left: 4px;
    }

    &:hover {
      background: var(--anzhiyu-main);
      color: var(--anzhiyu-white);
      border-radius: 20px !important;
    }
  }
}
</style>
