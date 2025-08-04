<script setup lang="ts">
import type { PropType } from "vue";
import type { Article } from "@/api/post/type";
import { useArticleStore } from "@/store/modules/articleStore";
import { formatRelativeTime } from "@/utils/format";
import { useRouter } from "vue-router";

const articleStore = useArticleStore();

const router = useRouter();
const goPost = (id: string) => {
  router.push({ path: `/p/${id}` });
};

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
</script>

<template>
  <div
    class="recent-post-item"
    :class="{ 'double-column-item': isDoubleColumn }"
    @click="goPost(article.id)"
  >
    <div class="post_cover">
      <div :title="article.title">
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
      </div>
    </div>
    <div class="recent-post-info">
      <div class="recent-post-info-top">
        <div class="recent-post-info-top-tips">
          <span v-if="article.pin_sort > 0" class="article-meta sticky-warp">
            <i class="anzhiyufont anzhiyu-icon-thumbtack sticky" />
            <span class="sticky">置顶</span>
          </span>

          <span
            v-for="category in article.post_categories"
            :key="category.id"
            class="category-tip"
          >
            {{ category.name }}
          </span>
        </div>
        <h2 class="article-title" :title="article.title">
          {{ article.title }}
        </h2>
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
            formatRelativeTime(article.created_at)
          }}</time>
        </span>
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
  cursor: pointer;

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
      line-height: 1.2;
      margin-bottom: 1rem;
      -webkit-line-clamp: 2;
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
    padding: 18px 32px;
    flex-grow: 1;
    display: flex;
    flex-direction: column;

    .recent-post-info-top {
      .article-title {
        font-size: 1.3rem;
        margin-top: 0.5rem;
      }
    }

    .article-meta-wrap {
      margin-top: auto;
    }
  }
}

.recent-post-info-top-tips {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
  color: var(--anzhiyu-secondtext);
  font-size: 0.75rem;
  height: 20px;

  .sticky-warp {
    display: inline-flex;
    align-items: center;
    color: #ff5722;
    margin-right: 8px;

    .sticky {
      margin-left: 4px;
      font-size: 0.75rem;
    }
  }

  .category-tip {
    margin-right: 8px;
    display: inline;
    color: var(--anzhiyu-secondtext);
    font-size: 0.75rem;
  }
}

.article-meta-wrap {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  font-size: 0.8rem;
  color: var(--anzhiyu-secondtext);
  gap: 1rem;

  .tags {
    flex-shrink: 1;
    min-width: 0;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tags .article-meta__tags {
    display: inline;
    margin-right: 0.5rem;
    color: var(--anzhiyu-secondtext);
  }

  .post-meta-date {
    white-space: nowrap;
    flex-shrink: 0;
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
