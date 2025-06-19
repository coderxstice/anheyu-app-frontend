<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-15 11:31:00
 * @LastEditTime: 2025-06-19 18:11:39
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { useBoolean } from "../../hooks/useBoolean";
import SearchModal from "./components/SearchModal.vue";

const { bool: show, toggle } = useBoolean();
function handleSearch() {
  toggle();
}
</script>

<template>
  <div>
    <div
      class="search-container w-[40px] h-[40px] flex-c cursor-pointer navbar-bg-hover rounded-lg"
      @click="handleSearch"
    >
      <IconifyIconOffline icon="ri:search-line" />
    </div>
    <SearchModal v-model:value="show" />
  </div>
</template>
