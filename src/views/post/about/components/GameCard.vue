<!--
 * @Description: 游戏卡片组件
 * @Author: 安知鱼
 * @Date: 2025-01-27
-->
<script setup lang="ts">
import type { Game } from "@/types/about";

interface Props {
  game: Game;
}

defineProps<Props>();
</script>

<template>
  <div
    class="author-content-item game-yuanshen"
    :style="`background: url(${game.background}) top / cover no-repeat;`"
  >
    <div class="card-content">
      <div class="author-content-item-tips">{{ game.tips }}</div>
      <span class="author-content-item-title">{{ game.title }}</span>
      <div class="content-bottom">
        <div class="icon-group">
          <div
            class="loading-bar"
            role="presentation"
            aria-hidden="true"
            :style="game.title !== '原神' ? 'display: none' : ''"
          />
        </div>
        <div class="tips game-yuanshen-uid">{{ game.uid }}</div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.game-yuanshen {
  background-size: cover;
  min-height: 300px;
  overflow: hidden;
  color: var(--anzhiyu-white);
  width: 59%;
  flex: 1.5;
  --loadingbar-background-color: #2c2b30;
  --loadingbar-prospect-color: #ece5d8;

  @media screen and (max-width: 768px) {
    width: 100% !important;

    .content-bottom {
      padding-bottom: 10px;
    }

    .game-yuanshen-uid {
      display: none;
    }
  }

  &::after {
    box-shadow: 0 -69px 203px 11px #575d8b inset;
    position: absolute;
    content: "";
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
  }

  .content-bottom {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .icon-group {
      display: flex;
      position: relative;

      i {
        display: inline-block;
        width: 143px;
        height: 18px;
        margin-right: 0.5rem;
      }
    }
  }
}

// 加载条动画
:root {
  --loadingbar-background-color: #2c2b30;
  --loadingbar-prospect-color: #ece5d8;
}

.loading-bar {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 500px;
  height: 62.5px;
  transform: translate(-25%, -50%) scale(0.5);
  transition: all 0.5s;
  user-select: none;
  overflow: hidden;

  @media screen and (max-width: 719px) {
    display: none;

    @media (orientation: landscape) {
      display: block !important;
      transform: translate(-50%, -50%) scale(0.7) !important;
    }
  }

  &::after {
    content: "";
    position: absolute;
    top: 500px;
    left: 0;
    filter: drop-shadow(0 -500px 0 var(--loadingbar-prospect-color));
    width: 500px;
    height: 62.5px;
    background: url("https://yuanshen.site/imgs/loading-bar.png") no-repeat left
      100%;
    background-size: 500px 62.5px;
    background-position-x: 0;
  }
}

.game-yuanshen:hover .loading-bar::after {
  animation: loading-bar 3.5s cubic-bezier(0.28, 0.11, 0.32, 1) infinite
    forwards;
}

@keyframes loading-bar {
  0% {
    width: 0;
    background-size: 500px 62.5px;
  }
  83% {
    width: 475px;
  }
  83.1% {
    width: 475px;
  }
  100% {
    width: 500px;
  }
}

@supports not (filter: drop-shadow(0 0 0 #fff)) {
  .loading-bar:before {
    content: "Your browser does not support the animation";
  }
}
</style>
