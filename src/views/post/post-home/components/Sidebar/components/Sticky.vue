<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-05 18:31:42
 * @LastEditTime: 2025-08-06 09:46:34
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { computed } from "vue";
import TagsCard from "./TagsCard.vue";
import Archives from "./Archives.vue";
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
  const { postCountEnable, runtimeEnable, wordCountEnable } =
    props.config?.sidebar?.siteinfo || {};

  const launch_time = props.config?.footer?.runtime?.launch_time || null;

  if (!postCountEnable || !runtimeEnable || !wordCountEnable || !launch_time) {
    return null;
  }

  return { postCountEnable, runtimeEnable, wordCountEnable, launch_time };
});

defineOptions({
  name: "Sticky"
});
</script>

<template>
  <div class="sticky-container">
    <div class="card-widget">
      <TagsCard v-if="tagsConfig" :config="tagsConfig" />
      <hr />
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
