<template>
  <el-drawer
    v-model="drawerVisible"
    :title="isEditMode ? '编辑友链' : '新建友链'"
    direction="rtl"
    size="500px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-position="top"
    >
      <el-form-item label="网站名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入网站名称" />
      </el-form-item>
      <el-form-item label="网站地址" prop="url">
        <el-input v-model="formData.url" placeholder="请输入 https://..." />
      </el-form-item>
      <el-form-item label="网站LOGO" prop="logo">
        <el-input v-model="formData.logo" placeholder="请输入 LOGO 链接" />
      </el-form-item>
      <el-form-item label="网站描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          placeholder="请输入网站描述"
        />
      </el-form-item>

      <!-- 带有“即时新增”功能的分类选择器 -->
      <el-form-item label="分类" prop="category_id">
        <div class="quick-add-select">
          <el-select
            v-model="formData.category_id"
            placeholder="请选择分类"
            class="select-main"
            filterable
            :loading="categoryLoading"
          >
            <el-option
              v-for="item in allCategories"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
          <el-button
            :icon="Plus"
            circle
            title="新建分类"
            @click="isCategoryCreatorVisible = true"
          />
        </div>
      </el-form-item>

      <!-- 带有“即时新增”功能的标签选择器 -->
      <el-form-item label="标签" prop="tag_ids">
        <div class="quick-add-select">
          <el-select
            v-model="formData.tag_ids"
            multiple
            filterable
            placeholder="请选择标签"
            class="select-main"
            :loading="tagLoading"
          >
            <el-option
              v-for="item in allTags"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
          <el-button
            :icon="Plus"
            circle
            title="新建标签"
            @click="isTagCreatorVisible = true"
          />
        </div>
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-select
          v-model="formData.status"
          placeholder="请选择状态"
          style="width: 100%"
        >
          <el-option label="审核通过" value="APPROVED" />
          <el-option label="待审核" value="PENDING" />
          <el-option label="已拒绝" value="REJECTED" />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <div style="flex: auto">
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="submitLoading"
          @click="handleSubmit"
        >
          确认
        </el-button>
      </div>
    </template>

    <!-- “即时新增”弹窗组件实例 -->
    <QuickCreateForm
      v-model="isCategoryCreatorVisible"
      entity-type="category"
      @success="handleCategoryCreated"
    />
    <QuickCreateForm
      v-model="isTagCreatorVisible"
      entity-type="tag"
      @success="handleTagCreated"
    />
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, watch, reactive, onMounted } from "vue";
import { Plus } from "@element-plus/icons-vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import type {
  LinkItem,
  LinkCategory,
  LinkTag,
  CreateLinkRequest
} from "@/api/postLink/type";
import {
  getLinkCategories,
  getLinkTags,
  createLink,
  updateLink
} from "@/api/postLink";
import QuickCreateForm from "./QuickCreateForm.vue";

const props = defineProps<{
  modelValue: boolean;
  isEditMode: boolean;
  data: LinkItem | null;
}>();
const emit = defineEmits(["update:modelValue", "success"]);

const drawerVisible = ref(props.modelValue);
const submitLoading = ref(false);
const formRef = ref<FormInstance>();

// 数据源
const allCategories = ref<LinkCategory[]>([]);
const allTags = ref<LinkTag[]>([]);
const categoryLoading = ref(false);
const tagLoading = ref(false);

// “即时新增”弹窗的显示状态
const isCategoryCreatorVisible = ref(false);
const isTagCreatorVisible = ref(false);

// 表单数据
const initialFormData: CreateLinkRequest = {
  name: "",
  url: "",
  logo: "",
  description: "",
  siteshot: "",
  category_id: null,
  tag_ids: [],
  status: "PENDING"
};
const formData = ref<CreateLinkRequest>({ ...initialFormData });

const formRules = reactive<FormRules>({
  name: [{ required: true, message: "请输入网站名称", trigger: "blur" }],
  url: [{ required: true, message: "请输入网站地址", trigger: "blur" }],
  logo: [{ required: true, message: "请输入网站LOGO", trigger: "blur" }],
  category_id: [
    { required: true, message: "请选择或新建一个分类", trigger: "change" }
  ],
  status: [{ required: true, message: "请选择状态", trigger: "change" }]
});

// --- 数据获取 ---
const fetchCategories = async () => {
  categoryLoading.value = true;
  try {
    const res = await getLinkCategories();
    if (res.code === 200) allCategories.value = res.data;
  } catch (e) {
    console.error("获取分类列表失败", e);
  } finally {
    categoryLoading.value = false;
  }
};
const fetchTags = async () => {
  tagLoading.value = true;
  try {
    const res = await getLinkTags();
    if (res.code === 200) allTags.value = res.data;
  } catch (e) {
    console.error("获取标签列表失败", e);
  } finally {
    tagLoading.value = false;
  }
};

// --- “即时新增”成功后的回调处理 ---
const handleCategoryCreated = async (newCategory: LinkCategory) => {
  await fetchCategories();
  formData.value.category_id = newCategory.id;
};

const handleTagCreated = async (newTag: LinkTag) => {
  await fetchTags();
  if (!Array.isArray(formData.value.tag_ids)) {
    formData.value.tag_ids = [];
  }
  formData.value.tag_ids.push(newTag.id);
};

// --- 抽屉与表单控制 ---
watch(
  () => props.modelValue,
  val => {
    drawerVisible.value = val;
    if (val) {
      if (props.isEditMode && props.data) {
        formData.value = {
          name: props.data.name,
          url: props.data.url,
          logo: props.data.logo,
          description: props.data.description,
          siteshot: props.data.siteshot,
          category_id: props.data.category?.id || null,
          tag_ids: props.data.tags?.map(t => t.id) || [],
          status: props.data.status
        };
      } else {
        formData.value = { ...initialFormData };
      }
    }
  }
);

const handleClose = () => {
  formRef.value?.resetFields();
  emit("update:modelValue", false);
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async valid => {
    if (valid) {
      submitLoading.value = true;
      try {
        if (props.isEditMode) {
          await updateLink(props.data.id, formData.value);
          ElMessage.success("更新成功");
        } else {
          await createLink(formData.value);
          ElMessage.success("创建成功");
        }
        emit("success");
        drawerVisible.value = false;
      } catch (error) {
        console.error("操作失败", error);
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

onMounted(() => {
  fetchCategories();
  fetchTags();
});
</script>

<style lang="scss" scoped>
.quick-add-select {
  display: flex;
  align-items: center;
  width: 100%;

  .select-main {
    flex-grow: 1;
    margin-right: 10px;
  }
}
</style>
