<script setup lang="ts">
import {
  computed,
  inject,
  ref,
  watch,
  nextTick,
  onMounted,
  onUnmounted
} from "vue";
import type { Ref } from "vue";
import type { Article, PostCategory } from "@/api/post/type";
import { useArticleStore } from "@/store/modules/articleStore";

defineOptions({
  name: "CardSeriesPost"
});

const articleStore = useArticleStore();
const defaultCover = articleStore.defaultCover;

const seriesPosts = inject<Ref<Article[]>>("seriesArticles", ref([]));
const seriesCategory = inject<Ref<PostCategory | null>>(
  "seriesCategory",
  ref(null)
);

const displayPosts = computed(() => seriesPosts.value);

// 溢出检测
const listRef = ref<HTMLElement | null>(null);
const isOverflow = ref(false);

const checkOverflow = () => {
  if (listRef.value) {
    isOverflow.value = listRef.value.scrollHeight > listRef.value.clientHeight;
  }
};

// 监视文章列表变化，检查溢出
watch(displayPosts, async () => {
  if (displayPosts.value.length > 0) {
    await nextTick();
    checkOverflow();
  }
});

onMounted(() => {
  window.addEventListener("resize", checkOverflow);
  nextTick(() => {
    checkOverflow();
  });
});

onUnmounted(() => {
  window.removeEventListener("resize", checkOverflow);
});

// 生成分类页面链接
const categoryLink = computed(() => {
  if (seriesCategory.value?.name) {
    return `/categories/${encodeURIComponent(seriesCategory.value.name)}/`;
  }
  return "/categories/";
});

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
  <div v-if="displayPosts.length > 0" class="card-widget card-series-post">
    <div class="item-headline">
      <i class="anzhiyufont anzhiyu-icon-cube" />
      <span>{{ seriesCategory?.name || "系列文章" }}</span>
    </div>
    <div class="card-content">
      <div
        ref="listRef"
        class="aside-list"
        :class="{ 'is-overflow': isOverflow }"
      >
        <router-link
          v-for="post in displayPosts"
          :key="post.id"
          class="aside-list-item"
          :to="`/posts/${post.id}`"
          :title="post.title"
        >
          <div class="thumbnail">
            <img :src="post.cover_url || defaultCover" :alt="post.title" />
          </div>
          <div class="content">
            <div class="title">
              {{ post.title }}
            </div>
            <time
              :datetime="post.created_at"
              :title="`发表于 ${post.created_at}`"
            >
              {{ formatDate(post.created_at) }}
            </time>
          </div>
        </router-link>
      </div>
    </div>
    <div v-if="isOverflow" class="card-footer">
      <router-link :to="categoryLink" class="view-all-button">
        更多文章
      </router-link>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.item-headline {
  display: flex;
  align-items: center;
  padding-left: 0.25rem;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--anzhiyu-fontcolor);

  i {
    margin-right: 0.5rem;
    font-size: 1rem;
  }
}

.card-content {
  position: relative;
}

.aside-list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  // 5.5 篇文章的高度：(4rem + 0.75rem) * 5.5 ≈ 26.125rem
  // 每项高度 4rem，间距 0.75rem，显示 5.5 项
  max-height: calc((4rem + 0.75rem) * 5 + 4rem * 0.5);
  overflow: hidden;

  &.is-overflow::after {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 80px;
    pointer-events: none;
    content: "";
    background-image: linear-gradient(
      to top,
      var(--anzhiyu-card-bg),
      transparent
    );
  }
}

.aside-list-item {
  display: flex;
  gap: 0.75rem;
  color: inherit;
  text-decoration: none;

  &:hover .title {
    color: var(--anzhiyu-main);
  }
}

.thumbnail {
  flex-shrink: 0;
  width: 4rem;
  height: 4rem;
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
  gap: 0.5rem;
  justify-content: center;
  min-width: 0;

  .title {
    display: -webkit-box;
    overflow: hidden;
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--anzhiyu-fontcolor);
    text-overflow: ellipsis;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    transition: color 0.2s;
    -webkit-box-orient: vertical;
  }

  time {
    font-size: 0.75rem;
    color: var(--anzhiyu-fontcolor-grey);
  }
}

.card-footer {
  margin-top: 0.75rem;
  text-align: center;

  .view-all-button {
    display: flex;
    justify-content: center;
    width: 100%;
    padding: 4px 0;
    font-size: 14px;
    color: var(--anzhiyu-fontcolor);
    text-align: center;
    text-decoration: none;
    user-select: none;
    background: var(--anzhiyu-secondbg);
    border: var(--style-border-always);
    border-radius: 8px;
    box-shadow: var(--anzhiyu-shadow-border);
    transition: all 0.3s ease;

    &:hover {
      color: var(--anzhiyu-white);
      background-color: var(--anzhiyu-theme);
      border-color: var(--anzhiyu-theme);
      box-shadow: var(--anzhiyu-shadow-theme);
    }
  }
}
</style>
