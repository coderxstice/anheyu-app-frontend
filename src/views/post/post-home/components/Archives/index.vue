<script setup lang="ts">
import { computed, type PropType } from "vue";
import type { Article } from "@/api/post/type";
import { useRouter } from "vue-router";
import { useArticleStore } from "@/store/modules/articleStore";

const props = defineProps({
  articles: {
    type: Array as PropType<Article[]>,
    required: true
  },
  total: {
    type: Number,
    required: true
  }
});

const router = useRouter();
const articleStore = useArticleStore();

// 将扁平的文章数组按年份分组
const groupedArticles = computed(() => {
  const groups: Record<string, Article[]> = {};
  if (!props.articles) return groups;

  // 创建一个 Set 来记录当前页已经出现过的年份
  const yearsInPage = new Set<string>();

  props.articles.forEach(article => {
    const year = new Date(article.created_at).getFullYear().toString();
    if (!groups[year]) {
      groups[year] = [];
    }
    groups[year].push(article);
  });

  return groups;
});

// 格式化日期，只显示 月-日
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${month}-${day}`;
};

// 跳转到文章详情
const goToPost = (id: string) => {
  router.push(`/posts/${id}`);
};

// 跳转到标签页
const goToTag = (tagName: string) => {
  router.push(`/tags/${tagName}/`);
};
</script>

<template>
  <div class="archive-page">
    <div class="article-sort-title">
      文章<sup>{{ total }}</sup>
    </div>
    <div class="article-sort">
      <template v-for="(articlesInYear, year) in groupedArticles" :key="year">
        <div class="article-sort-item-year">{{ year }}</div>
        <div
          v-for="article in articlesInYear"
          :key="article.id"
          class="article-sort-item"
          @click="goToPost(article.id)"
        >
          <a class="article-sort-item-img">
            <img
              :src="article.cover_url || articleStore.defaultCover"
              :alt="article.title"
            />
          </a>
          <div class="article-sort-item-info">
            <div class="article-sort-item-time">
              <i class="far fa-calendar-alt" />
              <time :datetime="article.created_at">{{
                formatDate(article.created_at)
              }}</time>
            </div>
            <a class="article-sort-item-title">{{ article.title }}</a>
            <div class="article-sort-item-tags">
              <template v-for="tag in article.post_tags" :key="tag.id">
                <a class="article-meta__tags" @click.stop="goToTag(tag.name)">
                  <span class="tags-punctuation">
                    <i anzhiyufont anzhiyu-icon-hashtag />
                    {{ tag.name }}</span
                  >
                </a>
              </template>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.archive-page {
  box-shadow: var(--anzhiyu-shadow-border);
  padding: 1.25rem 2.5rem;
  border-radius: 12px;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  width: 100%;
  align-self: flex-start;
  animation: slide-in 0.6s 0.1s backwards;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.article-sort-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--anzhiyu-fontcolor);

  sup {
    margin-left: 4px;
    font-size: 16px;
    font-weight: 700;
    opacity: 0.4;
    top: -0.625rem;
  }
}

.article-sort-item-year {
  position: relative;
  font-size: 1rem;
  font-weight: 700;
  padding-left: 1rem;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 6px;
    height: 1.5rem;
    background: var(--anzhiyu-main);
    border-radius: 4px;
  }
}

.article-sort-item {
  position: relative;
  display: flex;
  -webkit-box-align: center;
  align-items: center;
  transition: all 0.2s ease-in-out 0s;
  overflow: hidden;
  border-radius: 12px;
}
.article-sort {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.article-sort-item-img {
  border-radius: 12px;
  min-width: 151px;
  min-height: 80px;
  background: var(--anzhiyu-secondbg);
  mask-image: -webkit-radial-gradient(center, #fff, #000);
  -webkit-mask-image: -webkit-radial-gradient(center, #fff, #000);
  overflow: hidden;
  width: 80px;
  height: 80px;

  img {
    width: 100%;
    height: 100%;
    transition: all 0.6s ease 0s;
    object-fit: cover;
  }

  &:hover img {
    transform: scale(1.05);
  }
}

.article-sort-item-info {
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  -webkit-box-flex: 1;
  flex: 1 1 0%;
}

.article-sort-item-time {
  display: none;
}

.article-sort-item-title {
  overflow: hidden;
  text-overflow: ellipsis;
  width: fit-content;
  order: 0;
  font-weight: 700;
  line-height: 1.3;
  line-clamp: 1;
  -webkit-line-clamp: 1;
  color: var(--anzhiyu-fontcolor);
  font-size: 1.1em;
  transition: all 0.3s ease 0s;

  &:hover {
    color: var(--anzhiyu-main);
  }
}

.article-sort-item-tags {
  margin-top: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  font-size: 0.7rem;
  display: flex;
  gap: 8px;

  .article-meta__tags {
    color: var(--anzhiyu-secondtext);
    transition: color 0.3s;
    overflow: hidden;
    text-overflow: ellipsis;
    width: fit-content;
    border-radius: 8px;
    .tags-punctuation {
      font-size: 12px;
      margin-right: 1px;
    }
    &:hover {
      color: var(--anzhiyu-main);
    }
  }

  .article-meta__link {
    color: var(--anzhiyu-secondtext);
    opacity: 0.5;
  }
}
</style>
