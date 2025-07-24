<!-- src/components/file-settings/FileSettings.vue -->
<template>
  <FileUploadSettings v-model="formData" />
  <ThumbnailSettings v-model="formData" />
  <MediaExtractorSettings v-model="formData" />
  <TaskQueueSettings v-model="formData" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { FileSettingsInfo } from "../../type";
import FileUploadSettings from "./components/FileUploadSettings.vue";
import ThumbnailSettings from "./components/ThumbnailGeneratorSettings.vue";
import MediaExtractorSettings from "./components/MediaExtractorSettings.vue";
import TaskQueueSettings from "./components/TaskQueueSettings.vue";

const props = defineProps<{
  modelValue: FileSettingsInfo;
}>();

const emit = defineEmits(["update:modelValue"]);

// Proxy the v-model for all children
const formData = computed({
  get: () => props.modelValue,
  set: value => {
    emit("update:modelValue", value);
  }
});
</script>

<style lang="scss">
.el-form-item {
  margin-bottom: 24px;
}

.form-item-help {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
  margin-top: 4px;
}

h2 {
  font-size: 1.2em;
  font-weight: 600;
  margin-top: 40px;
  margin-bottom: 20px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  &:first-child {
    margin-top: 10px;
  }
}

.setting-alert {
  margin-bottom: 20px;
  p {
    margin: 0;
    line-height: 1.6;
  }
  .el-link {
    font-size: 1em;
    vertical-align: baseline;
    margin-left: 8px;
  }
}

/*
  Styles for collapse groups are complex and used in multiple children.
  Instead of duplicating them or using a separate SCSS import,
  we can define them here unscoped, so they apply to children.
*/
.setting-collapse {
  border-top: none;
  border-bottom: none;

  .setting-group {
    margin-bottom: 0;
    border-left: 1px solid var(--el-border-color-light) !important;
    border-right: 1px solid var(--el-border-color-light) !important;
    &:first-of-type {
      border-top: 1px solid var(--el-border-color-light) !important;
      border-top-left-radius: 4px;
      border-top-right-radius: 4px;
    }
    &:last-of-type {
      border-bottom: 1px solid var(--el-border-color-light) !important;
      border-bottom-left-radius: 4px;
      border-bottom-right-radius: 4px;
    }
    &:not(:last-of-type) {
      border-bottom: none;
    }

    .el-collapse-item__header {
      padding: 0 16px;
      height: 56px;
      border-bottom: 1px solid transparent;
      &.is-active {
        border-bottom-color: var(--el-border-color-light);
      }
    }

    .el-collapse-item__wrap {
      border-bottom: none;
    }

    .el-collapse-item__content {
      padding: 0;
    }
  }
}

.setting-group-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  .el-checkbox {
    .el-checkbox__label {
      font-size: 16px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }
  }
}
</style>
