<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-05 18:31:42
 * @LastEditTime: 2025-10-10 10:59:44
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { computed, inject, ref, onMounted, watch, nextTick } from "vue";
import type { Ref } from "vue";
import { useRoute } from "vue-router";
import type { PostCategory } from "@/api/post/type";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

import TagsCard from "./TagsCard.vue";
import CardWebInfo from "./CardWebInfo.vue";
import CardToc from "./CardToc.vue";
import CardRecentPost from "./CardRecentPost.vue";
import Archives from "./Archives.vue";
import CardSeriesPost from "./CardSeriesPost.vue";

const props = defineProps({
  config: {
    type: Object,
    default: () => ({})
  }
});

const route = useRoute();
const isPostDetailPage = computed(() => route.name === "PostDetail");

const seriesCategory = inject<Ref<PostCategory | null>>(
  "seriesCategory",
  ref(null)
);

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

// 获取自定义侧边栏内容
const siteConfigStore = useSiteConfigStore();
const customSidebar = computed(() => {
  return siteConfigStore.siteConfig?.CUSTOM_SIDEBAR || "";
});

// 自定义侧边栏容器引用
const customSidebarRef = ref<HTMLDivElement | null>(null);

// 执行自定义侧边栏中的脚本
const executeScripts = () => {
  if (!customSidebarRef.value) return;

  // 获取所有 script 标签
  const scripts = customSidebarRef.value.querySelectorAll("script");

  scripts.forEach(oldScript => {
    // 创建新的 script 元素
    const newScript = document.createElement("script");

    // 复制所有属性
    Array.from(oldScript.attributes).forEach(attr => {
      newScript.setAttribute(attr.name, attr.value);
    });

    // 复制脚本内容
    if (oldScript.src) {
      // 外部脚本
      newScript.src = oldScript.src;
    } else {
      // 内联脚本
      let scriptContent = oldScript.textContent || "";

      // 处理 DOMContentLoaded 事件监听器，改为立即执行
      scriptContent = scriptContent.replace(
        /document\.addEventListener\s*\(\s*['"]DOMContentLoaded['"]\s*,\s*function\s*\(\s*\)\s*\{([\s\S]*?)\}\s*\)\s*;?/g,
        "(function(){$1})();"
      );

      // 也处理箭头函数形式的 DOMContentLoaded
      scriptContent = scriptContent.replace(
        /document\.addEventListener\s*\(\s*['"]DOMContentLoaded['"]\s*,\s*\(\s*\)\s*=>\s*\{([\s\S]*?)\}\s*\)\s*;?/g,
        "(function(){$1})();"
      );

      newScript.textContent = scriptContent;
    }

    // 替换旧的 script 标签
    oldScript.parentNode?.replaceChild(newScript, oldScript);
  });
};

// 监听自定义侧边栏内容变化
watch(customSidebar, async () => {
  if (customSidebar.value) {
    await nextTick();
    executeScripts();
  }
});

// 组件挂载时执行一次
onMounted(async () => {
  if (customSidebar.value) {
    await nextTick();
    executeScripts();
  }
});

defineOptions({
  name: "Sticky"
});
</script>

<template>
  <div class="sticky-container">
    <!-- 自定义侧边栏 -->
    <div v-if="customSidebar" class="card-widget">
      <div ref="customSidebarRef" v-html="customSidebar" />
    </div>

    <template v-if="isPostDetailPage">
      <CardSeriesPost v-if="seriesCategory" />
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
