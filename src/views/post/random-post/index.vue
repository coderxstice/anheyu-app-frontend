<script setup lang="ts">
import { useArticleStore } from "@/store/modules/articleStore";
import { onMounted } from "vue";
defineOptions({
  name: "RandomPost"
});

const articleStore = useArticleStore();

const toRandomPost = () => {
  articleStore.navigateToRandomArticle();
};

onMounted(() => {
  toRandomPost();
});
</script>

<template>
  <div>test</div>
</template>

<style lang="scss" scoped></style>
