<script setup lang="ts">
import type { TabOption } from "./types";
import { ref, watch, onMounted } from "vue";

interface Props {
  tabs?: TabOption[];
}

defineOptions({
  name: "AnalysisChartsTabs"
});

const props = withDefaults(defineProps<Props>(), {
  tabs: () => []
});

const activeTab = ref<string>("");

const selectTab = (value: string) => {
  activeTab.value = value;
};

// 使用 watch 监听 tabs 变化，确保初始化时正确设置 activeTab
watch(
  () => props.tabs,
  newTabs => {
    if (!activeTab.value && newTabs && newTabs.length > 0) {
      activeTab.value = newTabs[0].value;
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (!activeTab.value && props.tabs.length > 0) {
    activeTab.value = props.tabs[0].value;
  }
});
</script>

<template>
  <div class="charts-tabs-card">
    <div class="tabs-header">
      <div class="tabs-list">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="tab-trigger"
          :class="{ active: activeTab === tab.value }"
          @click="selectTab(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>
    <div class="tabs-content">
      <template v-for="tab in tabs" :key="tab.value">
        <div v-show="activeTab === tab.value" class="tab-panel">
          <slot :name="tab.value"></slot>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.charts-tabs-card {
  padding: 1rem 1.25rem 1.5rem;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);
}

.tabs-header {
  margin-bottom: 1rem;
}

.tabs-list {
  display: inline-flex;
  gap: 0.25rem;
  padding: 0.25rem;
  background: var(--anzhiyu-card-bg-grey);
  border-radius: 8px;
}

.tab-trigger {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--anzhiyu-secondtext);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 6px;
  transition: all var(--anzhiyu-transition-duration);

  &:hover {
    color: var(--anzhiyu-fontcolor);
    background: var(--anzhiyu-card-bg);
  }

  &.active {
    color: var(--anzhiyu-fontcolor);
    background: var(--anzhiyu-card-bg);
    box-shadow: var(--anzhiyu-shadow-border);
  }
}

.tabs-content {
  min-height: 300px;
}

.tab-panel {
  width: 100%;
}
</style>

