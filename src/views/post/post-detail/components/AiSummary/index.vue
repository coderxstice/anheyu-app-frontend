<script setup lang="ts">
import { ref, computed, type PropType } from "vue";

defineOptions({
  name: "AiSummary"
});

const props = defineProps({
  summary: {
    type: Array as PropType<string[]>,
    required: true,
    default: () => []
  }
});

const currentSummaryIndex = ref(0);
const rotationCount = ref(0);
const isAnimating = ref(false);

const displayedSummary = computed(() => {
  if (!props.summary || props.summary.length === 0) {
    return "";
  }
  return props.summary[currentSummaryIndex.value];
});

const refreshSummary = () => {
  if (isAnimating.value || !props.summary || props.summary.length <= 1) return;

  rotationCount.value++;
  isAnimating.value = true;

  currentSummaryIndex.value =
    (currentSummaryIndex.value + 1) % props.summary.length;

  setTimeout(() => {
    isAnimating.value = false;
  }, 300);
};
</script>

<template>
  <div class="post-ai-description">
    <div class="ai-title">
      <i class="anzhiyufont anzhiyu-icon-bilibili" />
      <div class="ai-title-text">文章摘要</div>
      <el-tooltip content="换一个" placement="bottom" :show-arrow="false">
        <i
          class="anzhiyufont anzhiyu-icon-arrow-rotate-right"
          title="换一个"
          :class="{ 'is-animating': isAnimating }"
          :style="{ transform: `rotate(${rotationCount * 360}deg)` }"
          @click="refreshSummary"
        />
      </el-tooltip>

      <div id="ai-tag">AnZhiYu GPT</div>
    </div>
    <div class="ai-explanation" v-html="displayedSummary" />
  </div>
</template>

<style lang="scss" scoped>
.post-ai-description {
  background: var(--anzhiyu-secondbg);
  border-radius: 12px;
  padding: 12px 20px;
  line-height: 1.3;
  border: var(--style-border-always);
  margin-top: 8px;
  min-height: 100px;
}

.ai-title {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  color: var(--anzhiyu-secondtext);
  font-size: 0.9rem;
  gap: 5px;
}

.ai-title .ai-title-text {
  font-weight: bold;
  color: var(--anzhiyu-main);
  user-select: none;
}

.ai-title .anzhiyu-icon-arrow-rotate-right {
  color: var(--anzhiyu-main);
}
.ai-title .anzhiyu-icon-bilibili {
  font-size: 19px;
  color: var(--anzhiyu-main);
  transform: translateY(1px);
  user-select: none;
}

.ai-title .anzhiyufont {
  cursor: pointer;
  transition: color 0.3s;
}

.ai-title .anzhiyufont:hover {
  color: var(--anzhiyu-main);
}

.ai-title .anzhiyufont.anzhiyu-icon-arrow-rotate-right {
  display: inline-block;
  transition:
    transform 0.3s ease-out,
    opacity 0.3s ease-out;
}

.ai-title .anzhiyufont.anzhiyu-icon-arrow-rotate-right.is-animating {
  opacity: 0.2;
}

.ai-title #ai-tag {
  margin-left: auto;
  font-size: 0.8rem;
  background: var(--anzhiyu-main);
  color: var(--anzhiyu-white);
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
}

.ai-explanation {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--anzhiyu-fontcolor);
}
</style>
