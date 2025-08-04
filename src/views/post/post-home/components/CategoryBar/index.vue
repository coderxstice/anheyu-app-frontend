<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getCategoryList } from "@/api/post";
import type { PostCategory } from "@/api/post/type";

const emit = defineEmits(["category-change"]);

const categories = ref<PostCategory[]>([]);
const selectedId = ref<string | null>(null);

// 1. 创建模板引用和状态
const catalogBarRef = ref<HTMLElement | null>(null);
const isScrolledToEnd = ref(false);

const fetchCategories = async () => {
  try {
    const { data } = await getCategoryList();
    categories.value = data;
  } catch (error) {
    console.error("获取分类列表失败:", error);
  }
};

const handleSelect = (id: string | null) => {
  selectedId.value = id;
  emit("category-change", id);
};

// 2. 检查滚动位置的函数
const checkScrollPosition = () => {
  const el = catalogBarRef.value;
  if (!el) return;

  // 判断是否滚动到底部（允许1px的误差）
  const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
  isScrolledToEnd.value = atEnd;
};

// 3. 点击滚动按钮的事件处理函数
const handleScrollNext = () => {
  const el = catalogBarRef.value;
  if (!el) return;

  if (isScrolledToEnd.value) {
    // 如果已经在末尾，则滚动回起点
    el.scrollTo({ left: 0, behavior: "smooth" });
  } else {
    // 否则，向右滚动一个可视区域的宽度
    el.scrollBy({ left: el.clientWidth, behavior: "smooth" });
  }
};

onMounted(() => {
  fetchCategories();
  // 组件挂载后，也检查一下初始滚动状态
  // 使用 setTimeout 确保在 DOM 渲染后执行
  setTimeout(checkScrollPosition, 100);
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
            @click="handleSelect(category.id)"
          >
            <a>{{ category.name }}</a>
          </div>
        </div>
      </div>
      <div class="category-bar-next" @click="handleScrollNext">
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
  margin-bottom: 1rem;
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
  flex-shrink: 0; /* 防止被挤压 */

  i {
    /* 7. 为图标添加过渡效果 */
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
</style>
