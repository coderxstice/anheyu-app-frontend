<script setup lang="ts">
const props = defineProps<{
  isSubmitting: boolean;
  isEditMode: boolean;
  status?: string;
  postId?: string;
  postSlug?: string;
}>();

const emit = defineEmits(["save", "publish"]);

// 查看文章
const viewPost = () => {
  // 优先使用 abbrlink，如果没有则使用 id
  const identifier = props.postSlug || props.postId;
  if (identifier) {
    // 在新标签页中打开文章
    window.open(`/posts/${identifier}`, "_blank");
  }
};
</script>

<template>
  <div class="action-buttons">
    <el-button :loading="isSubmitting" @click="emit('save')"
      >存为草稿</el-button
    >
    <el-button
      v-if="status === 'PUBLISHED' && (postSlug || postId)"
      type="success"
      @click="viewPost"
    >
      查看文章
    </el-button>
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
