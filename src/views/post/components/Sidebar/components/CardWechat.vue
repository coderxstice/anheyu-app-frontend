<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-04 17:57:59
 * @LastEditTime: 2025-08-06 15:10:28
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import type { PropType } from "vue";

interface WechatConfig {
  face: string;
  backFace: string;
  blurBackground: string;
}

const props = defineProps({
  config: {
    type: Object as PropType<WechatConfig>,
    required: true
  }
});
</script>

<template>
  <div
    class="card-widget card-wechat"
    :style="{ '--blur-background': `url(${config.blurBackground})` }"
  >
    <div id="flip-wrapper">
      <div id="flip-content">
        <div
          class="face"
          :style="{
            backgroundImage: `url(${config.face})`
          }"
        />
        <div
          class="back face"
          :style="{
            backgroundImage: `url(${config.backFace})`
          }"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.card-wechat {
  background: #57bd6a;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  cursor: pointer;
  height: 110px;
  &:hover:before {
    top: 100%;
    opacity: 0;
    transition: 0.3s ease-out;
  }
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: var(--blur-background);
    background-position: center center;
    background-repeat: no-repeat;
    background-size: cover;
    backdrop-filter: blur(10px);
    transition: 0.2s cubic-bezier(0.45, 0.04, 0.43, 1.21);
  }
}
[data-theme="dark"] .card-wechat {
  background-color: #121121;
}
#flip-wrapper {
  perspective: 1000px;
  position: relative;
  width: 235px;
  height: 110px;
  z-index: 1;
}
#flip-content {
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: cubic-bezier(0, 0, 0, 1.29) 0.3s;
}
#flip-content .face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  background-size: 100%;
}
#flip-content .back.face {
  display: block;
  transform: rotateY(180deg);
  box-sizing: border-box;
  background-size: 100%;
}
#flip-wrapper:hover #flip-content {
  transform: rotateY(180deg);
}
</style>
