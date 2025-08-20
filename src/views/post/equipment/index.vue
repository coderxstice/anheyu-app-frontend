<!--
 * @Description: 装备页面
 * @Author: 安知鱼
 * @Date: 2025-08-20 10:07:07
 * @LastEditTime: 2025-08-20 11:43:29
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import AnBannerCard from "@/components/AnBannerCard";
import EquipmentList from "./components/EquipmentList.vue";
import PostComment from "../components/PostComment/index.vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { computed } from "vue";
import { useRoute } from "vue-router";

defineOptions({
  name: "Equipment"
});

const route = useRoute();
const siteConfigStore = useSiteConfigStore();

const equipmentConfig = computed(
  () => siteConfigStore.getSiteConfig?.post?.equipment
);

// 装备数据从配置中获取
const equipmentData = computed(() => equipmentConfig.value?.list || []);
</script>

<template>
  <div class="equipment">
    <AnBannerCard
      :tips="equipmentConfig?.banner?.title"
      :title="equipmentConfig?.banner?.description"
      :description="equipmentConfig?.banner?.tip"
      :background-image="equipmentConfig?.banner?.background"
      :height="300"
    />
    <EquipmentList :data="equipmentData" />

    <div class="link-comment-section">
      <PostComment :target-path="route.path" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.equipment {
  max-width: 1400px;
  padding: 1.5rem;
  margin: 0 auto;
}
.link-comment-section {
  margin-top: 2rem;
}
</style>
