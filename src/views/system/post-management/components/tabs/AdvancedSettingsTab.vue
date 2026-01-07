<!--
 * @Description: 高级设置Tab组件
 * @Author: 安知鱼
 * @Date: 2025-12-27
-->
<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import { ref, watch } from "vue";
import type { ArticleForm } from "@/api/post/type";
import { getPrimaryColor } from "@/api/post";
import { ElMessage } from "element-plus";

const props = defineProps<{
  form: ArticleForm;
  copyrightType: "original" | "reprint";
  keywordTags: string[];
}>();

const emit = defineEmits<{
  (e: "update:keywordTags", value: string[]): void;
}>();

const isFetchingColor = ref(false);
const internalKeywordTags = ref<string[]>([...props.keywordTags]);

// 同步关键词标签
watch(
  () => props.keywordTags,
  newTags => {
    internalKeywordTags.value = [...newTags];
  }
);

watch(
  internalKeywordTags,
  newTags => {
    emit("update:keywordTags", newTags);
  },
  { deep: true }
);

// 禁用未来日期
const disabledFutureDate = (time: Date) => {
  return time.getTime() > Date.now();
};

const disabledFutureHours = () => {
  const now = new Date();
  const hours = [];
  for (let i = now.getHours() + 1; i < 24; i++) {
    hours.push(i);
  }
  return hours;
};

const disabledFutureMinutes = (hour: number) => {
  const now = new Date();
  if (hour === now.getHours()) {
    const minutes = [];
    for (let i = now.getMinutes() + 1; i < 60; i++) {
      minutes.push(i);
    }
    return minutes;
  }
  return [];
};

const disabledFutureSeconds = (hour: number, minute: number) => {
  const now = new Date();
  if (hour === now.getHours() && minute === now.getMinutes()) {
    const seconds = [];
    for (let i = now.getSeconds() + 1; i < 60; i++) {
      seconds.push(i);
    }
    return seconds;
  }
  return [];
};

// 从图片获取主色调
const handleFetchPrimaryColor = async () => {
  const imageUrl = props.form.top_img_url || props.form.cover_url;
  if (!imageUrl) {
    ElMessage.warning("请先设置封面图或顶部大图");
    return;
  }

  isFetchingColor.value = true;
  try {
    const res = await getPrimaryColor(imageUrl);
    if (res?.data?.primary_color) {
      props.form.primary_color = res.data.primary_color;
      ElMessage.success("主色调获取成功");
    } else {
      ElMessage.error("获取主色调失败");
    }
  } catch (error) {
    console.error("获取主色调失败:", error);
    ElMessage.error("获取主色调失败");
  } finally {
    isFetchingColor.value = false;
  }
};
</script>

<template>
  <el-form :model="form" label-position="top" @submit.prevent>
    <el-row :gutter="24">
      <el-col :span="12">
        <el-form-item label="自定义永久链接 (可选)" prop="abbrlink">
          <el-input
            v-model="form.abbrlink"
            placeholder="例如: my-awesome-post"
          />
          <div class="form-item-help">唯一、友好，留空则自动生成。</div>
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item label="IP 属地 (可选)" prop="ip_location">
          <el-input v-model="form.ip_location" placeholder="留空则自动获取" />
        </el-form-item>
      </el-col>

      <el-col :span="24">
        <el-form-item label="关键词 (可选)" prop="keywords">
          <el-input-tag
            v-model="internalKeywordTags"
            tag-type="primary"
            tag-effect="light"
            placeholder="输入关键词后按回车添加"
          />
          <div class="form-item-help">用于SEO优化，建议添加3-5个关键词</div>
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item label="在首页显示">
          <div>
            <el-switch
              v-model="form.show_on_home"
              active-text="是"
              inactive-text="否"
            />
            <div class="form-item-help">控制文章发布后是否在首页展示</div>
          </div>
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item label="首页推荐排序">
          <el-input-number
            v-model="form.home_sort"
            :min="0"
            controls-position="right"
            style="width: 100%"
            placeholder="0"
          />
          <div class="form-item-help">0则不推荐, >0则推荐, 值越小越靠前</div>
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item label="文章置顶排序">
          <el-input-number
            v-model="form.pin_sort"
            :min="0"
            controls-position="right"
            style="width: 100%"
            placeholder="0"
          />
          <div class="form-item-help">0则不置顶, >0则置顶, 值越小越靠前</div>
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item label="手动指定主色调">
          <el-switch v-model="form.is_primary_color_manual" />
        </el-form-item>
        <el-form-item
          v-if="form.is_primary_color_manual"
          label="主色调"
          prop="primary_color"
        >
          <div>
            <div class="primary-color-controls">
              <el-color-picker v-model="form.primary_color" />
              <el-button
                type="primary"
                size="small"
                :loading="isFetchingColor"
                :disabled="!form.cover_url && !form.top_img_url"
                @click="handleFetchPrimaryColor"
              >
                {{ isFetchingColor ? "获取中..." : "从图片获取" }}
              </el-button>
            </div>
            <div class="form-item-help">
              <div>可以从封面图或顶部大图自动提取主色调</div>
            </div>
          </div>
        </el-form-item>
        <el-form-item
          v-else-if="!form.is_primary_color_manual && form.primary_color"
          label="主色调 (自动获取)"
        >
          <el-color-picker v-model="form.primary_color" disabled />
          <div class="form-item-help" style="margin-left: 10px">
            由封面图自动提取
          </div>
        </el-form-item>
      </el-col>

      <el-col v-if="copyrightType === 'reprint'" :span="12">
        <el-form-item label="版权作者链接 (可选)" prop="copyright_author_href">
          <el-input
            v-model="form.copyright_author_href"
            placeholder="https://..."
          />
        </el-form-item>
        <el-form-item label="版权来源链接 (可选)" prop="copyright_url">
          <el-input
            v-model="form.copyright_url"
            placeholder="转载文章的原始链接"
          />
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item label="自定义发布时间 (可选)">
          <el-date-picker
            v-model="form.custom_published_at"
            type="datetime"
            placeholder="选择发布时间"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DDTHH:mm:ssZ"
            :disabled-date="disabledFutureDate"
            :disabled-hours="disabledFutureHours"
            :disabled-minutes="disabledFutureMinutes"
            :disabled-seconds="disabledFutureSeconds"
          />
          <div class="form-item-help">
            留空则使用当前时间，可用于回溯发布（不允许设置未来时间）
          </div>
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item label="自定义更新时间 (可选)">
          <el-date-picker
            v-model="form.custom_updated_at"
            type="datetime"
            placeholder="选择更新时间"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DDTHH:mm:ssZ"
          />
          <div class="form-item-help">
            留空则使用当前时间，可用于手动调整更新时间
          </div>
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

<style scoped lang="scss">
.form-item-help {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.primary-color-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
