<script setup lang="ts">
import { computed, inject, ref } from "vue";
import type { Ref } from "vue";
import type { Article } from "@/api/post/type";
import { useArticleStore } from "@/store/modules/articleStore";

defineOptions({
  name: "CardRecentPost"
});

const articleStore = useArticleStore();
const defaultCover = articleStore.defaultCover;

const articles = inject<Ref<Article[]>>("recentArticles", ref([]));

const displayPosts = computed(() => articles.value.slice(0, 5));

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};
</script>
<template>
  <div v-if="displayPosts.length > 0" class="card-widget card-recent-post">
    <div class="item-headline">
      <i class="anzhiyufont anzhiyu-icon-history" />
      <span>最近发布</span>
    </div>
    <div class="aside-list">
      <div v-for="post in displayPosts" :key="post.id" class="aside-list-item">
        <router-link
          class="thumbnail"
          :to="`/posts/${post.id}`"
          :title="post.title"
        >
          <img :src="post.cover_url || defaultCover" :alt="post.title" />
        </router-link>
        <div class="content">
          <router-link
            class="title"
            :to="`/posts/${post.id}`"
            :title="post.title"
          >
            {{ post.title }}
          </router-link>
          <time
            :datetime="post.created_at"
            :title="`发表于 ${post.created_at}`"
          >
            {{ formatDate(post.created_at) }}
          </time>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.item-headline {
  display: flex;
  align-items: center;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  padding-left: 0.25rem;
  color: var(--anzhiyu-fontcolor);
  i {
    font-size: 1rem;
    margin-right: 0.5rem;
  }
}
.aside-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.aside-list-item {
  display: flex;
  gap: 0.75rem;
}
.thumbnail {
  width: 4rem;
  height: 4rem;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 8px;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease-out;
  }
  &:hover img {
    transform: scale(1.1);
  }
}
.content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.5rem;
  min-width: 0;
  .title {
    color: var(--anzhiyu-fontcolor);
    font-size: 0.9rem;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    transition: color 0.2s;
    font-weight: 700;
    &:hover {
      color: var(--anzhiyu-main);
    }
  }
  time {
    font-size: 0.75rem;
    color: var(--anzhiyu-fontcolor-grey);
  }
}
</style>
