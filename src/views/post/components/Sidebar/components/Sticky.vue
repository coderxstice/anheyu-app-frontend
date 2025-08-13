<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-05 18:31:42
 * @LastEditTime: 2025-08-13 13:42:14
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

// 引入所有需要用到的侧边栏卡片组件
import TagsCard from "./TagsCard.vue";
import CardWebInfo from "./CardWebInfo.vue";
import CardToc from "./CardToc.vue";
import CardRecentPost from "./CardRecentPost.vue";
import Archives from "./Archives.vue";

const props = defineProps({
  config: {
    type: Object,
    default: () => ({})
  }
});

// 1. 获取当前路由信息
const route = useRoute();

// 2. 创建一个计算属性，判断当前是否为文章详情页
const isPostDetailPage = computed(() => route.name === "PostDetail");

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
    <template v-if="isPostDetailPage">
      <CardToc />
      <CardRecentPost />
    </template>

    <template v-else>
      <div class="card-widget">
        <TagsCard v-if="tagsConfig" :config="tagsConfig" />
        <hr v-if="tagsConfig && webInfoConfig" />
        <Archives />
        <hr v-if="tagsConfig && webInfoConfig" />
        <CardWebInfo v-if="webInfoConfig" :config="webInfoConfig" />
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.sticky-container {
  position: sticky;
  top: calc(60px + 0.625rem);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
