<!--
 * @Description: 职业经历卡片组件
 * @Author: 安知鱼
 * @Date: 2025-01-27
-->
<script setup lang="ts">
import type { Careers } from "@/types/about";

interface Props {
  careers: Careers;
}

defineProps<Props>();
</script>

<template>
  <div
    class="author-content-item careers"
    :style="
      careers.img
        ? `background: url(${careers.img}) contain no-repeat right bottom`
        : ''
    "
  >
    <div class="card-content">
      <div class="author-content-item-tips">{{ careers.tips }}</div>
      <span class="author-content-item-title">{{ careers.title }}</span>
      <div class="careers-group">
        <div
          v-if="careers.list && careers.list.length > 0"
          class="careers-list"
        >
          <div
            v-for="(career, index) in careers.list"
            :key="index"
            class="career-item"
          >
            <div
              class="circle"
              :style="{ background: career.color || '#357ef5' }"
            />
            <div class="name">{{ career.desc }}</div>
          </div>
        </div>
        <div v-else class="careers-none">暂无职业经历</div>
      </div>
      <img
        v-if="careers.img"
        class="author-content-img no-lightbox"
        :alt="careers.tips"
        :src="careers.img"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.careers {
  min-height: 400px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position-x: right;
  background-position-y: bottom;

  .careers-group {
    display: flex;
    flex-direction: column;
    height: 100%;
    margin-top: 12px;
    margin-bottom: 12px;
  }

  .career-item {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-bottom: 8px;

    .circle {
      width: 16px;
      height: 16px;
      margin-right: 8px;
      border-radius: 50%;
    }

    .name {
      color: var(--anzhiyu-secondtext);
    }
  }

  .careers-none {
    color: var(--anzhiyu-secondtext);
    opacity: 0.6;
  }

  img {
    position: absolute;
    left: 0;
    bottom: 20px;
    width: 100%;
    transition: 0.6s;
    z-index: -1;
  }
}
</style>
