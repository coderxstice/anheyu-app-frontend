<script setup lang="ts">
defineProps<{
  isSubmitting: boolean;
  isEditMode: boolean;
  status?: string;
  postId?: string;
  postSlug?: string;
}>();

const emit = defineEmits(["save", "publish"]);
</script>

<template>
  <div class="action-buttons">
    <el-button :loading="isSubmitting" @click="emit('save')"
      >存为草稿</el-button
    >
    <el-button
      style="width: 120px"
      type="primary"
      :loading="isSubmitting"
      @click="emit('publish')"
    >
      {{ isEditMode && status === "PUBLISHED" ? "更新文章" : "发布文章" }}
    </el-button>
  </div>
</template>

<style lang="scss" scoped>
.action-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
}
</style>
