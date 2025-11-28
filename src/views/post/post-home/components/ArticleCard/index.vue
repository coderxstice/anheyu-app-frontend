<script setup lang="ts">
import { ref, onMounted, onUnmounted, type PropType, computed } from "vue";
import type { Article } from "@/api/post/type";
import { useArticleStore } from "@/store/modules/articleStore";
import { formatRelativeTime } from "@/utils/format";
import { useRouter } from "vue-router";
import { initLazyLoad, destroyLazyLoad } from "@/utils/lazyload";

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
  },
  isNewest: {
    type: Boolean,
    default: false
  }
});

const READ_ARTICLES_KEY = "read_articles";
const isRead = ref(false);

const coverUrl = computed(() => {
  return props.article.cover_url || articleStore.defaultCover;
});

// Observer 实例
let observer: IntersectionObserver | null = null;

onMounted(() => {
  // 检查已读状态
  const readArticlesStr = localStorage.getItem(READ_ARTICLES_KEY);
  if (readArticlesStr) {
    const readArticles: string[] = JSON.parse(readArticlesStr);
    if (readArticles.includes(props.article.id)) {
      isRead.value = true;
    }
  }

  // 初始化懒加载
  observer = initLazyLoad(document, {
    selector: "img[data-src]",
    threshold: 0.1,
    rootMargin: "100px",
    loadedClass: "lazy-loaded",
    loadingClass: "lazy-loading"
  });
});

onUnmounted(() => {
  destroyLazyLoad(observer);
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
      <div :title="article.title" class="w-full h-full">
        <img
          class="post_bg lazy-loading"
          :data-src="coverUrl"
          :alt="article.title"
        />
      </div>
    </div>
    <div class="recent-post-info">
      <div class="recent-post-info-top">
        <div class="recent-post-info-top-tips">
          <span v-if="article.pin_sort > 0" class="article-meta sticky-warp">
            <i class="sticky anzhiyufont anzhiyu-icon-thumbtack" />
            <span class="sticky">置顶</span>
          </span>

          <span
            v-if="article.comment_count > 10"
            class="article-meta hot-interaction-warp"
          >
            <i class="hot-interaction anzhiyufont anzhiyu-icon-fire" />
            <span class="hot-interaction">多人互动</span>
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
          <span v-if="isNewest" class="newPost">最新</span>
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
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  margin: 1rem 0;
  overflow: hidden;
  cursor: pointer;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;
  transition: all 0.3s ease-in-out;

  // CSS 视口动画 - 使用纯淡入动画避免布局偏移
  opacity: 0;
  animation: fadeInCard 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  animation-delay: calc(var(--animation-order, 0) * 0.1s);
  /* 防止布局偏移：保持空间占用 */
  visibility: visible;

  // 硬件加速优化
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  -webkit-transform-style: preserve-3d;
  transform-style: preserve-3d;

  @keyframes fadeInCard {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  &.double-column-item {
    height: 18em;
    margin: 0;
  }

  .unvisited-post,
  .newPost {
    position: relative;
    display: inline;
    margin-right: 4px;
    font-size: 0.75rem;
    color: var(--anzhiyu-secondtext);
  }

  &:active {
    transform: scale(0.97);
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
    position: relative;
    flex-shrink: 0;
    width: 45%;
    min-height: 180px;
    overflow: hidden;

    // 内部容器使用绝对定位填满
    > div {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }

    a,
    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .post_bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 0;
      transition:
        opacity 0.6s ease,
        transform 0.6s ease,
        filter 0.6s ease;
      opacity: 0; // 默认透明度为 0

      // CSS 图片动画优化
      &.lazy-loading {
        background: var(--anzhiyu-secondbg);
        opacity: 0;
      }

      &.lazy-loaded {
        opacity: 1; // 加载完成后显示
      }
    }
  }

  .anzhiyu-icon-hashtag {
    font-size: 13px;
    opacity: 0.6;
  }

  .recent-post-info {
    display: flex;
    flex-grow: 1;
    flex-direction: column;
    width: 55%;
    min-width: 0;
    padding: 2rem;

    .article-title {
      display: -webkit-box;
      margin-bottom: 1rem;
      overflow: hidden;
      font-size: 1.5rem;
      font-weight: 700;
      line-height: 1.2;
      color: var(--anzhiyu-fontcolor);
      text-decoration: none;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      transition: 0.3s;
      -webkit-box-orient: vertical;

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
  flex-direction: column;
  align-items: flex-start;
  width: calc(50% - 0.3125rem);
  height: auto;

  .post_cover {
    width: 100%;
    height: 225px;
    border-radius: 8px 8px 0 0;
  }

  .recent-post-info {
    display: flex;
    flex-grow: 1;
    flex-direction: column;
    width: 100%;
    padding: 18px 32px;

    .recent-post-info-top {
      .article-title {
        margin-top: 0.5rem;
        font-size: 1.3rem;
      }
    }

    .article-meta-wrap {
      margin-top: auto;
    }
  }
}

.recent-post-info-top-tips {
  display: block;
  height: 20px;
  margin-bottom: 0.5rem;
  overflow: hidden;
  font-size: 0.75rem;
  color: var(--anzhiyu-secondtext);
  text-overflow: ellipsis;
  white-space: nowrap;

  &:has(.sticky-warp) {
    transform: translateX(-4px);
  }

  .sticky-warp {
    display: inline-flex;
    align-items: center;
    margin-right: 8px;
    color: #ff5722;

    .sticky {
      margin-left: 4px;
      font-size: 0.75rem;
    }
  }

  .hot-interaction-warp {
    display: inline-flex;
    align-items: center;
    margin-right: 8px;
    color: var(--anzhiyu-red);

    .hot-interaction {
      margin-left: 4px;
      font-size: 0.75rem;
    }
  }

  .category-tip {
    display: inline;
    margin-right: 4px;
    font-size: 0.75rem;
    color: var(--anzhiyu-secondtext);
    transition: color 0.3s;

    &:hover {
      color: var(--anzhiyu-main);
    }
  }
}

.article-meta-wrap {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  font-size: 0.8rem;
  color: var(--anzhiyu-secondtext);

  .tags {
    display: block;
    flex-shrink: 1;
    min-width: 0;
    padding: 4px 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tags .article-meta__tags {
    display: inline;
    padding: 3px 4px;
    overflow: hidden;
    color: var(--anzhiyu-secondtext);
    border-radius: 4px;
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
    flex-shrink: 0;
    white-space: nowrap;
  }
}

@media screen and (width > 760px) and (width <= 992px) {
  .main-content .recent-post-item {
    .post_cover {
      width: 40%;
      height: 100%;
      overflow: hidden;
      border-radius: 0;
    }

    .recent-post-info {
      width: 60%;
      height: 100%;
    }
  }
}

@media (width <= 768px) {
  .recent-post-item,
  .recent-post-item.double-column-item {
    flex-direction: column;
    width: 100%;
    height: auto;

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
