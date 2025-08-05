<template>
  <div class="highlight-tag-selector">
    <el-transfer
      v-model="selectedKeys"
      :data="transferData"
      :titles="['所有标签', '高亮标签']"
      :button-texts="['移除', '选择']"
      filterable
      filter-placeholder="搜索标签"
      :loading="loading"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { getTagList } from "@/api/post";
import type { PostTag } from "@/api/post/type";

// 使用 defineModel 与父组件进行双向绑定 (v-model)
const selectedKeys = defineModel<string[]>({ required: true });

const allTags = ref<PostTag[]>([]);
const loading = ref(false);

// 将从 API 获取的标签数据格式化为 el-transfer 组件需要的数据格式
const transferData = computed(() => {
  return allTags.value.map(tag => ({
    key: tag.id,
    label: tag.name,
    disabled: false
  }));
});

// 组件挂载后，调用 API 获取所有标签
onMounted(async () => {
  loading.value = true;
  try {
    const res = await getTagList("name");
    if (res.code === 200) {
      allTags.value = res.data || [];
    }
  } catch (error) {
    console.error("获取标签列表失败:", error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.highlight-tag-selector {
  :deep(.el-transfer-panel) {
    width: 280px;
  }
}
</style>
