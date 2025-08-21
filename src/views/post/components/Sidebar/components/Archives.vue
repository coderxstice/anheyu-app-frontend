<script setup lang="ts">
import { onMounted } from "vue";
import { RouterLink } from "vue-router";
import { storeToRefs } from "pinia";
import { useArticleStore } from "@/store/modules/articleStore";

defineOptions({
  name: "SidebarArchives"
});

const articleStore = useArticleStore();
const { archives: archivesList } = storeToRefs(articleStore);
const { fetchArchives } = articleStore;

const monthMap = [
  "一月",
  "二月",
  "三月",
  "四月",
  "五月",
  "六月",
  "七月",
  "八月",
  "九月",
  "十月",
  "十一月",
  "十二月"
];

const getMonthName = (month: number) => {
  return monthMap[month - 1] || "";
};

// --- 组件挂载后调用 store action ---
onMounted(() => {
  fetchArchives();
});
</script>

<template>
  <div class="card-archives">
    <ul class="card-archive-list">
      <li
        v-for="archive in archivesList"
        :key="`${archive.year}-${archive.month}`"
        class="card-archive-list-item"
      >
        <RouterLink
          class="card-archive-list-link"
          :to="`/archives/${archive.year}/${archive.month}/`"
        >
          <span class="card-archive-list-date">
            {{ getMonthName(archive.month) }} {{ archive.year }}
          </span>
          <div class="card-archive-list-count-group">
            <span class="card-archive-list-count">{{ archive.count }}</span>
            <span>篇</span>
          </div>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.card-archive-list {
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
  padding: 0;
  margin: 0;
  list-style: none;
}

.card-archive-list-item {
  flex: 0 0 48%;
  width: 100%;
  box-flex: 1;

  .card-archive-list-link {
    display: flex;
    flex-direction: column;
    padding: 3px 10px;
    margin: 4px 0;
    color: var(--font-color);
    border: var(--style-border);
    border-radius: var(--anzhiyu-border-radius);
    border-radius: 8px;
    transition: all 0.2s;

    &:hover {
      color: var(--anzhiyu-white);
      background-color: var(--anzhiyu-main);
    }
  }
}

.card-archive-list-date {
  flex: inherit;
  width: auto;
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.6;
}

.card-archive-list-count-group {
  span:last-child {
    width: fit-content;
    margin-left: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .card-archive-list-count {
    overflow: hidden;
    font-size: 1.1rem;
    font-weight: 700;
    line-height: 2;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
