<template>
  <AnDialog
    v-model="dialogVisible"
    :title="isEditMode ? '编辑友链' : '新建友链'"
    width="600px"
    :show-footer="true"
    :confirm-loading="submitLoading"
    @confirm="handleSubmit"
    @closed="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-position="top"
      class="link-form"
    >
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="网站名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入网站名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="网站地址" prop="url">
            <el-input v-model="formData.url" placeholder="请输入 https://..." />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="网站LOGO" prop="logo">
            <el-input v-model="formData.logo" placeholder="请输入 LOGO 链接" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="联系邮箱" prop="email">
            <el-input
              v-model="formData.email"
              type="email"
              placeholder="your@email.com (可选)"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="网站描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="2"
          placeholder="请输入网站描述"
        />
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="网站快照" prop="siteshot">
            <el-input
              v-model="formData.siteshot"
              placeholder="网站快照链接 (可选)"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="申请类型" prop="type">
            <el-select
              v-model="formData.type"
              placeholder="请选择申请类型（可选）"
              clearable
              style="width: 100%"
              :teleported="false"
            >
              <el-option label="新增友链" value="NEW" />
              <el-option label="修改友链" value="UPDATE" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <template v-if="formData.type === 'UPDATE'">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="原友链URL" prop="original_url">
              <el-input
                v-model="formData.original_url"
                placeholder="https://old-blog.example.com/"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="修改原因" prop="update_reason">
              <el-input
                v-model="formData.update_reason"
                placeholder="说明修改原因"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </template>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="分类" prop="category_id">
            <div class="modern-selector">
              <el-select
                v-model="formData.category_id"
                placeholder="请选择分类"
                class="selector-main"
                :loading="categoryLoading"
                :teleported="false"
              >
                <el-option
                  v-for="item in allCategories"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                >
                  <div class="category-option">
                    <span class="category-name">{{ item.name }}</span>
                    <el-tag
                      size="small"
                      :type="item.style === 'card' ? 'primary' : 'success'"
                    >
                      {{ item.style === "card" ? "卡片" : "列表" }}
                    </el-tag>
                  </div>
                </el-option>
              </el-select>
              <el-button
                :icon="Plus"
                circle
                size="small"
                title="快速新建分类"
                @click="isCategoryCreatorVisible = true"
              />
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="标签" prop="tag_id">
            <div class="modern-selector">
              <el-select
                v-model="formData.tag_id"
                clearable
                placeholder="请选择标签（可选）"
                class="selector-main"
                :loading="tagLoading"
                :teleported="false"
              >
                <el-option
                  v-for="item in allTags"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                >
                  <div class="tag-option">
                    <span
                      class="option-tag"
                      :style="{ background: item.color }"
                    >
                      {{ item.name }}
                    </span>
                  </div>
                </el-option>
              </el-select>
              <el-button
                :icon="Plus"
                circle
                size="small"
                title="快速新建标签"
                @click="isTagCreatorVisible = true"
              />
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="状态" prop="status">
            <el-select
              v-model="formData.status"
              placeholder="请选择状态"
              style="width: 100%"
              :teleported="false"
            >
              <el-option label="审核通过" value="APPROVED" />
              <el-option label="待审核" value="PENDING" />
              <el-option label="已拒绝" value="REJECTED" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="排序权重" prop="sort_order">
            <el-input-number
              v-model="formData.sort_order"
              :min="0"
              :step="1"
              placeholder="数字越大越靠前"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="跳过健康检查" prop="skip_health_check">
            <el-switch
              v-model="formData.skip_health_check"
              active-text="是"
              inactive-text="否"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <!-- "即时新增"弹窗组件实例 -->
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
  </AnDialog>
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
import AnDialog from "@/components/AnDialog/index.vue";
import QuickCreateForm from "./QuickCreateForm.vue";

const props = defineProps<{
  modelValue: boolean;
  isEditMode: boolean;
  data: LinkItem | null;
}>();
const emit = defineEmits(["update:modelValue", "success"]);

const dialogVisible = ref(props.modelValue);
const submitLoading = ref(false);
const formRef = ref<FormInstance>();

