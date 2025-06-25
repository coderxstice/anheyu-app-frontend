<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-24 14:34:19
 * @LastEditTime: 2025-06-25 14:41:16
 * @LastEditors: 安知鱼
-->
<template>
  <div class="file-heard-actions w-full flex items-center">
    <el-button
      v-ripple
      :icon="useRenderIcon(Upload)"
      type="primary"
      class="mr-2"
      @click="handleNewButtonClick"
    >
      新建
    </el-button>

    <div class="search-wrapper" @click="openSearchOverlay">
      <el-input placeholder="搜索文件" class="search-input" readonly>
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <SearchOverlay
      :visible="isSearchVisible"
      :origin="searchOrigin"
      @close="isSearchVisible = false"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import SearchOverlay from "./SearchOverlay.vue";
import Upload from "@iconify-icons/ep/upload";
import { Search } from "@element-plus/icons-vue";

// 定义组件要发出的事件
const emit = defineEmits<{
  (e: "open-new-menu", event: MouseEvent): void;
  (e: "trigger-search", event: MouseEvent): void;
}>();

const handleNewButtonClick = (event: MouseEvent) => {
  emit("open-new-menu", event);
};

const isSearchVisible = ref(false);
const searchOrigin = ref({ x: 0, y: 0 });

const openSearchOverlay = (event: MouseEvent) => {
  emit("trigger-search", event);
};
</script>

<style scoped lang="scss">
.file-heard-actions {
  display: flex;
}
/* 使搜索框看起来可点击 */
.search-wrapper {
  cursor: pointer;
  transform: scale(1.02);
  margin-bottom: 2px;
}
/* 防止 readonly 状态下的默认样式 */
:deep(.el-input.is-readonly .el-input__wrapper) {
  cursor: pointer !important;
  &:hover {
    box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
  }
}
:deep(.el-input.is-readonly .el-input__inner) {
  cursor: pointer !important;
}
</style>
