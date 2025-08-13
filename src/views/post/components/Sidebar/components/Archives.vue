<script setup lang="ts">
import { ref, onMounted } from "vue";
import { RouterLink } from "vue-router";
import { getArticleArchives } from "@/api/post";
import type { ArchiveItem } from "@/api/post/type";

defineOptions({
  name: "SidebarArchives"
});

// 存储从 API 获取的归档列表
const archivesList = ref<ArchiveItem[]>([]);

// 月份数字到中文的映射
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

// 辅助函数，根据数字获取中文月份
const getMonthName = (month: number) => {
  return monthMap[month - 1] || "";
};

// 获取归档数据
const fetchArchives = async () => {
  try {
    const res = await getArticleArchives();
    if (res.code === 200) {
      archivesList.value = res.data.list;
    }
  } catch (error) {
    console.error("获取归档列表失败:", error);
  }
};

// 组件挂载后执行数据获取
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
  flex-direction: row;
  justify-content: space-between;
  flex-wrap: wrap;
  margin: 0;
  padding: 0;
  list-style: none;
}

.card-archive-list-item {
  width: 100%;
  box-flex: 1;
  flex: 0 0 48%;
  .card-archive-list-link {
    border-radius: var(--anzhiyu-border-radius);
    margin: 4px 0;
    display: flex;
    flex-direction: column;
    border: var(--style-border);
    padding: 3px 10px;
    color: var(--font-color);
    transition: all 0.2s;
    border-radius: 8px;

    &:hover {
      background-color: var(--anzhiyu-main);
      color: var(--anzhiyu-white);
    }
  }
}

.card-archive-list-date {
  width: auto;
  flex: inherit;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
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
    text-align: left;
    font-size: 1.1rem;
    line-height: 0.9;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 2;
  }
}
</style>
