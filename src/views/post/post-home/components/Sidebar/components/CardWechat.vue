<script setup lang="ts">
import type { PropType } from "vue";

interface WechatConfig {
  face: string;
  backFace: string;
}

defineProps({
  config: {
    type: Object as PropType<WechatConfig>,
    required: true
  }
});
</script>

<template>
  <div class="card-widget card-wechat">
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
@use "../card.scss";

.card-wechat {
  background: #57bd6a;
  display: flex;
  justify-content: center;
  align-content: center;
  padding: 0;
  cursor: pointer;
  height: 110px;
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
