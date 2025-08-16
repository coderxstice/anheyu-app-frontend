<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watchEffect } from "vue";
import { useRouter, useRoute } from "vue-router"; // 引入 useRoute
import { getCategoryList } from "@/api/post";
import type { PostCategory } from "@/api/post/type";

const router = useRouter();
const route = useRoute(); // 获取当前路由信息

const categories = ref<PostCategory[]>([]);
const selectedId = ref<string | null>(null);

const catalogBarRef = ref<HTMLElement | null>(null);
const isScrolledToEnd = ref(false);
const showScrollButton = ref(false);

const fetchCategories = async () => {
  try {
    const { data } = await getCategoryList();
    categories.value = data;
    await nextTick();
    updateScrollVisibility();
  } catch (error) {
    console.error("获取分类列表失败:", error);
  }
};

const handleSelect = (category: PostCategory | null) => {
  if (category) {
    router.push(`/categories/${category.name}/`);
  } else {
    router.push("/");
  }
};

watchEffect(() => {
  // 这个函数会在组件加载和 URL 变化时自动运行
  const currentCategoryName = route.params.name as string;

  if (currentCategoryName) {
    // 根据 URL 中的分类名，查找对应的分类对象
    const selectedCategory = categories.value.find(
      c => c.name === currentCategoryName
    );
    // 如果找到了，就设置它的 ID 为选中 ID
    if (selectedCategory) {
      selectedId.value = selectedCategory.id;
    }
  } else {
    // 如果 URL 中没有分类名 (即首页)，则取消所有选中
    selectedId.value = null;
  }
});

const checkScrollPosition = () => {
  const el = catalogBarRef.value;
  if (!el) return;
  const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
  isScrolledToEnd.value = atEnd;
};

const updateScrollVisibility = () => {
  const el = catalogBarRef.value;
  if (!el) return;
  showScrollButton.value = el.scrollWidth > el.clientWidth;
  checkScrollPosition();
};

const handleScrollNext = () => {
  const el = catalogBarRef.value;
  if (!el) return;

  if (isScrolledToEnd.value) {
    el.scrollTo({ left: 0, behavior: "smooth" });
  } else {
    el.scrollBy({ left: el.clientWidth, behavior: "smooth" });
  }
};

onMounted(() => {
  fetchCategories();
  window.addEventListener("resize", updateScrollVisibility);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateScrollVisibility);
});
</script>

<template>
  <div class="category-bar-container">
    <div class="category-bar">
      <div
        ref="catalogBarRef"
        class="catalog-bar"
        @scroll.passive="checkScrollPosition"
      >
        <div class="catalog-list">
          <div
            class="catalog-list-item"
            :class="{ select: selectedId === null }"
            @click="handleSelect(null)"
          >
            <a>首页</a>
          </div>
          <div
            v-for="category in categories"
            :key="category.id"
            class="catalog-list-item"
            :class="{ select: selectedId === category.id }"
            @click="handleSelect(category)"
          >
            <a>{{ category.name }}</a>
          </div>
        </div>
      </div>
      <div
        v-if="showScrollButton"
        class="category-bar-next"
        @click="handleScrollNext"
      >
        <i
          class="anzhiyufont anzhiyu-icon-angle-double-right"
          :class="{ 'is-rotated': isScrolledToEnd }"
        />
      </div>
      <a class="catalog-more" href="/categories/">更多</a>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.category-bar-container {
  width: 100%;
  display: flex;
  margin-bottom: 0.5rem;
}

.category-bar {
  padding: 0.5rem 10px;
  background: var(--anzhiyu-card-bg);
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
  border: var(--style-border);
  width: 100%;
  height: 50px;
  border-radius: 12px;
  transition: all 0.3s ease 0s;
  animation: slide-in 0.6s 0.3s backwards;
  transform: translateX(-1px);
}

.catalog-bar {
  display: flex;
  align-items: center;
  flex-grow: 1;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

.catalog-list {
  display: flex;
  gap: 5px;
}

.catalog-list-item {
  cursor: pointer;
  font-weight: 600;
  a {
    padding: 2px 12px;
    border-radius: 8px;
    transition: all 0.3s;
    display: block;
  }
  &:hover a {
    background: var(--anzhiyu-main);
    color: var(--anzhiyu-white);
  }
  &.select a {
    background: var(--anzhiyu-main);
    color: var(--anzhiyu-white);
  }
}

.category-bar-next {
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 10px;
  border-radius: 8px;
  padding: 4px;
  background: var(--anzhiyu-card-bg);
  transition: all 0.3s ease-in-out;
  flex-shrink: 0;

  i {
    transition: transform 0.3s ease-in-out;
  }

  i.is-rotated {
    transform: rotate(180deg);
  }

  &:hover {
    background: var(--anzhiyu-main);
    color: var(--anzhiyu-white);
  }
}

.catalog-more {
  margin-left: 1rem;
  font-weight: bold;
  white-space: nowrap;
  text-decoration: none;
  color: var(--anzhiyu-fontcolor);
  &:hover {
    color: var(--anzhiyu-main);
  }
}

@media (max-width: 768px) {
  .catalog-more {
    display: none;
  }
  .category-bar {
    background: transparent;
    border: none;
    padding: 0 2px;
    .catalog-bar {
      height: 100%;
      .catalog-list {
        height: 100%;
      }

      .catalog-list-item {
        display: flex;
        justify-content: center;
        align-items: center;

        &.select a {
          background: var(--anzhiyu-main);
        }
        a {
          display: flex;
          align-items: center;
          border-radius: 30px;
          padding: 0px 19px;
          height: 80%;
          font-size: 14px;
          background: var(--anzhiyu-card-bg);
          border: var(--style-border-always);
          &:hover {
            background: var(--anzhiyu-main);
          }
        }
      }
    }
  }
}
</style>
