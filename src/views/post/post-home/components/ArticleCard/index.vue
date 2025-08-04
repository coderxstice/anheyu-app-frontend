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
        <div class="recent-post-info-top-tips">
          <span
            v-if="article.post_categories && article.post_categories.length > 0"
            class="category-tip"
          >
            {{ article.post_categories[0].name }}
          </span>
        </div>
        <a
          class="article-title"
          :href="`/p/${article.id}`"
          :title="article.title"
        >
          {{ article.title }}
        </a>
      </div>
      <div class="article-meta-wrap">
        <span class="article-meta tags">
          <a
            v-for="tag in article.post_tags"
            :key="tag.id"
            class="article-meta__tags"
          >
            <span># {{ tag.name }}</span>
          </a>
        </span>
        <span class="post-meta-date">
          <time :datetime="article.created_at">{{
            formatDate(article.created_at)
          }}</time>
        </span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* 默认单栏样式 */
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
    width: 45%;
    height: 100%;
    flex-shrink: 0;

    a,
    img {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: cover;
    }
    .post_bg {
      transition: all 0.6s ease;
    }
  }

  .recent-post-info {
    flex-grow: 1;
    width: 55%;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    min-width: 0;

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
      margin-top: auto;
    }
  }
}

/* 双栏布局下的样式 */
.recent-post-item.double-column-item {
  width: calc(50% - 0.5rem);
  flex-direction: column;
  height: auto;
  align-items: flex-start;

  .post_cover {
    width: 100%;
    height: 225px;
    border-radius: 8px 8px 0 0;
  }

  .recent-post-info {
    width: 100%;
    padding: 1rem;
    flex-grow: 1;
    display: flex;
    flex-direction: column;

    .recent-post-info-top {
      .category-tip {
        color: #f06999;
        font-size: 0.8rem;
        font-weight: bold;
      }
      .article-title {
        font-size: 1.3rem;
        line-clamp: 2;
        margin-top: 0.5rem;
      }
    }

    .article-meta-wrap {
      margin-top: auto;
    }
  }
}

.article-meta-wrap {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  font-size: 0.8rem;
  color: var(--anzhiyu-secondtext);
  gap: 1rem; /* 在标签和日期之间增加间距 */

  .tags {
    /* 1. 允许此flex子项收缩，这是省略号生效的关键 */
    flex-shrink: 1;
    min-width: 0;

    /* 2. 自身设为块级，并应用省略号三件套 */
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tags .article-meta__tags {
    /* 3. 内部的 a 标签设为行内元素，像文字一样排列 */
    display: inline;
    margin-right: 0.5rem; /* 用 margin 代替 gap */
    color: var(--anzhiyu-secondtext);
  }

  .post-meta-date {
    white-space: nowrap;
    flex-shrink: 0; /* 4. 不允许日期收缩 */
  }
}

/* 响应式调整 */
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

    .recent-post-info {
      padding: 1rem;
      .article-title {
        font-size: 1.2rem;
      }
    }
  }
}
</style>
