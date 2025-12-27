<script setup lang="ts">
import type { PostCategory } from "@/api/post/type";
import { Edit, Delete } from "@element-plus/icons-vue";
import { ref, nextTick, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  updateCategory,
  deleteCategory,
  createCategory
} from "@/api/post";
import AnDialog from "@/components/AnDialog/index.vue";

const props = defineProps<{
  modelValue: boolean;
  categoryOptions: PostCategory[];
}>();

const emit = defineEmits(["update:modelValue", "refresh-categories"]);

// 弹窗可见性
const isVisible = ref(props.modelValue);

// 同步外部modelValue到内部isVisible
watch(
  () => props.modelValue,
  val => {
    isVisible.value = val;
  }
);

// 同步内部isVisible到外部
watch(isVisible, val => {
  emit("update:modelValue", val);
});

// 新分类表单
const newCategoryForm = ref({
  name: "",
  is_series: false
});
const isCreating = ref(false);

// 编辑状态
const editingCategoryId = ref<string | null>(null);
const editingCategoryName = ref("");
const loadingStates = ref<Record<string, boolean>>({});

// 判断分类名是否已存在
const isCategoryNameExists = (name: string) => {
  return props.categoryOptions?.some(
    cat => cat.name.toLowerCase() === name.toLowerCase()
  );
};

// 开始编辑分类名称
const handleEditCategory = (category: PostCategory) => {
  editingCategoryId.value = category.id;
  editingCategoryName.value = category.name;
  nextTick(() => {
    const inputEl = document.querySelector(
      `#category-edit-input-${category.id} input`
    );
    if (inputEl) {
      (inputEl as HTMLElement).focus();
    }
  });
};

// 取消编辑
const cancelEdit = () => {
  editingCategoryId.value = null;
  editingCategoryName.value = "";
};

// 提交名称更新
const handleUpdateCategoryName = async (category: PostCategory) => {
  if (
    !editingCategoryName.value.trim() ||
    editingCategoryName.value.trim() === category.name
  ) {
    cancelEdit();
    return;
  }
  loadingStates.value[category.id] = true;
  try {
    await updateCategory(category.id, { name: editingCategoryName.value });
    ElMessage.success("分类名称更新成功");
    emit("refresh-categories");
    cancelEdit();
  } catch (error: any) {
    ElMessage.error(error.message || "更新失败");
  } finally {
    loadingStates.value[category.id] = false;
  }
};

// 切换分类类型
const toggleCategoryType = async (category: PostCategory) => {
  const newIsSeries = !category.is_series;
  const action = newIsSeries ? "设置为系列" : "设置为普通分类";
  try {
    await ElMessageBox.confirm(
      `确定要将分类 "${category.name}" ${action}吗？`,
      "确认操作",
      {
        type: "warning"
      }
    );
    loadingStates.value[category.id] = true;
    await updateCategory(category.id, { is_series: newIsSeries });
    ElMessage.success(`${action}成功`);
    emit("refresh-categories");
  } catch (error: any) {
    if (error !== "cancel") ElMessage.error(error.message || "操作失败");
  } finally {
    loadingStates.value[category.id] = false;
  }
};

// 删除分类
const handleDeleteCategory = async (category: PostCategory) => {
  const message =
    category.count > 0
      ? `此操作将删除分类 "${category.name}"，其下的 ${category.count} 篇文章将不再属于该分类。是否继续？`
      : `确定要删除分类 "${category.name}" 吗？此操作不可恢复。`;

  try {
    await ElMessageBox.confirm(message, "警告", {
      type: "warning",
      confirmButtonText: "确认删除"
    });
    loadingStates.value[category.id] = true;
    await deleteCategory(category.id);
    ElMessage.success("删除成功");
    emit("refresh-categories");
  } catch (error: any) {
    if (error !== "cancel") ElMessage.error(error.message || "删除失败");
  } finally {
    loadingStates.value[category.id] = false;
  }
};

// 创建新分类
const handleCreateCategory = async () => {
  const name = newCategoryForm.value.name.trim();
  if (!name) {
    ElMessage.warning("分类名称不能为空");
    return;
  }
  if (isCategoryNameExists(name)) {
    ElMessage.error(`分类 "${name}" 已存在`);
    return;
  }
  isCreating.value = true;
  try {
    await createCategory({ name, is_series: newCategoryForm.value.is_series });
    ElMessage.success("创建成功");
    newCategoryForm.value.name = "";
    newCategoryForm.value.is_series = false;
    emit("refresh-categories");
  } catch (error: any) {
    ElMessage.error(error.message || "创建失败");
  } finally {
    isCreating.value = false;
  }
};
</script>

<template>
  <AnDialog v-model="isVisible" title="管理分类" width="720px">
    <div class="category-manager-body">
      <div class="create-category-form">
        <el-input
          v-model="newCategoryForm.name"
          placeholder="输入新分类名称"
        />
        <el-switch
          v-model="newCategoryForm.is_series"
          active-text="设为系列"
          style="width: 250px; margin: 0 20px"
        />
        <el-button
          type="primary"
          :loading="isCreating"
          @click="handleCreateCategory"
        >
          添加分类
        </el-button>
      </div>

      <el-table
        v-loading="!categoryOptions"
        :data="categoryOptions"
        :style="{ width: '100%' }"
        height="350px"
      >
        <el-table-column prop="name" label="分类名称" min-width="150">
          <template #default="scope">
            <div v-if="editingCategoryId === scope.row.id" class="edit-cell">
              <el-input
                :id="`category-edit-input-${scope.row.id}`"
                v-model="editingCategoryName"
                size="small"
                @blur="handleUpdateCategoryName(scope.row)"
                @keydown.enter="handleUpdateCategoryName(scope.row)"
              />
            </div>
            <span v-else>{{ scope.row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="count"
          label="文章数"
          width="90"
          align="center"
        />
        <el-table-column label="类型" width="100" align="center">
          <template #default="scope">
            <el-tag
              :type="scope.row.is_series ? 'success' : 'info'"
              size="small"
              effect="light"
            >
              {{ scope.row.is_series ? "系列" : "普通" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center">
          <template #default="scope">
            <div v-loading="loadingStates[scope.row.id]">
              <el-button-group>
                <el-tooltip
                  :show-arrow="false"
                  content="编辑名称"
                  placement="top"
                >
                  <el-button
                    :icon="Edit"
                    type="primary"
                    link
                    @click="handleEditCategory(scope.row)"
                  />
                </el-tooltip>
                <el-button
                  type="primary"
                  style="margin: 0 4px"
                  link
                  @click="toggleCategoryType(scope.row)"
                >
                  {{ scope.row.is_series ? "转为普通" : "转为系列" }}
                </el-button>
                <el-tooltip
                  content="删除分类"
                  placement="top"
                  :show-arrow="false"
                >
                  <el-button
                    :icon="Delete"
                    type="danger"
                    link
                    @click="handleDeleteCategory(scope.row)"
                  />
                </el-tooltip>
              </el-button-group>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <template #footer>
      <el-button @click="isVisible = false">关闭</el-button>
    </template>
  </AnDialog>
</template>

<style lang="scss" scoped>
.category-manager-body {
  .create-category-form {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    gap: 12px;

    .el-input {
      flex: 1;
    }
  }

  .edit-cell {
    display: flex;
    align-items: center;
  }
}
</style>

