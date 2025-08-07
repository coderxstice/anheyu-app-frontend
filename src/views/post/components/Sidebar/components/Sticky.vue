<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-05 18:31:42
 * @LastEditTime: 2025-08-06 15:06:28
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { computed } from "vue";
import TagsCard from "./TagsCard.vue";
import CardWebInfo from "./CardWebInfo.vue";

const props = defineProps({
  config: {
    type: Object,
    default: () => ({})
  }
});

const tagsConfig = computed(() => {
  if (!props.config?.sidebar?.tags?.enable) return null;
  return {
    highlight: props.config.sidebar.tags.highlight || []
  };
});

const webInfoConfig = computed(() => {
  const { totalPostCount, runtimeEnable, totalWordCount } =
    props.config?.sidebar?.siteinfo || {};

  const launch_time = props.config?.footer?.runtime?.launch_time || null;

  return { totalPostCount, runtimeEnable, totalWordCount, launch_time };
});

defineOptions({
  name: "Sticky"
});
</script>

<template>
  <div class="sticky-container">
    <div class="card-widget">
      <TagsCard v-if="tagsConfig" :config="tagsConfig" />

      <hr v-if="tagsConfig && webInfoConfig" />

      <CardWebInfo v-if="webInfoConfig" :config="webInfoConfig" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "../card.scss";
.sticky-container {
  position: sticky;
  top: calc(60px + 0.625rem);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
