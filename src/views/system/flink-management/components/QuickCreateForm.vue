<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`新建${entityName}`"
    width="500px"
    append-to-body
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData[entityType]"
      :rules="formRules"
      label-width="110px"
    >
      <template v-if="entityType === 'category'">
        <el-form-item label="分类名称" prop="name">
          <el-input
            v-model="formData.category.name"
            placeholder="请输入分类名称"
          />
        </el-form-item>
        <el-form-item label="样式" prop="style">
          <el-select
            v-model="formData.category.style"
            placeholder="请选择样式"
            style="width: 100%"
          >
            <el-option label="卡片 (card)" value="card" />
            <el-option label="列表 (list)" value="list" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.category.description"
            type="textarea"
            placeholder="请输入描述"
          />
        </el-form-item>
      </template>

      <template v-if="entityType === 'tag'">
        <el-form-item label="标签名称" prop="name">
          <el-input v-model="formData.tag.name" placeholder="请输入标签名称" />
        </el-form-item>
        <el-form-item label="颜色" prop="color">
          <el-color-picker v-model="formData.tag.color" />
        </el-form-item>
      </template>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确认创建
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, reactive, computed } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import { createLinkCategory, createLinkTag } from "@/api/postLink";
import type {
  CreateCategoryRequest,
  CreateTagRequest
} from "@/api/postLink/type";

const props = defineProps<{
  modelValue: boolean;
  entityType: "category" | "tag";
}>();
const emit = defineEmits(["update:modelValue", "success"]);

const dialogVisible = ref(props.modelValue);
const loading = ref(false);
const formRef = ref<FormInstance>();

const entityName = computed(() =>
  props.entityType === "category" ? "分类" : "标签"
);

const getInitialFormData = () => ({
  category: {
    name: "",
    style: "card",
    description: ""
  } as CreateCategoryRequest,
  tag: {
    name: "",
    color: "#409EFF"
  } as CreateTagRequest
});

const formData = ref(getInitialFormData());

const formRules = reactive<FormRules>({
  name: [{ required: true, message: "名称不能为空", trigger: "blur" }],
  style: [{ required: true, message: "样式不能为空", trigger: "change" }]
});

watch(
  () => props.modelValue,
  val => {
    dialogVisible.value = val;
    if (val) {
      formData.value = getInitialFormData();
    }
  }
);

const handleClose = () => {
  emit("update:modelValue", false);
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async valid => {
    if (valid) {
      loading.value = true;
      try {
        const dataToSubmit = formData.value[props.entityType];

        const res =
          props.entityType === "category"
            ? await createLinkCategory(dataToSubmit as CreateCategoryRequest)
            : await createLinkTag(dataToSubmit as CreateTagRequest);

        if (res.code === 200 || res.code === 201) {
          ElMessage.success(`${entityName.value}创建成功`);
          emit("success", res.data);
          dialogVisible.value = false;
        }
      } catch (e: any) {
        console.error(e);
        // 显示更友好的错误消息
        let errorMessage = `创建${entityName.value}失败`;
        if (e.response?.data?.message) {
          errorMessage = e.response.data.message;
        } else if (e.message) {
          errorMessage = e.message;
        }
        loading.value = false;
        ElMessage.error(errorMessage);
      } finally {
        loading.value = false;
      }
    }
  });
};
</script>
