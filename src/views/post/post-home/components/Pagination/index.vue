<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter, useRoute } from "vue-router"; // 引入 useRoute

const props = defineProps({
  page: { type: Number, required: true },
  pageSize: { type: Number, required: true },
  total: { type: Number, required: true }
});

const emit = defineEmits(["current-change"]);

const router = useRouter();
const route = useRoute(); // 初始化 route
const totalPages = computed(() => Math.ceil(props.total / props.pageSize));
const jumpPage = ref("");

const pageNumbers = computed(() => {
  const page = props.page;
  const total = totalPages.value;
  const showCount = 5;
  const arr = [];

  if (total <= showCount + 2) {
    for (let i = 2; i < total; i++) {
      arr.push(i);
    }
    return arr;
  }

  let start = Math.max(2, page - Math.floor((showCount - 3) / 2));
  let end = Math.min(total - 1, start + showCount - 3);

  if (page < showCount - 1) {
    start = 2;
    end = start + showCount - 3;
  }

  if (page > total - (showCount - 2)) {
    end = total - 1;
    start = end - showCount + 3;
  }

  for (let i = start; i <= end; i++) {
    arr.push(i);
  }

  return arr;
});

const showStartEllipsis = computed(
  () => pageNumbers.value.length > 0 && pageNumbers.value[0] > 2
);
const showEndEllipsis = computed(
  () =>
    pageNumbers.value.length > 0 &&
    pageNumbers.value[pageNumbers.value.length - 1] < totalPages.value - 1
);

// 修改 getPageUrl 函数，使其能够处理分类路径
const getPageUrl = (p: number) => {
  const name = route.params.name as string;
  const path = route.path;

  // 检查是否在分类页
  if (path.startsWith("/categories/")) {
    if (p === 1) return `/categories/${name}`;
    return `/categories/${name}/page/${p}`;
  }
  // 检查是否在标签页
  else if (path.startsWith("/tags/")) {
    if (p === 1) return `/tags/${name}`;
    return `/tags/${name}/page/${p}`;
  }
  // 否则就是首页
  else {
    if (p === 1) return "/";
    return `/page/${p}`;
  }
};

const handlePageChange = (newPage: number) => {
  if (newPage > 0 && newPage <= totalPages.value && newPage !== props.page) {
    router.push(getPageUrl(newPage));
    emit("current-change", newPage);
  }
};

const goToPage = () => {
  const pageNum = parseInt(jumpPage.value, 10);
  if (!isNaN(pageNum)) {
    handlePageChange(pageNum);
  }
  jumpPage.value = "";
};
</script>

<template>
  <nav v-if="totalPages > 1" id="pagination">
    <div
      v-if="page > 1"
      class="extend prev"
      @click="handlePageChange(page - 1)"
    >
      <i class="anzhiyufont anzhiyu-icon-chevron-left" />
      <div class="pagination_tips_prev">上页</div>
    </div>

    <div class="pagination">
      <div
        class="page-number"
        :class="{ current: 1 === page }"
        @click="handlePageChange(1)"
      >
        1
      </div>

      <span v-if="showStartEllipsis" class="space">…</span>

      <div
        v-for="p in pageNumbers"
        :key="p"
        class="page-number"
        :class="{ current: p === page }"
        @click="handlePageChange(p)"
      >
        {{ p }}
      </div>

      <span v-if="showEndEllipsis" class="space">…</span>

      <div
        v-if="totalPages > 1"
        class="page-number"
        :class="{ current: totalPages === page }"
        @click="handlePageChange(totalPages)"
      >
        {{ totalPages }}
      </div>

      <div class="toPageGroup">
        <div class="extend">
          <i class="anzhiyufont anzhiyu-icon-angles-right" />
        </div>
        <input
          v-model="jumpPage"
          class="toPageText"
          type="text"
          inputmode="numeric"
          maxlength="3"
          aria-label="toPage"
          @keyup.enter="goToPage"
        />
        <div class="toPageButton" @click="goToPage">
          <i class="anzhiyufont anzhiyu-icon-angles-right" />
        </div>
      </div>
    </div>

    <div
      v-if="page < totalPages"
      class="extend next"
      @click="handlePageChange(page + 1)"
    >
      <div class="pagination_tips_next">下页</div>
      <i class="anzhiyufont anzhiyu-icon-chevron-right" />
    </div>
  </nav>
</template>

<style lang="scss" scoped>
/* 样式部分无需改动 */
#pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 1rem 0 0;
  height: 2.5rem;
  gap: 0.5rem;
  position: relative;
  .extend {
    width: 5rem;
    &:hover {
      transform: scale(1.03);
    }
  }
  .prev {
    position: absolute;
    left: 0;
    .pagination_tips_prev {
      margin-right: -32px;
      transition: 0.3s;
      opacity: 0;
    }
    &:hover {
      .pagination_tips_prev {
        margin-right: 2px;
        opacity: 1;
        -ms-filter: none;
        filter: none;
        white-space: nowrap;
      }
    }
  }
  .next {
    position: absolute;
    right: 0;

    .pagination_tips_next {
      margin-left: -32px;
      transition: 0.3s;
      opacity: 0;
    }

    &:hover {
      .pagination_tips_next {
        margin-left: 2px;
        opacity: 1;
        -ms-filter: none;
        filter: none;
        white-space: nowrap;
      }
    }
  }
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  user-select: none;
}

.page-number,
.extend {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  border: var(--style-border);
  background-color: var(--anzhiyu-card-bg);
  color: var(--anzhiyu-fontcolor, #333);
}

.page-number:hover,
.extend:hover {
  color: var(--anzhiyu-theme);
  border: var(--style-border-hover);
  box-shadow: var(--anzhiyu-shadow-main);
}

.current {
  background: var(--anzhiyu-main);
  color: var(--anzhiyu-white);
  border-color: var(--anzhiyu-main);
  pointer-events: none;
}

.space {
  padding: 0 0.2rem;
}

.toPageGroup {
  position: relative;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 8px;
  border: var(--style-border-always);
  overflow: hidden;
  transition: width 0.3s ease;
}

.toPageGroup > .extend {
  border: none;
  width: 100%;
  height: 100%;
}

.toPageGroup .toPageText {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  padding: 0 2.5rem 0 1rem;
  font-size: 1rem;
  color: var(--anzhiyu-fontcolor);
  background: var(--anzhiyu-card-bg, #fff);
}

.toPageGroup .toPageButton {
  position: absolute;
  top: 50%;
  right: 4px;
  transform: translateY(-50%);
  width: 1.865rem;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  color: var(--anzhiyu-fontcolor);
}

.toPageGroup:hover {
  width: 6rem;
  border-color: var(--anzhiyu-main);
  box-shadow: var(--anzhiyu-shadow-main, 0 4px 10px rgba(73, 177, 245, 0.3));
  .toPageButton {
    height: 30px;
    background: var(--anzhiyu-secondbg);
    border: 1px solid var(--anzhiyu-none);
    border-radius: 4px;
  }
}

.toPageGroup:hover > .extend {
  opacity: 0;
}
</style>
