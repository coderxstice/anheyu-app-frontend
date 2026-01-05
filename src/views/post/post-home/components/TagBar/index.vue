<script setup lang="ts">
import { ref, onMounted, watchEffect } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getTagList } from "@/api/post";
import type { PostTag } from "@/api/post/type";

defineOptions({
  name: "TagBar"
});

const router = useRouter();
const route = useRoute();

const tags = ref<PostTag[]>([]);
const selectedTagName = ref<string | null>(null);

// 获取所有标签
const fetchTags = async () => {
  try {
    const { data } = await getTagList("count");
    tags.value = data;
  } catch (error) {
    console.error("获取标签列表失败:", error);
  }
};

// 点击标签后跳转
const handleSelect = (tag: PostTag) => {
  router.push(`/tags/${tag.name}/`);
};

// 监听路由变化，更新当前选中的标签
watchEffect(() => {
  selectedTagName.value = (route.params.name as string) || null;
});

onMounted(() => {
  fetchTags();
});
</script>

<template>
  <div class="tag-bar-container">
    <router-link
      v-for="tag in tags"
      :key="tag.id"
      class="tag-item"
      :class="{ selected: selectedTagName === tag.name }"
      :to="`/tags/${tag.name}/`"
    >
      <span class="tags-punctuation">#</span>
      <span class="tag-name">{{ tag.name }}</span>
      <span class="tags-page-count">{{ tag.count }}</span>
    </router-link>
  </div>
</template>

<style lang="scss" scoped>
.tag-bar-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 0.8rem;
  padding: 1rem 1.25rem;
  margin-bottom: 0.5rem;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;
  transition:
    background-color 0.3s,
    border-color 0.3s;
  animation: slide-in 0.6s 0.1s backwards;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--anzhiyu-fontcolor);
  text-decoration: none;
  cursor: pointer;
  background-color: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 8px;
  transition: all 0.2s ease-in-out;

  &:hover {
    color: var(--anzhiyu-white);
    background: var(--anzhiyu-main);

    .tags-punctuation {
      color: var(--anzhiyu-white);
    }

    .tags-page-count {
      color: var(--anzhiyu-main);
      background-color: var(--anzhiyu-white);
    }
  }

  &.selected {
    color: var(--anzhiyu-white);
    background-color: var(--anzhiyu-main);
    border-color: var(--anzhiyu-main);

    .tags-punctuation {
      color: var(--anzhiyu-white);
    }

    .tags-page-count {
      color: var(--anzhiyu-main);
      background-color: var(--anzhiyu-white);
    }
  }
}

.tags-punctuation {
  margin-right: 0.2rem;
  font-weight: 500;
  color: var(--anzhiyu-secondtext);
}

.tags-page-count {
  padding: 0px 6px;
  margin-left: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--anzhiyu-card-bg);
  background-color: var(--anzhiyu-gray-200, #e9ecef);
  border-radius: 5px;
  transition: all 0.2s ease-in-out;
}
</style>
