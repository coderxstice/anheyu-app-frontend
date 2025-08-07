<script setup lang="ts">
import { type PropType, computed } from "vue";
import type { Article } from "@/api/post/type";
import { useRouter } from "vue-router";
import { useArticleStore } from "@/store/modules/articleStore";

const props = defineProps({
  article: {
    type: Object as PropType<Article>,
    required: true
  }
});

const router = useRouter();
const articleStore = useArticleStore();

const topCoverUrl = computed(() => {
  return props.article.top_img_url || articleStore.defaultCover;
});

// 格式化日期为 YYYY-MM-DD
const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 跳转到分类页
const goToCategory = (categoryName: string) => {
  router.push(`/categories/${categoryName}`);
};

// 跳转到标签页
const goToTag = (tagName: string) => {
  router.push(`/tags/${tagName}`);
};
</script>

<template>
  <div class="post-header-container">
    <div id="post-info">
      <div id="post-firstinfo">
        <div class="meta-firstline-top">
          <a class="post-meta-original">原创</a>
          <span
            v-if="article.post_categories.length > 0"
            class="post-meta-categories"
          >
            <a
              :href="`/categories/${article.post_categories[0].name}`"
              @click.prevent="goToCategory(article.post_categories[0].name)"
            >
              {{ article.post_categories[0].name }}
            </a>
          </span>
          <div class="tag_share">
            <div class="post-meta__tag-list">
              <a
                v-for="tag in article.post_tags"
                :key="tag.id"
                class="post-meta__tags"
                :href="`/tags/${tag.name}`"
                @click.prevent="goToTag(tag.name)"
              >
                <i class="anzhiyufont anzhiyu-icon-hashtag" />
                <span class="tags-name">{{ tag.name }}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <h1 class="post-title">{{ article.title }}</h1>

      <div id="post-meta">
        <div class="meta-firstline">
          <span class="post-meta-date">
            <i class="anzhiyufont anzhiyu-icon-calendar-days post-meta-icon" />
            <span class="post-meta-label">发表于</span>
            <time :datetime="article.created_at">{{
              formatDate(article.created_at)
            }}</time>

            <span class="post-meta-separator" />
            <i class="anzhiyufont anzhiyu-icon-history post-meta-icon" />
            <span class="post-meta-label">更新于</span>
            <time :datetime="article.updated_at">{{
              formatDate(article.updated_at)
            }}</time>
          </span>
        </div>
        <div class="meta-secondline">
          <span class="post-meta-wordcount">
            <i class="anzhiyufont anzhiyu-icon-file-word post-meta-icon" />
            <span class="post-meta-label">字数总计:</span>
            <span>{{ article.word_count }}</span>
          </span>
          <span class="post-meta-separator" />
          <span class="post-meta-wordcount">
            <i class="anzhiyufont anzhiyu-icon-clock post-meta-icon" />
            <span class="post-meta-label">阅读时长:</span>
            <span>{{ article.reading_time }}分钟</span>
          </span>
          <span class="post-meta-separator" />
          <span class="post-meta-viewcount">
            <i class="anzhiyufont anzhiyu-icon-fw-eye post-meta-icon" />
            <span class="post-meta-label">阅读量:</span>
            <span>{{ article.view_count }}</span>
          </span>
          <span class="post-meta-separator" />
          <span v-if="article.ip_location" class="post-meta-position">
            <i class="anzhiyufont anzhiyu-icon-location-dot" />
            {{ article.ip_location }}
          </span>
          <span class="post-meta-separator" />
          <span class="post-meta-commentcount">
            <i class="anzhiyufont anzhiyu-icon-comments post-meta-icon" />
            <span class="post-meta-label">评论数:</span>
            <a href="#post-comment">0</a>
          </span>
        </div>
      </div>
    </div>
    <div id="post-top-cover">
      <img
        id="post-top-bg"
        :src="topCoverUrl"
        :alt="article.title"
        class="nolazyload"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.post-header-container {
  position: relative;
  width: 100%;
  height: 30rem;
  min-height: 300px;
  display: flex;
  color: var(--anzhiyu-white);
  overflow: hidden;
  justify-content: center;
  &::before {
    transition: 0s;
    opacity: 0.93;
    height: 100%;
    background-color: var(--anzhiyu-main);
    opacity: 1;
    position: absolute;
    top: 0;
    left: 0;
    display: block;
    width: 100%;
    content: "";
  }
}

#post-top-cover {
  transform: rotate(10deg) translateY(30%) scale(2) translateZ(0);
  filter: blur(30px);
  opacity: 0.5;
  width: 70%;
  height: 100%;
  position: relative;
  margin: 0 -20% 0 auto;
  overflow: hidden;
  margin-bottom: 0;

  #post-top-bg {
    width: 100%;
    height: 100%;
    object-fit: cover;
    min-width: 50vw;
    min-height: 25rem;
    opacity: 0.8;
    transition: 0s;
  }
}

#post-info {
  height: 100%;
  width: 100%;
  text-align: center;
  gap: 16px;
  top: 0;
  display: flex;
  justify-content: center;
  position: absolute;
  padding: 0 3.75rem;
  margin: 0 auto;
  z-index: 10;
  color: var(--anzhiyu-white);
  max-width: 1400px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  animation: slide-in 0.6s 0s backwards;
}

#post-firstinfo .meta-firstline-top {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 1rem;
}

.post-meta-original,
.post-meta-categories a {
  display: flex;
  align-items: center;
  padding: 0 12px;
  height: 32px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  background: var(--anzhiyu-white-op);
  backdrop-filter: blur(10px);
  transition: all 0.3s;
  white-space: nowrap;
  &:hover {
    color: var(--anzhiyu-main);
    background: var(--anzhiyu-white);
  }
}

.tag_share .post-meta__tag-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  i.anzhiyu-icon-hashtag {
    opacity: 0.6;
    font-size: 17px;
  }
  .tags-name {
    margin-left: 4px;
    color: var(--anzhiyu-white);
    font-size: 1rem;
    transition: color 0.3s;
  }
}

.post-meta__tags {
  display: inline-flex;
  align-items: center;
  font-size: 1rem;
  opacity: 0.8;
  height: 32px;
  transition: all 0.3s;
  white-space: nowrap;
  border-radius: 12px;
  padding: 0 12px 0 8px;
  &:hover {
    color: var(--anzhiyu-white);
    opacity: 1;
    background: var(--anzhiyu-white-op);
  }
}

.post-title {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  margin: 0;
  text-align: left;
  line-height: 1.2;
}

#post-meta {
  margin-top: 1.5rem;
  font-size: 1rem;
  opacity: 0.9;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
}

#post-meta .meta-firstline,
#post-meta .meta-secondline {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem 0;
}

.post-meta-icon {
  margin-right: 0.4rem;
}

.post-meta-label {
  margin-right: 0.2rem;
}

.post-meta-separator {
  margin: 0 0.75rem;
  width: 1px;
  height: 12px;
  background: rgba(255, 255, 255, 0.3);
}

.post-meta-date,
.post-meta-wordcount,
.post-meta-viewcount,
.post-meta-position,
.post-meta-commentcount {
  display: inline-flex;
  align-items: center;
}
</style>
