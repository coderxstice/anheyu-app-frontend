<script setup lang="ts">
import type { PropType } from "vue";
import type { Article } from "@/api/post/type";

defineProps({
  article: {
    type: Object as PropType<Article>,
    required: true
  }
});

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};
</script>

<template>
  <div class="recent-post-item">
    <div class="post_cover left">
      <a :href="`/p/${article.id}`" :title="article.title">
        <img class="post_bg" :src="article.cover_url" :alt="article.title" />
      </a>
    </div>
    <div class="recent-post-info">
      <div class="recent-post-info-top">
        <a
          class="article-title"
          :href="`/p/${article.id}`"
          :title="article.title"
        >
          {{ article.title }}
        </a>
      </div>
      <div class="article-meta-wrap">
        <span class="post-meta-date">
          <i class="anzhiyufont anzhiyu-icon-calendar-days" />
          <span class="article-meta-label">发表于</span>
          <time :datetime="article.created_at">{{
            formatDate(article.created_at)
          }}</time>
        </span>
        <span class="article-meta tags">
          <a
            v-for="tag in article.post_tags"
            :key="tag.id"
            class="article-meta__tags"
          >
            <span>
              <i class="anzhiyufont anzhiyu-icon-hashtag" /> {{ tag.name }}
            </span>
          </a>
        </span>
      </div>
      <div class="content">
        {{ article.summaries[0] }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* 粘贴和 recent-post-item 相关的样式 */
.recent-post-item {
  display: flex;
  padding: 1rem;
  background: var(--anzhiyu-card-bg);
  border-radius: 12px;
  border: var(--style-border);
  margin-bottom: 1rem;
  transition: all 0.3s;

  &:hover {
    border: var(--style-border-hover);
    box-shadow: var(--anzhiyu-shadow-main);
  }
}

.post_cover {
  width: 200px;
  height: 120px;
  margin-right: 1.5rem;
  overflow: hidden;
  border-radius: 8px;

  a,
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.recent-post-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.article-title {
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--anzhiyu-fontcolor);
  text-decoration: none;
  transition: color 0.3s;

  &:hover {
    color: var(--anzhiyu-main);
  }
}

.article-meta-wrap {
  margin: 0.5rem 0;
  color: var(--anzhiyu-secondtext);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.tags {
  display: flex;
  gap: 0.5rem;
}

.content {
  color: var(--anzhiyu-secondtext);
  font-size: 0.9rem;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
