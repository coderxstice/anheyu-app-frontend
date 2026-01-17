<script setup lang="ts">
import { ref, onMounted, type PropType, computed } from "vue";
import type { Article } from "@/api/post/type";
import { useArticleStore } from "@/store/modules/articleStore";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { formatRelativeTime } from "@/utils/format";
import { useRouter } from "vue-router";

const articleStore = useArticleStore();
const siteConfigStore = useSiteConfigStore();
const router = useRouter();

// 是否启用主色调标签样式
const enablePrimaryColorTag = computed(() => {
  const postConfig = siteConfigStore.getSiteConfig?.post?.default;
  const value = postConfig?.enable_primary_color_tag;
  return value === true || value === "true";
});

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

// 获取文章主色调，用于分类标签背景色
const primaryColor = computed(() => {
  return props.article.primary_color || "var(--anzhiyu-main)";
});

// 根据背景色计算合适的文字颜色
const getContrastColor = (hexColor: string): string => {
  // 如果是 CSS 变量，返回白色
  if (hexColor.startsWith("var(")) return "#ffffff";
  // 移除 # 号
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // 计算亮度
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? "#333333" : "#ffffff";
};

const categoryTextColor = computed(() => {
  return getContrastColor(primaryColor.value);
});

onMounted(() => {
  // 检查已读状态
  const readArticlesStr = localStorage.getItem(READ_ARTICLES_KEY);
  if (readArticlesStr) {
    const readArticles: string[] = JSON.parse(readArticlesStr);
    if (readArticles.includes(props.article.id)) {
      isRead.value = true;
    }
  }

  // 注意：懒加载已由父组件 (HomeTop 或 post-home) 统一管理
  // 不再在每个 ArticleCard 中重复创建 IntersectionObserver
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
        <!-- 新版标签样式：启用主色调标签 -->
        <div v-if="enablePrimaryColorTag" class="recent-post-info-top-tips">
          <!-- 分类标签：使用文章主色调 -->
          <span
            v-for="category in article.post_categories"
            :key="category.id"
            class="meta-tag category-tag"
            :style="{
              backgroundColor: primaryColor,
              color: categoryTextColor
            }"
            @click.stop="goToCategoryPage(category.name)"
          >
            {{ category.name }}
          </span>

          <!-- 置顶标签 -->
          <span v-if="article.pin_sort > 0" class="meta-tag sticky-tag">
            <i class="anzhiyufont anzhiyu-icon-thumbtack" />
            <span>置顶</span>
          </span>

          <!-- 多人互动标签 -->
          <span v-if="article.comment_count > 10" class="meta-tag hot-tag">
            <i class="anzhiyufont anzhiyu-icon-fire" />
            <span>多人互动</span>
          </span>

          <!-- 最新标签 -->
          <span v-if="isNewest" class="meta-tag newest-tag">最新</span>

          <!-- 未读标签 -->
          <span v-if="!isRead" class="meta-tag unread-tag">未读</span>
        </div>

        <!-- 旧版标签样式：默认样式 -->
        <div v-else class="recent-post-info-top-tips legacy">
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

// 新版标签容器样式
.recent-post-info-top-tips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  min-height: 24px;
  margin-bottom: 0.5rem;
  overflow: hidden;

  // 旧版标签容器样式
  &.legacy {
    display: block;
    height: 20px;
    gap: 0;
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

      i.hot-interaction {
        font-size: 0.75rem;
      }

      span.hot-interaction {
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

    .unvisited-post,
    .newPost {
      position: relative;
      display: inline;
      margin-right: 4px;
      font-size: 0.75rem;
      color: var(--anzhiyu-secondtext);
    }
  }
}

// 统一的标签基础样式
.meta-tag {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 3px 10px;
  font-size: 0.7rem;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
  border-radius: 20px;
  transition: all 0.2s ease;

  i {
    font-size: 0.7rem;
  }
}

// 分类标签 - 使用文章主色调
.category-tag {
  cursor: pointer;

  &:hover {
    filter: brightness(0.9);
    transform: translateY(-1px);
  }
}

// 置顶标签 - 橙色
.sticky-tag {
  color: #ffffff;
  background-color: #ff5722;
}

// 多人互动标签 - 红色
.hot-tag {
  color: #ffffff;
  background-color: #f56c6c;
}

// 最新标签 - 绿色
.newest-tag {
  color: #ffffff;
  background-color: #10ac84;
}

// 未读标签 - 灰色透明
.unread-tag {
  color: var(--anzhiyu-secondtext);
  background-color: var(--anzhiyu-secondbg);
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

  .recent-post-info-top-tips {
    gap: 4px;
  }

  .meta-tag {
    padding: 2px 8px;
    font-size: 0.65rem;
  }
}
</style>
