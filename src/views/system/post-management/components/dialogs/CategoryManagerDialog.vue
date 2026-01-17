<script setup lang="ts">
import type { PostCategory } from "@/api/post/type";
import { Edit, Delete, Plus } from "@element-plus/icons-vue";
import { ref, nextTick, watch, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { updateCategory, deleteCategory, createCategory } from "@/api/post";
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

// 统计数据
const stats = computed(() => {
  const total = props.categoryOptions?.length || 0;
  const series = props.categoryOptions?.filter(c => c.is_series).length || 0;
  const regular = total - series;
  return { total, series, regular };
});

// 新分类表单
const newCategoryForm = ref({
  name: "",
  is_series: false,
  sort_order: 0
});
const isCreating = ref(false);

// 编辑状态
const editingCategoryId = ref<string | null>(null);
const editingCategoryName = ref("");
const loadingStates = ref<Record<string, boolean>>({});

// 本地排序值状态（避免编辑时跳动）
const localSortOrders = ref<Record<string, number>>({});

// 初始化/同步本地排序值
watch(
  () => props.categoryOptions,
  categories => {
    if (categories) {
      categories.forEach(cat => {
        // 只在没有本地值时初始化
        if (localSortOrders.value[cat.id] === undefined) {
          localSortOrders.value[cat.id] = cat.sort_order;
        }
      });
    }
  },
  { immediate: true, deep: true }
);

// 获取显示的排序值
const getDisplaySortOrder = (category: PostCategory) => {
  return localSortOrders.value[category.id] ?? category.sort_order;
};

// 更新本地排序值
const updateLocalSortOrder = (category: PostCategory, value: number | null) => {
  localSortOrders.value[category.id] = value ?? 0;
};

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

// 提交排序值更新（blur时触发）
const handleSubmitSortOrder = async (category: PostCategory) => {
  const newSortOrder = localSortOrders.value[category.id];
  // 值没有变化，不提交
  if (newSortOrder === category.sort_order) {
    return;
  }
  loadingStates.value[category.id] = true;
  try {
    await updateCategory(category.id, { sort_order: newSortOrder });
    ElMessage.success("排序更新成功");
    emit("refresh-categories");
  } catch (error: any) {
    // 更新失败，恢复原值
    localSortOrders.value[category.id] = category.sort_order;
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
      { type: "warning" }
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
    await createCategory({
      name,
      is_series: newCategoryForm.value.is_series,
      sort_order: newCategoryForm.value.sort_order
    });
    ElMessage.success("创建成功");
    newCategoryForm.value.name = "";
    newCategoryForm.value.is_series = false;
    newCategoryForm.value.sort_order = 0;
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
    <div class="category-manager">
      <!-- 统计信息 -->
      <div class="stats-bar">
        <span class="stat-item">
          <span class="stat-label">总计</span>
          <span class="stat-value">{{ stats.total }}</span>
        </span>
        <span class="stat-divider" />
        <span class="stat-item">
          <span class="stat-label">系列</span>
          <span class="stat-value success">{{ stats.series }}</span>
        </span>
        <span class="stat-divider" />
        <span class="stat-item">
          <span class="stat-label">普通</span>
          <span class="stat-value">{{ stats.regular }}</span>
        </span>
      </div>

      <!-- 添加分类 -->
      <div class="add-section">
        <el-input
          v-model="newCategoryForm.name"
          placeholder="输入新分类名称"
          clearable
          @keydown.enter="handleCreateCategory"
        />
        <el-tooltip content="排序值，越小越靠前" placement="top">
          <el-input-number
            v-model="newCategoryForm.sort_order"
            :min="0"
            :step="1"
            controls-position="right"
            class="sort-input"
          />
        </el-tooltip>
        <el-checkbox v-model="newCategoryForm.is_series">系列</el-checkbox>
        <el-button
          type="primary"
          :icon="Plus"
          :loading="isCreating"
          @click="handleCreateCategory"
        >
          添加
        </el-button>
      </div>

      <!-- 分类列表 -->
      <div class="list-section">
        <el-table
          v-loading="!categoryOptions"
          :data="categoryOptions"
          :show-header="true"
          height="320px"
        >
          <el-table-column prop="name" label="名称" min-width="140">
            <template #default="{ row }">
              <div v-if="editingCategoryId === row.id" class="edit-name">
                <el-input
                  :id="`category-edit-input-${row.id}`"
                  v-model="editingCategoryName"
                  size="small"
                  @blur="handleUpdateCategoryName(row)"
                  @keydown.enter="handleUpdateCategoryName(row)"
                  @keydown.escape="cancelEdit"
                />
              </div>
              <div v-else class="name-cell">
                <span>{{ row.name }}</span>
                <el-tag
                  v-if="row.is_series"
                  type="success"
                  size="small"
                  effect="plain"
                >
                  系列
                </el-tag>
              </div>
            </template>
          </el-table-column>

          <el-table-column
            prop="sort_order"
            label="排序"
            width="90"
            align="center"
            sortable
          >
            <template #default="{ row }">
              <el-input-number
                :model-value="getDisplaySortOrder(row)"
                :min="0"
                :step="1"
                size="small"
                :controls="false"
                class="sort-input-small"
                @update:model-value="val => updateLocalSortOrder(row, val)"
                @blur="handleSubmitSortOrder(row)"
                @keydown.enter="($event.target as HTMLInputElement)?.blur()"
              />
            </template>
          </el-table-column>

          <el-table-column prop="count" label="文章" width="70" align="center">
            <template #default="{ row }">
              <span class="count-badge">{{ row.count }}</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="200" align="center">
            <template #default="{ row }">
              <div v-loading="loadingStates[row.id]" class="action-buttons">
                <el-button
                  size="small"
                  :icon="Edit"
                  @click="handleEditCategory(row)"
                >
                  编辑
                </el-button>
                <el-button
                  size="small"
                  type="warning"
                  plain
                  @click="toggleCategoryType(row)"
                >
                  {{ row.is_series ? "转普通" : "转系列" }}
                </el-button>
                <el-button
                  size="small"
                  type="danger"
                  plain
                  :icon="Delete"
                  @click="handleDeleteCategory(row)"
                />
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <template #footer>
      <el-button @click="isVisible = false">关闭</el-button>
    </template>
  </AnDialog>
</template>

<style lang="scss" scoped>
.category-manager {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-radius: 6px;

  .stat-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .stat-label {
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }

  .stat-value {
    font-weight: 600;
    font-size: 15px;
    color: var(--el-text-color-primary);

    &.success {
      color: var(--el-color-success);
    }
  }

  .stat-divider {
    width: 1px;
    height: 16px;
    background: var(--el-border-color);
  }
}

.add-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;

  .el-input {
    flex: 1;
  }

  .sort-input {
    width: 100px;
  }
}

.list-section {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  overflow: hidden;

  :deep(.el-table) {
    --el-table-border-color: var(--el-border-color-lighter);
  }
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.edit-name {
  .el-input {
    width: 100%;
  }
}

.sort-input-small {
  width: 60px;

  :deep(.el-input__inner) {
    text-align: center;
  }
}

.count-badge {
  display: inline-block;
  min-width: 24px;
  padding: 2px 6px;
  font-size: 12px;
  text-align: center;
  background: var(--el-fill-color);
  border-radius: 10px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 4px;
}
</style>
