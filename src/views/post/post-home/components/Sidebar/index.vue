<script setup lang="ts">
import { computed } from "vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import AuthorInfoCard from "./components/AuthorInfoCard.vue";
import CardWechat from "./components/CardWechat.vue";
import TagsCard from "./components/TagsCard.vue";
import Archives from "./components/Archives.vue";

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

const tagsConfig = computed(() => {
  if (!siteConfig.value?.sidebar?.tags?.enable) return null;
  return {
    highlight: siteConfig.value.sidebar.tags.highlight || []
  };
});

const archivesConfig = computed(() => {
  if (siteConfig.value?.sidebar?.archives?.enable) {
    return true;
  } else {
    return false;
  }
});
</script>

<template>
  <aside class="aside-content">
    <AuthorInfoCard v-if="authorInfoConfig" :config="authorInfoConfig" />
    <CardWechat v-if="wechatConfig" :config="wechatConfig" />

    <div class="sticky-container">
      <TagsCard v-if="tagsConfig" :config="tagsConfig" />
      <Archives v-if="archivesConfig" />
    </div>
  </aside>
</template>

<style lang="scss" scoped>
.aside-content {
  width: 280px;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

@media (max-width: 992px) {
  .aside-content {
    display: none;
  }
}

.sticky-container {
  position: sticky;
  top: calc(60px + 0.625rem);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
