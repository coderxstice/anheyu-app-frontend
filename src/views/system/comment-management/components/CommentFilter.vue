<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import type { CommentQuery } from "@/api/comment/type";
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
  ElSelect,
  ElOption
} from "element-plus";
import { IconifyIconOffline } from "@/components/ReIcon";
import SearchIcon from "@iconify-icons/ri/search-line";
import RefreshIcon from "@iconify-icons/ri/refresh-line";

const props = defineProps<{
  modelValue: CommentQuery;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: CommentQuery): void;
  (e: "search"): void;
}>();

const query = ref<CommentQuery>({});

const statusOptions = [
  { label: "全部", value: "" },
  { label: "已发布", value: 1 },
  { label: "待审核", value: 2 }
];

watch(
  () => props.modelValue,
  newValue => {
    query.value = { ...newValue };
  },
  { immediate: true, deep: true }
);

// 2. 简化 handleSearch 函数
const handleSearch = () => {
  console.log("【筛选组件】将要同步给父组件的参数是:", query.value);

  // 先将当前筛选器的完整状态同步给父组件
  emit("update:modelValue", query.value);
  // 使用 nextTick 确保父组件的 v-model 更新完成后再触发搜索
  nextTick(() => {
    emit("search");
  });
};

// 3. 优化 handleReset 函数
const handleReset = () => {
  // 保留父组件传入的分页大小，将页码重置为1，清空其他筛选条件
  query.value = {
    page: 1,
    pageSize: props.modelValue.pageSize
  };
  // 调用搜索，将重置后的状态同步给父组件并触发查询
  handleSearch();
};
</script>

<template>
  <el-form :model="query" inline>
    <el-form-item label="昵称">
      <el-input
        v-model="query.nickname"
        placeholder="输入昵称搜索"
        clearable
        style="width: 150px"
        @keyup.enter="handleSearch"
      />
    </el-form-item>
    <el-form-item label="邮箱">
      <el-input
        v-model="query.email"
        placeholder="输入邮箱搜索"
        style="width: 220px"
        clearable
        @keyup.enter="handleSearch"
      />
    </el-form-item>
    <el-form-item label="文章Slug">
      <el-input
        v-model="query.article_slug"
        placeholder="输入文章Slug搜索"
        style="width: 220px"
        clearable
        @keyup.enter="handleSearch"
      />
    </el-form-item>
    <el-form-item label="IP地址">
      <el-input
        v-model="query.ip_address"
        style="width: 220px"
        placeholder="输入IP搜索"
        clearable
        @keyup.enter="handleSearch"
      />
    </el-form-item>
    <el-form-item label="评论内容">
      <el-input
        v-model="query.content"
        placeholder="输入内容搜索"
        style="width: 220px"
        clearable
        @keyup.enter="handleSearch"
      />
    </el-form-item>
    <el-form-item label="评论状态">
      <el-select
        v-model="query.status"
        placeholder="请选择状态"
        clearable
        style="width: 120px"
        @change="handleSearch"
      >
        <el-option
          v-for="item in statusOptions"
          :key="item.label"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="handleSearch">
        <IconifyIconOffline :icon="SearchIcon" class="mr-1" />
        搜索
      </el-button>
      <el-button @click="handleReset">
        <IconifyIconOffline :icon="RefreshIcon" class="mr-1" />
        重置
      </el-button>
    </el-form-item>
  </el-form>
</template>
