<!--
 * @Description: 常用设置Tab组件
 * @Author: 安知鱼
 * @Date: 2025-12-27
-->
<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import { computed } from "vue";
import type { ArticleForm, PostCategory, PostTag } from "@/api/post/type";
import {
  Plus,
  Remove,
  Setting,
  InfoFilled,
  Link
} from "@element-plus/icons-vue";
import ImageUpload from "@/components/ImageUpload/index.vue";
import { useUserStoreHook } from "@/store/modules/user";

const props = defineProps<{
  form: ArticleForm;
  categoryOptions: PostCategory[];
  tagOptions: PostTag[];
  categorySelectKey: number;
  tagSelectKey: number;
  copyrightType: "original" | "reprint";
}>();

const emit = defineEmits<{
  (e: "change-category", values: string[]): void;
  (e: "change-tag", values: string[]): void;
  (e: "update:copyrightType", value: "original" | "reprint"): void;
  (e: "open-category-manager"): void;
}>();

const userStore = useUserStoreHook();
const isAdmin = computed(() => userStore.roles.includes("1"));

// 状态选项
const statusOptions = [
  { value: "PUBLISHED", label: "发布" },
  { value: "DRAFT", label: "草稿" },
  { value: "SCHEDULED", label: "定时发布" },
  { value: "ARCHIVED", label: "归档" }
];

// 判断是否已选择系列分类
const hasSeriesCategory = computed(() => {
  if (
    !props.form.post_category_ids ||
    props.form.post_category_ids.length === 0
  ) {
    return false;
  }
  const selectedId = props.form.post_category_ids[0];
  const category = props.categoryOptions.find(c => c.id === selectedId);
  return category?.is_series ?? false;
});

// 判断是否已选择多个普通分类
const hasMultipleRegularCategories = computed(() => {
  return (
    props.form.post_category_ids &&
    props.form.post_category_ids.length > 0 &&
    !hasSeriesCategory.value
  );
});

// 摘要管理
const addSummaryInput = () => {
  if (!props.form.summaries) props.form.summaries = [];
  if (props.form.summaries.length < 3) {
    props.form.summaries.push("");
  }
};

const removeSummaryInput = (index: number) => {
  if (props.form.summaries) {
    props.form.summaries.splice(index, 1);
  }
};

// 内部copyrightType状态
const internalCopyrightType = computed({
  get: () => props.copyrightType,
  set: val => emit("update:copyrightType", val)
});
</script>

<template>
  <el-form :model="form" label-position="top">
    <el-row :gutter="24">
      <el-col :span="12">
        <el-form-item label="分类" prop="post_category_ids">
          <template #label>
            <span>分类</span>
            <el-tooltip placement="top" :show-arrow="false">
              <template #content>
                一篇文章可选择多个普通分类，或单个系列分类。<br />
                如需增改，请点击右侧按钮进行管理。
              </template>
              <el-icon class="label-icon"><InfoFilled /></el-icon>
            </el-tooltip>
            <el-button
              type="primary"
              :icon="Setting"
              text
              size="small"
              class="manage-btn"
              @click="emit('open-category-manager')"
            >
              管理分类
            </el-button>
          </template>
          <el-select
            :key="categorySelectKey"
            v-model="form.post_category_ids"
            multiple
            filterable
            placeholder="请选择分类"
            style="width: 100%"
            no-data-text="暂无分类，请在'管理分类'中添加"
            :multiple-limit="hasSeriesCategory ? 1 : 3"
            popper-class="hide-selected-check"
            @change="values => emit('change-category', values)"
          >
            <el-option
              v-for="item in categoryOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
              :disabled="
                (hasSeriesCategory && item.id !== form.post_category_ids[0]) ||
                (hasMultipleRegularCategories && item.is_series)
              "
            >
              <div class="category-option-item">
                <span>{{ item.name }}</span>
                <el-tag
                  v-if="item.is_series"
                  type="success"
                  size="small"
                  effect="light"
                  round
                  >系列</el-tag
                >
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item label="标签" prop="post_tag_ids">
          <el-select
            :key="tagSelectKey"
            v-model="form.post_tag_ids"
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
          <ImageUpload v-model="form.cover_url" :can-upload="isAdmin" />
          <el-input
            v-model="form.cover_url"
            placeholder="或直接输入图片URL"
            style="margin-top: 8px"
          >
            <template #prefix>
              <el-icon><Link /></el-icon>
            </template>
          </el-input>
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item label="顶部大图 (可选)" prop="top_img_url">
          <ImageUpload v-model="form.top_img_url" :can-upload="isAdmin" />
          <el-input
            v-model="form.top_img_url"
            placeholder="或直接输入图片URL"
            style="margin-top: 8px"
          >
            <template #prefix>
              <el-icon><Link /></el-icon>
            </template>
          </el-input>
          <div class="form-item-help">若不填, 将自动使用封面图URL</div>
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status" class="status-radio-group">
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
          <el-radio-group v-model="internalCopyrightType">
            <el-radio-button value="original">原创</el-radio-button>
            <el-radio-button value="reprint">转载</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <div v-if="copyrightType === 'reprint'">
          <el-form-item label="版权作者 (可选)" prop="copyright_author">
            <el-input
              v-model="form.copyright_author"
              placeholder="请输入原文作者"
            />
          </el-form-item>
        </div>
      </el-col>

      <el-col :span="24">
        <el-form-item label="摘要" prop="summaries">
          <div
            v-for="(summary, index) in form.summaries"
            :key="index"
            class="summary-item"
          >
            <el-input
              v-model="form.summaries[index]"
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
            v-if="!form.summaries || form.summaries.length < 3"
            :icon="Plus"
            type="primary"
            plain
            style="width: 100%"
            @click="addSummaryInput"
          >
            新增摘要 ({{ form.summaries?.length || 0 }}/3)
          </el-button>
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

<style scoped lang="scss">
.label-icon {
  margin-left: 4px;
  cursor: help;
  color: var(--el-text-color-secondary);
}

.manage-btn {
  margin-left: 8px;
  padding: 2px 8px;
}

.category-option-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.form-item-help {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.summary-item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;

  .el-input {
    flex: 1;
  }
}
</style>
