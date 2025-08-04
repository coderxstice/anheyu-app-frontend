<script setup lang="ts">
import { computed } from "vue";

const props = defineProps({
  page: { type: Number, required: true },
  pageSize: { type: Number, required: true },
  total: { type: Number, required: true }
});

const emit = defineEmits(["current-change"]);

const totalPages = computed(() => Math.ceil(props.total / props.pageSize));

const pageNumbers = computed(() => {
  const pagesToShow = [props.page - 1, props.page, props.page + 1];
  return pagesToShow.filter(p => p > 0 && p <= totalPages.value);
});

const handlePageChange = (newPage: number) => {
  if (newPage > 0 && newPage <= totalPages.value && newPage !== props.page) {
    emit("current-change", newPage);
  }
};
</script>

<template>
  <nav id="pagination">
    <div class="pagination">
      <a
        v-if="page > 1"
        class="extend prev"
        rel="prev"
        @click.prevent="handlePageChange(page - 1)"
      >
        <i class="anzhiyufont anzhiyu-icon-chevron-left" />
      </a>

      <span v-if="pageNumbers[0] > 2">...</span>

      <a
        v-if="pageNumbers[0] > 1"
        class="page-number"
        @click.prevent="handlePageChange(1)"
      >
        1
      </a>

      <a
        v-for="p in pageNumbers"
        :key="p"
        class="page-number"
        :class="{ current: p === page }"
        @click.prevent="handlePageChange(p)"
      >
        {{ p }}
      </a>

      <a
        v-if="pageNumbers[pageNumbers.length - 1] < totalPages"
        class="page-number"
        @click.prevent="handlePageChange(totalPages)"
      >
        {{ totalPages }}
      </a>

      <span v-if="pageNumbers[pageNumbers.length - 1] < totalPages - 1"
        >...</span
      >

      <a
        v-if="page < totalPages"
        class="extend next"
        rel="next"
        @click.prevent="handlePageChange(page + 1)"
      >
        <i class="anzhiyufont anzhiyu-icon-chevron-right" />
      </a>
    </div>
  </nav>
</template>

<style lang="scss" scoped>
/* Styles remain the same */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2rem;
  user-select: none;
}
.page-number,
.extend {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  border: var(--style-border);

  &:hover {
    background: var(--anzhiyu-main);
    color: var(--anzhiyu-white);
    border-color: var(--anzhiyu-main);
  }
}
.current {
  background: var(--anzhiyu-main);
  color: var(--anzhiyu-white);
  border-color: var(--anzhiyu-main);
  cursor: default;
}
</style>
