<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const fps = ref(0);
const fpsHistory = ref<number[]>([]);
const avgFps = ref(0);
const minFps = ref(999);
let frameCount = 0;
let lastTime = performance.now();
let animationId: number | null = null;

const updateFps = () => {
  frameCount++;
  const currentTime = performance.now();
  const elapsed = currentTime - lastTime;

  if (elapsed >= 1000) {
    const currentFps = Math.round((frameCount * 1000) / elapsed);
    fps.value = currentFps;

    // 记录历史
    fpsHistory.value.push(currentFps);
    if (fpsHistory.value.length > 60) {
      fpsHistory.value.shift();
    }

    // 计算平均值和最小值
    avgFps.value = Math.round(
      fpsHistory.value.reduce((a, b) => a + b, 0) / fpsHistory.value.length
    );
    minFps.value = Math.min(...fpsHistory.value);

    frameCount = 0;
    lastTime = currentTime;
  }

  animationId = requestAnimationFrame(updateFps);
};

const getFpsColor = (value: number) => {
  if (value >= 55) return "#4ade80"; // 绿色
  if (value >= 30) return "#facc15"; // 黄色
  return "#ef4444"; // 红色
};

onMounted(() => {
  animationId = requestAnimationFrame(updateFps);
});

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
});
</script>

<template>
  <div class="fps-monitor">
    <div class="fps-value" :style="{ color: getFpsColor(fps) }">
      {{ fps }} <span class="fps-label">FPS</span>
    </div>
    <div class="fps-stats">
      <span>Avg: {{ avgFps }}</span>
      <span :style="{ color: getFpsColor(minFps) }">Min: {{ minFps }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.fps-monitor {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 99999;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  font-family: "Monaco", "Consolas", monospace;
  font-size: 12px;
  color: #fff;
  backdrop-filter: blur(4px);
  user-select: none;
  pointer-events: none;

  .fps-value {
    font-size: 24px;
    font-weight: bold;
    line-height: 1;

    .fps-label {
      font-size: 12px;
      font-weight: normal;
      opacity: 0.7;
    }
  }

  .fps-stats {
    display: flex;
    gap: 8px;
    margin-top: 4px;
    font-size: 10px;
    opacity: 0.8;
  }
}
</style>
