<script setup lang="ts">
import type { ArticleForm, PostCategory, PostTag } from "@/api/post/type";
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import AnDialog from "@/components/AnDialog/index.vue";

// 导入子组件
import {
  CommonSettingsTab,
  AdvancedSettingsTab,
  ScheduledPublishTab
} from "./tabs";
import { CategoryManagerDialog } from "./dialogs";

const props = defineProps<{
  modelValue: boolean;
  form: ArticleForm;
  categoryOptions: PostCategory[];
  tagOptions: PostTag[];
  isSubmitting: boolean;
  categorySelectKey: number;
  tagSelectKey: number;
}>();

const emit = defineEmits([
  "update:modelValue",
  "change-category",
  "change-tag",
  "confirm-publish",
  "refresh-categories"
]);

const activeTab = ref("common");
const internalForm = props.form;
const copyrightType = ref<"original" | "reprint">("original");
const isCategoryManagerVisible = ref(false);

// === 关键词标签相关状态 ===
const keywordTags = ref<string[]>([]);

const isVisible = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});

watch(
  () => props.modelValue,
  isVisible => {
    if (isVisible) {
      activeTab.value = "common";
      copyrightType.value = props.form.is_reprint ? "reprint" : "original";
      // 初始化关键词标签
      if (internalForm.keywords) {
        keywordTags.value = internalForm.keywords
          .split(",")
          .map(k => k.trim())
          .filter(k => k !== "");
      } else {
        keywordTags.value = [];
      }
    }
  }
);

watch(copyrightType, newType => {
  if (newType === "original") {
    internalForm.copyright_author = "";
    internalForm.copyright_author_href = "";
    internalForm.copyright_url = "";
  }
});

const handleConfirm = () => {
  // 验证发布时间不能是未来时间
  if (internalForm.custom_published_at) {
    const publishedTime = new Date(internalForm.custom_published_at);
    const now = new Date();
    if (publishedTime.getTime() > now.getTime()) {
      ElMessage.error({
        message: "发布时间不能设置为未来时间",
        customClass: "high-z-index-message"
      });
      return;
    }
  }

  internalForm.copyright = true;
  // 设置文章类型（原创/转载）
  internalForm.is_reprint = copyrightType.value === "reprint";
  // 将关键词标签数组转换为逗号分隔的字符串
  internalForm.keywords = keywordTags.value.join(", ");
  emit("confirm-publish");
};

// 分类管理相关
const handleRefreshCategories = () => {
  emit("refresh-categories");
};
</script>

<template>
  <div>
    <AnDialog
      v-model="isVisible"
      :title="form.status === 'PUBLISHED' ? '更新文章' : '发布文章'"
      width="860px"
      max-height="90vh"
      container-class="publish-dialog"
    >
      <el-tabs v-model="activeTab" class="publish-tabs">
        <el-tab-pane label="常用设置" name="common">
          <CommonSettingsTab
            :form="internalForm"
            :category-options="categoryOptions"
            :tag-options="tagOptions"
            :category-select-key="categorySelectKey"
            :tag-select-key="tagSelectKey"
            :copyright-type="copyrightType"
            @change-category="values => emit('change-category', values)"
            @change-tag="values => emit('change-tag', values)"
            @update:copyright-type="val => (copyrightType = val)"
            @open-category-manager="isCategoryManagerVisible = true"
          />
        </el-tab-pane>

        <el-tab-pane label="高级设置" name="advanced">
          <AdvancedSettingsTab
            v-model:keyword-tags="keywordTags"
            :form="internalForm"
            :copyright-type="copyrightType"
          />
        </el-tab-pane>

        <el-tab-pane label="定时发布" name="scheduled">
          <ScheduledPublishTab :form="internalForm" />
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="isVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="isSubmitting"
          @click="handleConfirm"
        >
          {{
            form.status === "SCHEDULED"
              ? "设置定时发布"
              : form.status === "PUBLISHED"
                ? "确认更新"
                : "确认发布"
          }}
        </el-button>
      </template>
    </AnDialog>

    <CategoryManagerDialog
      v-model="isCategoryManagerVisible"
      :category-options="categoryOptions"
      @refresh-categories="handleRefreshCategories"
    />
  </div>
</template>

<!-- 全局样式：隐藏下拉框选中项的勾选符号 -->
<style lang="scss">
.hide-selected-check .el-select-dropdown__item.is-selected::after {
  display: none;
}
</style>

<style lang="scss" scoped>
.publish-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 20px;
  }
}

:deep(.el-form-item__label) {
  .label-icon {
    margin-left: 4px;
    color: var(--anzhiyu-secondtext);
    vertical-align: middle;
  }

  .manage-btn {
    margin-left: auto;
    font-weight: normal;
  }
}

.status-radio-group {
  width: 100%;

  :deep(.el-radio-button) {
    width: calc(100% / 3);

    .el-radio-button__inner {
      width: 100%;
    }
  }
}
</style>
