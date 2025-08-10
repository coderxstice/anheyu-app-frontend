<script setup lang="ts">
import { computed } from "vue";
import type { Article, PostTag } from "@/api/post/type/index.ts";

defineOptions({
  name: "PostTools"
});

interface ProcessedMetaItem {
  name: string;
  path: string;
  length?: number;
}

const props = defineProps<{
  article?: Article;
}>();

const processedTags = computed<ProcessedMetaItem[]>(() => {
  if (!props.article?.post_tags) {
    return [];
  }
  return props.article.post_tags.map((tag: PostTag) => ({
    name: tag.name,
    length: tag.count,
    path: `/tags/${encodeURIComponent(tag.name)}/`
  }));
});

const hasTags = computed(() => processedTags.value.length > 0);
</script>

<template>
  <div v-if="hasTags" class="tag_share">
    <div class="post-meta__box">
      <div v-if="hasTags" class="post-meta__box__tag-list">
        <a
          v-for="tag in processedTags"
          :key="tag.name"
          :href="tag.path"
          class="post-meta__box__tags"
        >
          <span class="tags-punctuation">
            <i class="anzhiyufont anzhiyu-icon-tag" />
          </span>
          {{ tag.name }}
          <span v-if="tag.length !== undefined" class="tagsPageCount">
            {{ tag.length }}
          </span>
        </a>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.post-meta__box {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 0.5rem;
}

.post-meta__box a {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  width: fit-content;
  border-radius: 8px;
  font-size: 0.85rem;
  transition: all 0.2s ease-in-out;
  margin: 0 8px 0 0;
  color: var(--anzhiyu-white);
  height: 40px;
}

.post-meta__box__tag-list {
  display: flex;
  flex-flow: row wrap;
}

.post-meta__box__tags:nth-child(5n) {
  background-color: #4a4a4a;
}
.post-meta__box__tags:nth-child(5n + 1) {
  background-color: #ff5e5c;
}
.post-meta__box__tags:nth-child(5n + 2) {
  background-color: #ffbb50;
}
.post-meta__box__tags:nth-child(5n + 3) {
  background-color: #1ac756;
}
.post-meta__box__tags:nth-child(5n + 4) {
  background-color: #19b5fe;
}

.post-meta__box__tags:hover {
  background-color: var(--anzhiyu-main);
  color: #fff;
  box-shadow: var(--anzhiyu-shadow-theme);
}

span.tags-punctuation {
  margin-right: 4px;
}

[data-theme="light"] span.tagsPageCount {
  background-color: transparent;
  color: #fff;
}

.tagsPageCount {
  padding: 4px 6px;
  background: var(--anzhiyu-secondbg);
  border: var(--style-border-always);
  min-width: 22.5px;
  display: inline-block;
  border-radius: 4px;
  line-height: 0.6rem;
  text-align: center;
  font-size: 0.7rem;
  color: var(--anzhiyu-fontcolor);
  margin-left: 4px;
}

[data-theme="dark"] .post-meta__box a {
  opacity: 0.5;
}

[data-theme="dark"] .post-meta__box a:hover {
  opacity: 1;
}

[data-theme="light"] .post-meta__box__tags span.tagsPageCount {
  background-color: transparent;
  color: white;
}
</style>