// 数据源
const allCategories = ref<LinkCategory[]>([]);
const allTags = ref<LinkTag[]>([]);
const categoryLoading = ref(false);
const tagLoading = ref(false);

// "即时新增"弹窗的显示状态
const isCategoryCreatorVisible = ref(false);
const isTagCreatorVisible = ref(false);

// 表单数据
const initialFormData: CreateLinkRequest = {
  name: "",
  url: "",
  logo: "",
  description: "",
  siteshot: "",
  email: "",
  type: undefined,
  original_url: "",
  update_reason: "",
  category_id: null,
  tag_id: null,
  status: "PENDING",
  sort_order: 0,
  skip_health_check: false
};
const formData = ref<CreateLinkRequest>({ ...initialFormData });

const formRules = reactive<FormRules>({
  name: [{ required: true, message: "请输入网站名称", trigger: "blur" }],
  url: [{ required: true, message: "请输入网站地址", trigger: "blur" }],
  logo: [{ required: true, message: "请输入网站LOGO", trigger: "blur" }],
  siteshot: [
    {
      type: "url",
      message: "请输入有效的网站快照链接",
      trigger: ["blur", "change"]
    }
  ],
  email: [
    {
      type: "email",
      message: "请输入有效的邮箱地址",
      trigger: ["blur", "change"]
    }
  ],
  original_url: [
    {
      type: "url",
      message: "请输入有效的原友链URL",
      trigger: ["blur", "change"]
    }
  ],
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

// --- "即时新增"成功后的回调处理 ---
const handleCategoryCreated = async (newCategory: LinkCategory) => {
  await fetchCategories();
  formData.value.category_id = newCategory.id;
};

const handleTagCreated = async (newTag: LinkTag) => {
  await fetchTags();
  formData.value.tag_id = newTag.id;
};

// --- 对话框与表单控制 ---
watch(
  () => props.modelValue,
  val => {
    dialogVisible.value = val;
    if (val) {
      if (props.isEditMode && props.data) {
        formData.value = {
          name: props.data.name,
          url: props.data.url,
          logo: props.data.logo,
          description: props.data.description,
          siteshot: props.data.siteshot,
          email: props.data.email || "",
          type: props.data.type || undefined,
          original_url: props.data.original_url || "",
          update_reason: props.data.update_reason || "",
          category_id: props.data.category?.id || null,
          tag_id: props.data.tag?.id || null,
          status: props.data.status,
          sort_order: props.data.sort_order || 0,
          skip_health_check: props.data.skip_health_check || false
        };
      } else {
        formData.value = { ...initialFormData };
      }
    }
  }
);

watch(dialogVisible, val => {
  emit("update:modelValue", val);
});

const handleClose = () => {
  formRef.value?.resetFields();
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async valid => {
    if (valid) {
      submitLoading.value = true;
      try {
        if (props.isEditMode && props.data) {
          await updateLink(props.data.id, formData.value);
          ElMessage.success({
            message: "更新成功",
            customClass: "high-z-index-message"
          });
        } else {
          await createLink(formData.value);
          ElMessage.success({
            message: "创建成功",
            customClass: "high-z-index-message"
          });
        }
        emit("success");
        dialogVisible.value = false;
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
.link-form {
  :deep(.el-form-item) {
    margin-bottom: 18px;
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
    padding-bottom: 6px;
  }
}

.modern-selector {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;

  .selector-main {
    flex: 1;
  }
}

.category-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;

  .category-name {
    flex: 1;
  }
}

.tag-option {
  display: flex;
  align-items: center;
  height: 100%;
  min-height: 30px;

  .option-tag {
    position: relative;
    display: inline-block;
    padding: 2px 6px;
    overflow: hidden;
    font-size: 11px;
    line-height: 1.2;
    color: white !important;
    white-space: nowrap;
    cursor: pointer;
    border: none;
    border-radius: 8px 0;
    box-shadow: 0 1px 3px rgb(0 0 0 / 10%);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 8px rgb(0 0 0 / 20%);
      transform: translateY(-1px);
    }
  }
}

// 响应式适配
@media (max-width: 768px) {
  .link-form {
    :deep(.el-col) {
      max-width: 100%;
      flex: 0 0 100%;
    }
  }
}
</style>
