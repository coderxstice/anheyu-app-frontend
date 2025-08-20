<!--
 * @Description: 照片卡片组件
 * @Author: 安知鱼
 * @Date: 2025-01-27
-->
<script setup lang="ts">
interface Props {
  photoUrl: string;
}

defineProps<Props>();
</script>

<template>
  <div class="author-content-item myphoto">
    <img class="author-content-img no-lightbox" alt="自拍" :src="photoUrl" />
  </div>
</template>

<style lang="scss" scoped>
.myphoto {
  height: 60%;
  min-height: 240px;
  position: relative;
  overflow: hidden;
  width: 39%;
  display: flex;
  align-items: center;
  justify-content: center;

  @media screen and (max-width: 768px) {
    width: 100% !important;
  }

  img {
    position: absolute;
    min-width: 100%;
    object-fit: cover;
    transition: 0.6s;
    animation: coverIn 2s ease-out forwards;
    transition: transform 2s ease-out !important;
  }

  &:hover img {
    transform: scale(1.1);
  }
}

@keyframes coverIn {
  0% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}
</style>
