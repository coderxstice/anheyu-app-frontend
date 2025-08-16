<script setup lang="ts">
import type { ArticleForm, PostCategory, PostTag } from "@/api/post/type";
import { Plus, Remove } from "@element-plus/icons-vue";

const props = defineProps<{
  modelValue: boolean;
  form: ArticleForm;
  categoryOptions: PostCategory[];
  tagOptions: PostTag[];
}>();

const emit = defineEmits([
  "update:modelValue",
  "change-category",
  "change-tag"
]);

// 直接修改 props.form。在某些情况下，这是管理复杂表单对象的务实方法。
const internalForm = props.form;

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
</script>

<template>
  <el-drawer
    :model-value="modelValue"
    title="文章设置"
    direction="rtl"
    size="380px"
    :with-header="true"
    @update:model-value="val => emit('update:modelValue', val)"
  >
    <el-scrollbar>
      <el-form :model="internalForm" label-position="top" class="settings-form">
        <el-collapse model-value="1" style="width: 100%">
          <el-collapse-item title="发布设置" name="1">
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
            <el-form-item label="分类" prop="post_category_ids">
              <el-select
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
            <el-form-item label="标签" prop="post_tag_ids">
              <el-select
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
            <el-form-item label="IP 属地 (可选)" prop="ip_location">
              <el-input
                v-model="internalForm.ip_location"
                placeholder="留空则自动获取"
              />
            </el-form-item>
          </el-collapse-item>

          <el-collapse-item title="媒体与摘要" name="2">
            <el-form-item label="封面图 URL" prop="cover_url">
              <el-input
                v-model="internalForm.cover_url"
                placeholder="https://..."
              />
            </el-form-item>
            <el-form-item label="顶部大图 URL (可选)" prop="top_img_url">
              <el-input
                v-model="internalForm.top_img_url"
                placeholder="https://..."
              />
              <div class="form-item-help">
                若不填, 保存时将自动使用上方封面图的URL
              </div>
            </el-form-item>
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
          </el-collapse-item>

          <el-collapse-item title="排序与展示" name="3">
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
          </el-collapse-item>

          <el-collapse-item title="高级设置" name="4">
            <el-form-item label="自定义永久链接 (可选)" prop="abbrlink">
              <el-input
                v-model="internalForm.abbrlink"
                placeholder="例如: my-awesome-post"
              />
              <div class="form-item-help">
                必须唯一，用于生成更友好的URL。留空则自动生成。
              </div>
            </el-form-item>
            <el-form-item label="显示文章版权">
              <el-switch v-model="internalForm.copyright" />
            </el-form-item>
            <div v-if="internalForm.copyright">
              <el-form-item label="版权作者 (可选)" prop="copyright_author">
                <el-input
                  v-model="internalForm.copyright_author"
                  placeholder="留空则使用站点默认作者"
                />
              </el-form-item>
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
            </div>
          </el-collapse-item>
        </el-collapse>
      </el-form>
    </el-scrollbar>
  </el-drawer>
</template>

<style lang="scss" scoped>
.settings-form {
  padding: 0 5px;
}
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
:deep(.el-collapse-item__header) {
  font-size: 15px;
  font-weight: 500;
}
:deep(.el-drawer__header) {
  margin-bottom: 0;
  padding: 20px;
  border-bottom: 1px solid var(--el-border-color-light);
}
:deep(.el-drawer__body) {
  padding: 0;
}
</style>
