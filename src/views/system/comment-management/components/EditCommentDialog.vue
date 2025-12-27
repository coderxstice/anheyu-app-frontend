<script setup lang="ts">
import { ref, reactive, watch, computed } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { updateAdminCommentInfo } from "@/api/comment";
import type { AdminComment } from "@/api/comment/type";

interface Props {
  modelValue: boolean;
  comment: AdminComment | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  success: [comment: AdminComment];
}>();

const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive({
  content: "",
  nickname: "",
  email: "",
  website: ""
});

// 监听打开对话框，初始化表单
watch(
  () => props.modelValue,
  val => {
    if (val && props.comment) {
      form.content = props.comment.content || "";
      form.nickname = props.comment.nickname || "";
      form.email = props.comment.email || "";
      form.website = props.comment.website || "";
    }
  }
);

const visible = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});

const rules: FormRules = {
  content: [
    { required: true, message: "评论内容不能为空", trigger: "blur" },
    { max: 1000, message: "评论内容不能超过 1000 字符", trigger: "blur" }
  ],
  nickname: [
    { required: true, message: "昵称不能为空", trigger: "blur" },
    {
      min: 2,
      max: 50,
      message: "昵称长度必须在 2-50 字符之间",
      trigger: "blur"
    }
  ],
  email: [{ type: "email", message: "请输入有效的邮箱地址", trigger: "blur" }],
  website: [
    {
      pattern: /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/,
      message: "请输入有效的网站地址",
      trigger: "blur"
    }
  ]
};

const handleClose = () => {
  visible.value = false;
  formRef.value?.resetFields();
};

const handleSubmit = async () => {
  if (!props.comment) return;

  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;

  try {
    // 构建更新数据，只包含有变化的字段
    const updateData: {
      content?: string;
      nickname?: string;
      email?: string;
      website?: string;
    } = {};

    if (form.content !== (props.comment.content || "")) {
      updateData.content = form.content;
    }
    if (form.nickname !== (props.comment.nickname || "")) {
      updateData.nickname = form.nickname;
    }
    if (form.email !== (props.comment.email || "")) {
      updateData.email = form.email;
    }
    if (form.website !== (props.comment.website || "")) {
      updateData.website = form.website;
    }

    // 检查是否有变化
    if (Object.keys(updateData).length === 0) {
      ElMessage.info("没有需要更新的内容");
      handleClose();
      return;
    }

    const { data } = await updateAdminCommentInfo(props.comment.id, updateData);
    ElMessage.success("评论信息更新成功");
    emit("success", data);
    handleClose();
  } catch {
    ElMessage.error("更新失败，请稍后重试");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <el-dialog
    v-model="visible"
    title="编辑评论"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
      label-position="top"
    >
      <el-form-item label="昵称" prop="nickname">
        <el-input
          v-model="form.nickname"
          placeholder="请输入评论者昵称"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="邮箱" prop="email">
        <el-input
          v-model="form.email"
          placeholder="请输入评论者邮箱（用于显示头像）"
          clearable
        />
      </el-form-item>

      <el-form-item label="网站" prop="website">
        <el-input
          v-model="form.website"
          placeholder="请输入评论者网站 URL"
          clearable
        />
      </el-form-item>

      <el-form-item label="评论内容" prop="content">
        <el-input
          v-model="form.content"
          type="textarea"
          :rows="6"
          placeholder="请输入评论内容（支持 Markdown 语法）"
          maxlength="1000"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          保存
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-textarea__inner) {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}
</style>
