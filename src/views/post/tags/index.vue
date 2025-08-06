<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getTagList } from "@/api/post";
import type { PostTag } from "@/api/post/type";
import { useRouter } from "vue-router";

defineOptions({
  name: "PostTagsAll"
});

const tags = ref<PostTag[]>([]);
const loading = ref(true);
const router = useRouter();

// 获取标签列表
const fetchTags = async () => {
  loading.value = true;
  try {
    const { data } = await getTagList("count");
    tags.value = data;
  } catch (error) {
    console.error("获取标签列表失败:", error);
  } finally {
    loading.value = false;
  }
};

// 跳转到标签详情页
const goToTag = (tagName: string) => {
  router.push({ path: `/tags/${tagName}` });
};

onMounted(() => {
  fetchTags();
});
</script>

<template>
  <div v-loading="loading" class="tag-cloud-amount">
    <h1 class="page-title">标签</h1>
    <div class="tag-cloud-list">
      <a
        v-for="tag in tags"
        :key="tag.id"
        class="tag-item"
        @click="goToTag(tag.name)"
      >
        <i class="anzhiyufont anzhiyu-icon-hashtag tags-punctuation" />
        {{ tag.name }}
        <span class="tags-page-count">{{ tag.count }}</span>
      </a>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.tag-cloud-amount {
  min-height: 400px;
  color: var(--anzhiyu-fontcolor);
  max-width: 1400px;
  margin: 0 auto;
  margin-top: 0.5rem;
}

.page-title {
  margin: 0.4rem 0 1rem 1rem;
  text-align: center;
  font-weight: 700;
  text-align: center;
  font-size: 2em;
}

.tag-cloud-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  text-align: center;

  animation: slide-in 0.6s 0.2s backwards;
}

.tag-item {
  display: flex;
  width: fit-content;
  color: var(--anzhiyu-fontcolor);
  font-size: 1.4rem;
  padding: 0.6rem 0.7rem;
  background: var(--anzhiyu-card-bg);
  margin: 0.7rem;
  border-radius: 12px;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform-style: preserve-3d;
  -webkit-transform-style: preserve-3d;
  border: var(--style-border-always);
  box-shadow: var(--anzhiyu-shadow-border);
  align-items: center;

  &:hover {
    background: var(--anzhiyu-main);
    box-shadow: var(--anzhiyu-shadow-blue);
    color: var(--anzhiyu-white);
    border: var(--style-border-hover);
  }
}

.tags-punctuation {
  margin-right: 0.25rem;
  opacity: 0.4;
  font-size: 1.2rem;
}

.tags-page-count {
  margin-left: 8px;
  background: var(--anzhiyu-secondbg);
  color: var(--anzhiyu-fontcolor);
  border-radius: 8px;
  line-height: 1;
  padding: 2px 4px;
  transition: 0.2s;
  font-size: 16px;
  min-width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  line-height: 1;
}
</style>
