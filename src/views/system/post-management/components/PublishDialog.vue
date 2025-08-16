<script setup lang="ts">
import type { ArticleForm, PostCategory, PostTag } from "@/api/post/type";
import { Plus, Remove } from "@element-plus/icons-vue";
import { computed, ref, watch } from "vue";
import ImageUpload from "@/components/ImageUpload/index.vue";

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
  "confirm-publish"
]);

const activeTab = ref("common");

const isVisible = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});

const internalForm = props.form;
const copyrightType = ref<"original" | "reprint">("original");

watch(
  () => props.modelValue,
  isVisible => {
    if (isVisible) {
      activeTab.value = "common";
      if (props.form.copyright_author) {
        copyrightType.value = "reprint";
      } else {
        copyrightType.value = "original";
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

const statusOptions = [
  { value: "PUBLISHED", label: "发布" },
  { value: "DRAFT", label: "草稿" },
  { value: "ARCHIVED", label: "归档" }
];

const addSummaryInput = () => {
  if (!internalForm.summaries) {
    internalForm.summaries = [];
  }
  if (internalForm.summaries.length < 3) {
    internalForm.summaries.push("");
  }
};

const removeSummaryInput = (index: number) => {
  internalForm.summaries.splice(index, 1);
};

const handleConfirm = () => {
  internalForm.copyright = true;
  emit("confirm-publish");
};
</script>

<template>
  <el-dialog
    v-model="isVisible"
    :title="form.status === 'PUBLISHED' ? '更新文章' : '发布文章'"
    width="860px"
    top="8vh"
    append-to-body
    class="publish-dialog"
  >
    <el-tabs v-model="activeTab" class="publish-tabs">
      <el-tab-pane label="常用设置" name="common">
        <el-form :model="internalForm" label-position="top">
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="分类" prop="post_category_ids">
                <el-select
                  :key="props.categorySelectKey"
                  v-model="internalForm.post_category_ids"
                  multiple
                  filterable
                  allow-create
                  default-first-option
                  placeholder="选择或创建分类 (最多3个)"
                  style="width: 100%"
                  no-data-text="输入名称后按回车键创建"
                  :multiple-limit="3"
                  @change="values => emit('change-category', values)"
                >
                  <el-option
                    v-for="item in categoryOptions"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="标签" prop="post_tag_ids">
                <el-select
                  :key="props.tagSelectKey"
                  v-model="internalForm.post_tag_ids"
                  multiple
                  filterable
                  allow-create
                  default-first-option
                  placeholder="选择或创建标签"
                  style="width: 100%"
                  no-data-text="输入名称后按回车键创建"
                  @change="values => emit('change-tag', values)"
                >
                  <el-option
                    v-for="item in tagOptions"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="封面图" prop="cover_url">
                <ImageUpload v-model="internalForm.cover_url" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="顶部大图 (可选)" prop="top_img_url">
                <ImageUpload v-model="internalForm.top_img_url" />
                <div class="form-item-help">若不填, 将自动使用封面图URL</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="状态" prop="status">
                <el-radio-group
                  v-model="internalForm.status"
                  class="status-radio-group"
                >
                  <el-radio-button
                    v-for="item in statusOptions"
                    :key="item.value"
                    :value="item.value"
                    >{{ item.label }}</el-radio-button
                  >
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="文章类型">
                <el-radio-group v-model="copyrightType">
                  <el-radio-button value="original">原创</el-radio-button>
                  <el-radio-button value="reprint">转载</el-radio-button>
                </el-radio-group>
              </el-form-item>
              <div v-if="copyrightType === 'reprint'">
                <el-form-item label="版权作者 (可选)" prop="copyright_author">
                  <el-input
                    v-model="internalForm.copyright_author"
                    placeholder="请输入原文作者"
                  />
                </el-form-item>
              </div>
            </el-col>
            <el-col :span="24">
              <el-form-item label="摘要" prop="summaries">
                <div
                  v-for="(summary, index) in internalForm.summaries"
                  :key="index"
                  class="summary-item"
                >
                  <el-input
                    v-model="internalForm.summaries[index]"
                    placeholder="请输入单行摘要..."
                  />
                  <el-button
                    :icon="Remove"
                    type="danger"
                    circle
                    plain
                    @click="removeSummaryInput(index)"
                  />
                </div>
                <el-button
                  v-if="
                    !internalForm.summaries || internalForm.summaries.length < 3
                  "
                  :icon="Plus"
                  type="primary"
                  plain
                  style="width: 100%"
                  @click="addSummaryInput"
                >
                  新增摘要 ({{ internalForm.summaries?.length || 0 }}/3)
                </el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="高级设置" name="advanced">
        <el-form :model="internalForm" label-position="top">
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="自定义永久链接 (可选)" prop="abbrlink">
                <el-input
                  v-model="internalForm.abbrlink"
                  placeholder="例如: my-awesome-post"
                />
                <div class="form-item-help">唯一、友好，留空则自动生成。</div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="IP 属地 (可选)" prop="ip_location">
                <el-input
                  v-model="internalForm.ip_location"
                  placeholder="留空则自动获取"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="首页推荐排序">
                <el-input-number
                  v-model="internalForm.home_sort"
                  :min="0"
                  controls-position="right"
                  style="width: 100%"
                  placeholder="0"
                />
                <div class="form-item-help">
                  0则不推荐, >0则推荐, 值越小越靠前
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="文章置顶排序">
                <el-input-number
                  v-model="internalForm.pin_sort"
                  :min="0"
                  controls-position="right"
                  style="width: 100%"
                  placeholder="0"
                />
                <div class="form-item-help">
                  0则不置顶, >0则置顶, 值越小越靠前
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="手动指定主色调">
                <el-switch v-model="internalForm.is_primary_color_manual" />
              </el-form-item>
              <el-form-item
                v-if="internalForm.is_primary_color_manual"
                label="主色调"
                prop="primary_color"
              >
                <el-color-picker v-model="internalForm.primary_color" />
              </el-form-item>
              <el-form-item
                v-else-if="
                  !internalForm.is_primary_color_manual &&
                  internalForm.primary_color
                "
                label="主色调 (自动获取)"
              >
                <el-color-picker
                  v-model="internalForm.primary_color"
                  disabled
                />
                <div class="form-item-help" style="margin-left: 10px">
                  由封面图自动提取
                </div>
              </el-form-item>
            </el-col>
            <el-col v-if="copyrightType === 'reprint'" :span="12">
              <el-form-item
                label="版权作者链接 (可选)"
                prop="copyright_author_href"
              >
                <el-input
                  v-model="internalForm.copyright_author_href"
                  placeholder="https://..."
                />
              </el-form-item>
              <el-form-item label="版权来源链接 (可选)" prop="copyright_url">
                <el-input
                  v-model="internalForm.copyright_url"
                  placeholder="转载文章的原始链接"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="isVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="isSubmitting"
          @click="handleConfirm"
        >
          {{ form.status === "PUBLISHED" ? "确认更新" : "确认发布" }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.form-item-help {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  margin-top: 4px;
}
.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin-bottom: 8px;

  .el-input {
    flex-grow: 1;
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

:deep(.el-dialog__body) {
  padding: 10px 20px 20px 20px;
}

.publish-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 20px;
  }
}

:deep(.el-form-item__content) {
  align-items: center;
}
</style>
