<!--
 * @Description: Buff卡片组件
 * @Author: 安知鱼
 * @Date: 2025-01-27
-->
<script setup lang="ts">
import type { Buff } from "@/types/about";

interface Props {
  buff: Buff;
}

defineProps<Props>();
</script>

<template>
  <div class="author-content-item buff">
    <div class="card-content">
      <div class="author-content-item-tips">{{ buff.tips }}</div>
      <span class="buff-title">
        <span style="opacity: 0.6; margin-bottom: 8px">{{ buff.top }}</span>
        <span>{{ buff.bottom }}</span>
      </span>
    </div>
    <div class="card-background-icon">
      <i class="anzhiyufont anzhiyu-icon-dice-d20" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.buff {
  height: 200px;
  font-size: 36px;
  font-weight: 700;
  line-height: 1.1;
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  justify-content: center;
  background: linear-gradient(120deg, #ff27e8 0, #ff8000 100%);
  color: var(--anzhiyu-white);
  background-size: 200%;
  animation: gradient 15s ease infinite;
  min-height: 200px;
  height: fit-content;
  width: 59%;

  @media screen and (max-width: 768px) {
    width: 100% !important;
  }

  .card-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .buff-title {
    display: flex;
    flex-direction: column;
  }
}

.card-background-icon {
  font-size: 12rem;
  opacity: 0.2;
  position: absolute;
  right: 0;
  bottom: -40%;
  transform: rotate(30deg);
  transition: 2s ease-in-out;

  i {
    font-size: 12rem;
  }
}

.author-content-item:hover .card-background-icon {
  transform: rotate(20deg);
}

@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>
