<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { useLinkStore } from "@/store/modules/link";
import SiteCardGroup from "./SiteCardGroup.vue";
import FlinkList from "./FlinkList.vue";

defineOptions({
  name: "LinkListSection"
});

const linkStore = useLinkStore();

// 核心：滚动加载逻辑
const handleScroll = () => {
  const scrollHeight = document.documentElement.scrollHeight;
  const scrollTop = document.documentElement.scrollTop;
  const clientHeight = document.documentElement.clientHeight;

  // 如果滚动到距离底部 200px 以内
  if (scrollTop + clientHeight >= scrollHeight - 200) {
    // 找到当前最后一个未加载完的分类进行加载
    for (const category of linkStore.categories) {
      const state = linkStore.linksByCategory[category.id];
      if (state && !state.finished && !state.loading) {
        linkStore.fetchLinksForCategory(category.id);
        // 每次只加载一个分类，防止并发请求
        break;
      }
    }
  }
};

onMounted(async () => {
  // 组件挂载时，获取所有分类
  await linkStore.fetchCategories();
  // 然后立即加载第一个分类的数据
  if (linkStore.categories.length > 0) {
    linkStore.fetchLinksForCategory(linkStore.categories[0].id);
  }
  // 监听滚动事件
  window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
  // 组件卸载时，移除监听
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <div id="article-container" class="flink">
    <div
      v-for="category in linkStore.categories"
      :key="category.id"
      class="link-group"
    >
      <div class="power_title_bar">
        <h2 :id="category.name">
          <a :href="`#${category.name}`" class="headerlink">{{
            category.name
          }}</a>
          <span>
            ({{ linkStore.linksByCategory[category.id]?.total || 0 }})</span
          >
        </h2>
      </div>
      <SiteCardGroup
        v-if="category.style === 'card'"
        :links="linkStore.linksByCategory[category.id]?.list || []"
      />
      <FlinkList
        v-else
        :links="linkStore.linksByCategory[category.id]?.list || []"
      />
      <div
        v-if="linkStore.linksByCategory[category.id]?.loading"
        class="loading-tip"
      >
        正在加载...
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* 这里只放该组件自身和标题栏的样式 */
.link-group {
  margin-top: 30px;
}
.power_title_bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--anzhiyu-gray-op);
  margin-bottom: 20px;
  h2 {
    font-size: 1.5rem;
    margin: 0;
    .headerlink {
      text-decoration: none;
      color: var(--anzhiyu-fontcolor);
    }
    span {
      font-size: 1.2rem;
      color: var(--anzhiyu-second-fontcolor);
    }
  }
}
.loading-tip {
  text-align: center;
  color: var(--anzhiyu-second-fontcolor);
  padding: 20px 0;
}
</style>
