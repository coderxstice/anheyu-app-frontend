<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getCategoryList } from "@/api/post";
import type { PostCategory } from "@/api/post/type";

defineOptions({
  name: "PostCategories"
});

const categories = ref<PostCategory[]>([]);
const loading = ref(true);
const router = useRouter();

/**
 * 获取分类列表
 */
const fetchCategories = async () => {
  loading.value = true;
  try {
    const { data } = await getCategoryList();
    categories.value = data || [];
  } catch (error) {
    console.error("获取分类列表失败:", error);
  } finally {
    loading.value = false;
  }
};

/**
 * 跳转到指定分类的文章列表页
 * @param categoryName - 分类名称
 */
const goToCategory = (categoryName: string) => {
  router.push({ path: `/categories/${categoryName}/` });
};

onMounted(() => {
  fetchCategories();
});
</script>

<template>
  <div v-loading="loading" class="category-cloud-amount">
    <h1 class="page-title">分类</h1>
    <div class="category-cloud-list">
      <a
        v-for="category in categories"
        :key="category.id"
        class="category-item"
        @click="goToCategory(category.name)"
      >
        <i class="anzhiyufont anzhiyu-icon-folder category-punctuation" />
        {{ category.name }}
      </a>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.category-cloud-amount {
  min-height: 400px;
  color: var(--anzhiyu-fontcolor);
  max-width: 1400px;
  margin: 0 auto;
  margin-top: 0.5rem;
}

.page-title {
  margin: 0.4rem 0 1rem 1rem;
  text-align: center;
  font-weight: 700;
  text-align: center;
  font-size: 2em;
}

.category-cloud-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  text-align: center;
  animation: slide-in 0.6s 0.2s backwards;
}

.category-item {
  display: flex;
  width: fit-content;
  color: var(--anzhiyu-fontcolor);
  font-size: 1.4rem;
  padding: 0.6rem 0.9rem;
  background: var(--anzhiyu-card-bg);
  margin: 0.7rem;
  border-radius: 12px;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform-style: preserve-3d;
  -webkit-transform-style: preserve-3d;
  border: var(--style-border-always);
  box-shadow: var(--anzhiyu-shadow-border);
  align-items: center;
  cursor: pointer;

  &:hover {
    background: var(--anzhiyu-main);
    box-shadow: var(--anzhiyu-shadow-blue);
    color: var(--anzhiyu-white);
    border: var(--style-border-hover);
  }
}

.category-punctuation {
  margin-right: 0.25rem;
  opacity: 0.4;
  font-size: 1.2rem;
}
</style>
