<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from "vue";
import { storeToRefs } from "pinia";
import { useArticleStore } from "@/store/modules/articleStore";

defineOptions({
  name: "TagsCard"
});

const props = defineProps({
  config: {
    type: Object,
    default: () => ({ highlight: [] })
  }
});

// --- 从 Store 获取状态和 actions ---
const articleStore = useArticleStore();
// 使用 storeToRefs 并通过别名，使模板代码无需改动
const { tags: tagList, areTagsLoading: loading } = storeToRefs(articleStore);
const { fetchTags } = articleStore; // 获取 action

// --- UI 相关的本地状态保持不变 ---
const tagCloudRef = ref<HTMLElement | null>(null);
const isOverflow = ref(false);

const checkOverflow = () => {
  if (tagCloudRef.value) {
    isOverflow.value =
      tagCloudRef.value.scrollHeight > tagCloudRef.value.clientHeight;
  }
};

// 监视从 store 来的 tagList，当它变化时检查溢出
watch(tagList, async () => {
  if (tagList.value.length > 0) {
    await nextTick();
    checkOverflow();
  }
});

onMounted(() => {
  // 调用 store 中的 action 来获取数据
  fetchTags();
  window.addEventListener("resize", checkOverflow);
});

onUnmounted(() => {
  window.removeEventListener("resize", checkOverflow);
});
</script>

<template>
  <div class="card-tags">
    <div class="card-content">
      <div v-if="loading" class="loading-tip">标签云加载中...</div>
      <div
        v-else-if="tagList.length > 0"
        ref="tagCloudRef"
        class="card-tag-cloud"
        :class="{ 'is-overflow': isOverflow }"
      >
        <router-link
          v-for="tag in tagList"
          :key="tag.id"
          :to="`/tags/${tag.name}/`"
          :class="{ 'is-highlight': config.highlight.includes(tag.id) }"
        >
          {{ tag.name }}<sup>{{ tag.count }}</sup>
        </router-link>
      </div>
      <div v-else class="empty-tip">暂无标签</div>
    </div>
    <div v-if="isOverflow" class="card-footer">
      <router-link to="/tags" class="view-all-button"> 查看全部 </router-link>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.card-tag-cloud {
  max-height: 360px;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 4px;
  a {
    color: var(--anzhiyu-fontcolor);
    padding: 0 0.375rem;
    font-size: 1rem;
    border-radius: 8px;
    cursor: pointer;

    &.is-highlight {
      color: var(--anzhiyu-theme);
      font-weight: bold;
    }

    &:hover {
      background: var(--anzhiyu-lighttext);
      color: var(--anzhiyu-card-bg);
      box-shadow: var(--anzhiyu-shadow-theme);
      border-radius: 4px;
    }

    sup {
      opacity: 0.6;
      margin-left: 2px;
      font-size: 0.7em;
    }
  }

  &.is-overflow::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 150px;
    background-image: linear-gradient(
      to top,
      var(--anzhiyu-card-bg),
      transparent
    );
    pointer-events: none;
  }
}

.loading-tip,
.empty-tip {
  color: var(--anzhiyu-secondtext);
  font-size: 14px;
  text-align: center;
  padding: 2rem 0;
}

.card-footer {
  text-align: center;

  .view-all-button {
    width: 100%;
    text-align: center;
    background: var(--anzhiyu-secondbg);
    color: var(--anzhiyu-fontcolor);
    border-radius: 8px;
    display: flex;
    justify-content: center;
    font-size: 14px;
    user-select: none;
    padding: 4px 0;
    border: var(--style-border-always);
    box-shadow: var(--anzhiyu-shadow-border);

    &:hover {
      background-color: var(--anzhiyu-theme);
      color: var(--anzhiyu-white);
      border-color: var(--anzhiyu-theme);
      box-shadow: var(--anzhiyu-shadow-theme);
    }
  }
}
</style>
