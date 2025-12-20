<script setup lang="ts">
interface Props {
  title: string;
}

defineOptions({
  name: "AnalysisChartCard"
});

withDefaults(defineProps<Props>(), {});
</script>

<template>
  <div class="chart-card">
    <div class="chart-card-header">
      <h3 class="chart-card-title">{{ title }}</h3>
    </div>
    <div class="chart-card-content">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
.chart-card {
  padding: 1.25rem;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);
  transition: all var(--anzhiyu-transition-duration);
}

.chart-card-header {
  margin-bottom: 1rem;
}

.chart-card-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--anzhiyu-fontcolor);
}

.chart-card-content {
  min-height: 200px;
}
</style>

