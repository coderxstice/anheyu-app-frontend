<script setup lang="ts">
import { type PropType } from "vue";
import type { ArticleLink } from "@/api/post/type";

import { useArticleStore } from "@/store/modules/articleStore";

defineOptions({
  name: "RelatedPosts"
});

const props = defineProps({
  posts: {
    type: Array as PropType<ArticleLink[]>,
    default: () => []
  }
});

const articleStore = useArticleStore();

const toRandomPost = () => {
  articleStore.navigateToRandomArticle();
};

// 默认封面图
const defaultCover = articleStore.defaultCover;
</script>

<template>
  <div v-if="posts && posts.length > 0" class="relatedPosts">
    <div class="headline">
      <i class="anzhiyufont anzhiyu-icon-thumbs-up fa-fw" />
      <span>喜欢这篇文章的人也看了</span>
      <div class="relatedPosts-link">
        <a
          href="javascript:void(0);"
          rel="external nofollow"
          @click.prevent="toRandomPost"
          >随便逛逛</a
        >
      </div>
    </div>
    <div class="relatedPosts-list">
      <div v-for="post in posts" :key="post.id">
        <router-link
          :to="`/posts/${post.abbrlink || post.id}`"
          :title="post.title"
        >
          <img
            class="cover"
            alt="cover"
            :src="post.cover_url || defaultCover"
          />
          <div class="content is-center">
            <div class="title">{{ post.title }}</div>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.relatedPosts {
  margin-top: 1.25rem;
  user-select: none;
}

.headline {
  margin-bottom: 1rem;
  font-weight: 700;
  font-size: 1.25rem;
  display: flex;
  align-items: center;

  i {
    font-size: 22px;
    line-height: 1;
  }

  span {
    margin-right: auto;
    margin-left: 8px;
  }
}

.relatedPosts-link {
  display: block;
  margin-left: 8px;
  font-size: 0.8125rem;

  a {
    font-weight: 400;
  }
}

.relatedPosts-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  flex-direction: column;

  & > div {
    border-radius: 12px;
    mask-image: -webkit-radial-gradient(center, #fff, #000);
    -webkit-mask-image: -webkit-radial-gradient(center, #fff, #000);
    background: var(--anzhiyu-secondbg);
    border: var(--style-border);
    transition: 0.3s;
    cursor: pointer;
    overflow: hidden;
    width: 100%;
    margin-bottom: 8px;
    position: relative;
    display: inline-block;
    vertical-align: bottom;
    height: 200px;
    &:hover {
      background: var(--anzhiyu-main);
      a .title {
        color: var(--anzhiyu-white);
      }
    }
  }
}

.relatedPosts-list a {
  display: flex;
  width: 100%;
  height: 100%;
  .cover {
    width: 360px;
    min-width: 45%;
    height: 100%;
    transition: all 0.6s ease 0s;
    object-fit: cover;
    max-width: 45%;
    border-radius: 0;
  }

  .content {
    padding: 0 1rem;
    width: 100%;

    &.is-center {
      text-align: center;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      flex-direction: row;
      align-items: center;
    }
  }

  .title {
    color: var(--anzhiyu-fontcolor);
    font-weight: 700;
    line-height: 1.5;
    line-clamp: 4;
    -webkit-line-clamp: 4;
    font-size: 1.125rem;
    text-align: left;
    overflow: hidden;
    margin-right: auto;
  }
}
</style>
