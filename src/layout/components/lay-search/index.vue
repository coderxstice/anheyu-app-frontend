<script setup lang="ts">
import { ref, defineAsyncComponent } from "vue";
const SearchModal = defineAsyncComponent(
  () => import("./components/SearchModal.vue")
);

const show = ref(false);

// 3. 定义点击事件处理器。
function handleSearch() {
  show.value = true;
}
</script>

<template>
  <div>
    <div
      v-ripple
      class="search-container w-[40px] h-[40px] flex-c cursor-pointer navbar-bg-hover rounded-lg"
      @click="handleSearch"
    >
      <IconifyIconOffline icon="ri:search-line" />
    </div>

    <SearchModal v-if="show" v-model:value="show" />
  </div>
</template>
