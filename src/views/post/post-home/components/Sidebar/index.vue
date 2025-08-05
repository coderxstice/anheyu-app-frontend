<script setup lang="ts">
import { computed } from "vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import AuthorInfoCard from "./components/AuthorInfoCard.vue";
import CardWechat from "./components/CardWechat.vue";
import TagsCard from "./components/TagsCard.vue";

defineOptions({
  name: "Sidebar"
});

const siteConfigStore = useSiteConfigStore();
const siteConfig = computed(() => siteConfigStore.getSiteConfig);

const authorInfoConfig = computed(() => {
  if (!siteConfig.value?.sidebar?.author?.enable) return null;
  return {
    description: siteConfig.value.sidebar.author.description,
    statusImg: siteConfig.value.sidebar.author.statusImg,
    skills: siteConfig.value.sidebar.author.skills,
    social: siteConfig.value.sidebar.author.social,
    userAvatar: siteConfig.value.USER_AVATAR,
    ownerName: siteConfig.value.footer.owner.name,
    subTitle: siteConfig.value.SUB_TITLE
  };
});

const wechatConfig = computed(() => {
  if (!siteConfig.value?.sidebar?.wechat?.enable) return null;
  return {
    face: siteConfig.value.sidebar.wechat.face,
    backFace: siteConfig.value.sidebar.wechat.backFace
  };
});
</script>

<template>
  <aside class="sidebar-wrapper">
    <AuthorInfoCard v-if="authorInfoConfig" :config="authorInfoConfig" />
    <CardWechat v-if="wechatConfig" :config="wechatConfig" />
    <TagsCard />
  </aside>
</template>

<style lang="scss" scoped>
.sidebar-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
