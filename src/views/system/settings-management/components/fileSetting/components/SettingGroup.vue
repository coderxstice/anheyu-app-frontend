<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-07-24 17:58:57
 * @LastEditTime: 2025-07-24 18:21:43
 * @LastEditors: 安知鱼
-->
<template>
  <el-collapse-item :name="name" class="setting-group">
    <template #title>
      <div class="setting-group-header">
        <el-checkbox
          :model-value="enabled"
          :label="label"
          size="large"
          @update:model-value="$emit('update:enabled', $event)"
          @click.stop
        />
      </div>
    </template>
    <div class="setting-group-content">
      <p class="description">
        <slot name="description" />
      </p>
      <slot />
    </div>
  </el-collapse-item>
</template>

<script setup lang="ts">
import { ElCollapseItem, ElCheckbox } from "element-plus";

defineProps<{
  name: string;
  label: string;
  enabled: boolean;
}>();

defineEmits(["update:enabled"]);
</script>

<style scoped lang="scss">
.setting-group {
  margin-bottom: 0;
  border-right: 1px solid var(--el-border-color-light);
  border-left: 1px solid var(--el-border-color-light);

  &:first-of-type {
    border-top: 1px solid var(--el-border-color-light);
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
  }

  &:last-of-type {
    border-bottom: 1px solid var(--el-border-color-light);
    border-bottom-right-radius: 4px;
    border-bottom-left-radius: 4px;
  }

  &:not(:last-of-type) {
    border-bottom: none;
  }

  :deep(.el-collapse-item__header) {
    height: 56px;
    padding: 0 16px;
    border-bottom: 1px solid transparent;

    &.is-active {
      border-bottom-color: var(--el-border-color-light);
    }
  }

  :deep(.el-collapse-item__wrap) {
    border-bottom: none;
  }

  :deep(.el-collapse-item__content) {
    padding: 0;
  }
}

.setting-group-header {
  display: flex;
  align-items: center;
  width: 100%;

  .el-checkbox {
    :deep(.el-checkbox__label) {
      font-size: 16px;
      font-weight: 500;
      color: var(--anzhiyu-fontcolor);
    }
  }
}
</style>
