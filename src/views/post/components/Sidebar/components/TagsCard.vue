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
const { tags: tagList, areTagsLoading: loading } = storeToRefs(articleStore);
const { fetchTags } = articleStore;

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
  position: relative;
  display: flex;
  flex-flow: row wrap;
  gap: 4px;
  max-height: 360px;
  overflow: hidden;

  a {
    padding: 0 0.375rem;
    font-size: 1rem;
    color: var(--anzhiyu-fontcolor);
    cursor: pointer;
    border-radius: 8px;

    &.is-highlight {
      font-weight: bold;
      color: var(--anzhiyu-theme);
    }

    &:hover {
      color: var(--anzhiyu-card-bg);
      background: var(--anzhiyu-lighttext);
      border-radius: 4px;
      box-shadow: var(--anzhiyu-shadow-theme);
    }

    sup {
      margin-left: 2px;
      font-size: 0.7em;
      opacity: 0.6;
    }
  }

  &.is-overflow::after {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 150px;
    pointer-events: none;
    content: "";
    background-image: linear-gradient(
      to top,
      var(--anzhiyu-card-bg),
      transparent
    );
  }
}

.loading-tip,
.empty-tip {
  padding: 2rem 0;
  font-size: 14px;
  color: var(--anzhiyu-secondtext);
  text-align: center;
}

.card-footer {
  text-align: center;

  .view-all-button {
    display: flex;
    justify-content: center;
    width: 100%;
    padding: 4px 0;
    font-size: 14px;
    color: var(--anzhiyu-fontcolor);
    text-align: center;
    user-select: none;
    background: var(--anzhiyu-secondbg);
    border: var(--style-border-always);
    border-radius: 8px;
    box-shadow: var(--anzhiyu-shadow-border);

    &:hover {
      color: var(--anzhiyu-white);
      background-color: var(--anzhiyu-theme);
      border-color: var(--anzhiyu-theme);
      box-shadow: var(--anzhiyu-shadow-theme);
    }
  }
}
</style>
