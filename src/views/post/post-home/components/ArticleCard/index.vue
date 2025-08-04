<script setup lang="ts">
import type { PropType } from "vue";
import type { Article } from "@/api/post/type";
import { useArticleStore } from "@/store/modules/articleStore";

const articleStore = useArticleStore();

defineProps({
  article: {
    type: Object as PropType<Article>,
    required: true
  },
  isDoubleColumn: {
    type: Boolean,
    default: false
  }
});

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};
</script>

<template>
  <div
    class="recent-post-item"
    :class="{ 'double-column-item': isDoubleColumn }"
  >
    <div class="post_cover">
      <a :href="`/p/${article.id}`" :title="article.title">
        <img
          v-if="article.cover_url"
          class="post_bg"
          :src="article.cover_url"
          :alt="article.title"
        />
        <img
          v-else
          class="post_bg"
          :src="articleStore.defaultCover"
          :alt="article.title"
        />
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
.recent-post-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  overflow: hidden;
  height: 18em;
  position: relative;
  border-radius: 12px;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  margin-bottom: 1rem;
  transition: all 0.3s;

  &:hover {
    border: var(--style-border-hover);
    box-shadow: var(--anzhiyu-shadow-main);
    .post_bg {
      filter: brightness(0.82);
      transform: scale(1.03);
    }
  }

  .post_cover {
    overflow: hidden;
    width: 45%; // 单栏时图片宽度
    height: 100%;

    .post_bg {
      height: 100%;
      width: 100%;
      transition: all 0.6s ease;
      object-fit: cover;
    }
  }

  .recent-post-info {
    width: 55%; // 单栏时信息区域宽度
    padding: 2rem;
    display: flex;
    flex-direction: column;

    .article-title {
      font-size: 1.5rem;
      line-clamp: 2;
      font-weight: 700;
      color: var(--anzhiyu-fontcolor);
      transition: 0.3s;
      display: -webkit-box;
      overflow: hidden;
      -webkit-box-orient: vertical;
      text-decoration: none;
      &:hover {
        color: var(--anzhiyu-main);
      }
    }

    .article-meta-wrap {
      margin: 1rem 0;
      color: var(--anzhiyu-secondtext);
      font-size: 0.875rem;
    }

    .content {
      transition: all 0.3s ease;
      display: -webkit-box;
      overflow: hidden;
      -webkit-box-orient: vertical;
      line-clamp: 2;
      line-height: 1.6;
      color: var(--anzhiyu-secondtext);
      font-size: 0.9rem;
    }
  }
}

// 双栏布局下的样式覆盖
.recent-post-item.double-column-item {
  width: calc(50% - 0.5rem);
  flex-direction: column;
  height: auto;

  .post_cover {
    width: 100%;
    height: 225px;
  }

  .recent-post-info {
    width: 100%;
    padding: 1rem;

    .article-title {
      font-size: 1.1rem;
    }
    .article-meta-wrap {
      margin: 0.5rem 0;
    }
    .content {
      display: none;
    }
  }
}

// 响应式调整
@media (max-width: 768px) {
  .recent-post-item,
  .recent-post-item.double-column-item {
    flex-direction: column;
    height: auto;
    width: 100%;

    .post_cover,
    .recent-post-info {
      width: 100%;
    }

    .post_cover {
      height: 200px;
    }

    .recent-post-info .content {
      display: -webkit-box;
    }
  }
}
</style>
