<script setup lang="ts">
import AuthorInfoCard from "./components/AuthorInfoCard.vue";
import TagsCard from "./components/TagsCard.vue";

defineOptions({
  name: "Sidebar"
});
</script>

<template>
  <div class="sidebar-wrapper">
    <AuthorInfoCard />

    <TagsCard />
  </div>
</template>

<style lang="scss" scoped>
.sidebar-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
