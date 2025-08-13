<script setup lang="ts">
import { ref, onMounted, computed, type PropType } from "vue";
import type { Article } from "@/api/post/type";
import { useArticleStore } from "@/store/modules/articleStore";
import { formatRelativeTime } from "@/utils/format";
import { useRouter } from "vue-router";

const articleStore = useArticleStore();
const router = useRouter();

const props = defineProps({
  article: {
    type: Object as PropType<Article>,
    required: true
  },
  isDoubleColumn: {
    type: Boolean,
    default: false
  }
});

const isNewPost = computed(() => {
  const NEW_POST_THRESHOLD_HOURS = 24;
  const threshold = NEW_POST_THRESHOLD_HOURS * 60 * 60 * 1000;
  const postDate = new Date(props.article.created_at).getTime();
  const now = new Date().getTime();
  return now - postDate < threshold;
});

const READ_ARTICLES_KEY = "read_articles";
const isRead = ref(false);

onMounted(() => {
  const readArticlesStr = localStorage.getItem(READ_ARTICLES_KEY);
  if (readArticlesStr) {
    const readArticles: string[] = JSON.parse(readArticlesStr);
    if (readArticles.includes(props.article.id)) {
      isRead.value = true;
    }
  }
});

const goPost = (id: string) => {
  const readArticlesStr = localStorage.getItem(READ_ARTICLES_KEY);
  let readArticles: string[] = [];
  if (readArticlesStr) {
    readArticles = JSON.parse(readArticlesStr);
  }
  if (!readArticles.includes(id)) {
    readArticles.push(id);
    localStorage.setItem(READ_ARTICLES_KEY, JSON.stringify(readArticles));
    isRead.value = true;
  }
  router.push({ path: `/posts/${id}` });
};

// 跳转到分类页面的方法
const goToCategoryPage = (categoryName: string) => {
  router.push(`/categories/${categoryName}/`);
};

// 跳转到标签页面的方法
const goToTagPage = (tagName: string) => {
  router.push(`/tags/${tagName}/`);
};
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
            @click.stop="goToCategoryPage(category.name)"
          >
            {{ category.name }}
          </span>
          <span v-if="!isRead" class="unvisited-post" :title="article.title"
            >未读</span
          >
          <span v-if="isNewPost" class="newPost">最新</span>
        </div>
        <h2 class="article-title" :title="article.title">
          {{ article.title }}
        </h2>
      </div>
      <div class="article-meta-wrap">
        <span class="article-meta tags">
          <span
            v-for="tag in article.post_tags"
            :key="tag.id"
            class="article-meta__tags"
            @click.stop="goToTagPage(tag.name)"
          >
            <span>
              <i class="anzhiyufont anzhiyu-icon-hashtag" />{{ tag.name }}
            </span>
          </span>
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
  transition: all 0.3s;
  cursor: pointer;
  .unvisited-post,
  .newPost {
    display: inline;
    color: var(--anzhiyu-secondtext);
    font-size: 0.75rem;
    position: relative;
    margin-right: 4px;
  }

  &:hover {
    border: var(--style-border-hover);
    box-shadow: var(--anzhiyu-shadow-main);
    .post_bg {
      filter: brightness(0.82);
      transform: scale(1.03);
    }
    .recent-post-info .article-title {
      color: var(--anzhiyu-main);
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

  .anzhiyu-icon-hashtag {
    opacity: 0.6;
    font-size: 13px;
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

.recent-post-item.double-column-item {
  width: calc(50% - 0.3125rem);
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
  &:has(.sticky-warp) {
    transform: translateX(-4px);
  }

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
    margin-right: 4px;
    display: inline;
    color: var(--anzhiyu-secondtext);
    font-size: 0.75rem;
    transition: color 0.3s;

    &:hover {
      color: var(--anzhiyu-main);
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
  gap: 1rem;

  .tags {
    flex-shrink: 1;
    min-width: 0;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 4px 0;
  }

  .tags .article-meta__tags {
    display: inline;
    color: var(--anzhiyu-secondtext);
    border-radius: 4px;
    padding: 3px 4px;
    overflow: hidden;
    transition: all 0.2s;
    &:hover {
      color: var(--anzhiyu-white);
      background-color: var(--anzhiyu-main);
      .anzhiyu-icon-hashtag {
        opacity: 1;
      }
    }
  }

  .post-meta-date {
    white-space: nowrap;
    flex-shrink: 0;
  }
}

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
