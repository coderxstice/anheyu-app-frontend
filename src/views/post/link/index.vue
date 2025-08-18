<script setup lang="ts">
import { onMounted } from "vue";
import { useLinkStore } from "@/store/modules/link";
import LinkTopBanner from "./components/LinkTopBanner.vue";
import LinkListSection from "./components/LinkListSection.vue";

defineOptions({
  name: "PostLink"
});

// 初始化 store
const linkStore = useLinkStore();

onMounted(() => {
  linkStore.fetchInitialBannerLinks();
});
</script>

<template>
  <div class="post-link-page">
    <LinkTopBanner />

    <LinkListSection />
  </div>
</template>

<style lang="scss" scoped>
.post-link-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}
</style>
