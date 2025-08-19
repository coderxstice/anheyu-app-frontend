<!-- src/views/post/link/index.vue -->
<script setup lang="ts">
// 1. 导入 ref
import { computed, onMounted, ref } from "vue";
import { useLinkStore } from "@/store/modules/link";
import LinkTopBanner from "./components/LinkTopBanner.vue";
import LinkListSection from "./components/LinkListSection.vue";
import ApplyLink from "./components/ApplyLink.vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

defineOptions({
  name: "PostLink"
});

const linkStore = useLinkStore();
const siteConfigStore = useSiteConfigStore();
const friendLinkApplyCondition = computed(
  () => siteConfigStore.getSiteConfig?.FRIEND_LINK_APPLY_CONDITION
);

onMounted(() => {
  linkStore.fetchInitialBannerLinks();
});

const applyLinkSectionRef = ref<HTMLElement | null>(null);

// 3. 创建处理滚动的方法
const handleScrollToApply = () => {
  if (applyLinkSectionRef.value) {
    const offset = 80;
    const elementPosition =
      applyLinkSectionRef.value.getBoundingClientRect().top +
      window.pageYOffset;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth"
    });
  }
};
</script>

<template>
  <div class="post-link-page">
    <LinkTopBanner @scrollToApply="handleScrollToApply" />

    <LinkListSection />

    <div ref="applyLinkSectionRef">
      <ApplyLink :friendLinkApplyCondition="friendLinkApplyCondition" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.post-link-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}
</style>
