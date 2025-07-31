<template>
  <el-dialog
    v-model="isDialogVisible"
    title="编辑子菜单项"
    width="800"
    append-to-body
    :close-on-click-modal="false"
    destroy-on-close
  >
    <el-table :data="localItems" border height="400px">
      <el-table-column label="标题" prop="title" width="150">
        <template #default="{ row }">
          <el-input v-model="row.title" placeholder="菜单标题" />
        </template>
      </el-table-column>

      <el-table-column label="路径" prop="path" min-width="180">
        <template #default="{ row }">
          <el-input v-model="row.path" placeholder="/posts/或 https://" />
        </template>
      </el-table-column>

      <el-table-column label="图标" prop="icon" width="160">
        <template #default="{ row }">
          <el-input v-model="row.icon" placeholder="例如：anzhiyu-icon-tag" />
        </template>
      </el-table-column>

      <el-table-column
        label="新窗口打开"
        prop="isExternal"
        width="110"
        align="center"
      >
        <template #default="{ row }">
          <el-switch v-model="row.isExternal" />
        </template>
      </el-table-column>

      <el-table-column label="操作" width="80" align="center">
        <template #default="{ $index }">
          <el-button
            type="danger"
            :icon="Delete"
            circle
            @click="handleDeleteItem($index)"
          />
        </template>
      </el-table-column>
    </el-table>

    <div class="add-button-container">
      <el-button
        class="mt-4"
        style="width: 100%"
        :disabled="isLastItemIncomplete || isMaxItemsReached"
        @click="handleAddItem"
      >
        <el-icon><Plus /></el-icon>
        添加子菜单项
      </el-button>
      <div v-if="isLastItemIncomplete" class="validation-error">
        请先填写完当前项的“标题”、“路径”和“图标”再添加新项。
      </div>
      <div v-else-if="isMaxItemsReached" class="validation-error">
        最多只能添加 5 个子菜单项。
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取 消</el-button>
        <el-button type="primary" @click="handleConfirm">确 定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { Delete, Plus } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import type { SubMenuItem } from "../../type";

const props = defineProps<{
  items: SubMenuItem[];
  visible: boolean;
}>();

const emit = defineEmits(["update:items", "update:visible"]);

const isDialogVisible = computed({
  get: () => props.visible,
  set: val => emit("update:visible", val)
});

const localItems = ref<SubMenuItem[]>([]);

watch(
  () => props.items,
  newItems => {
    localItems.value = JSON.parse(JSON.stringify(newItems || []));
  },
  {
    immediate: true,
    deep: true
  }
);

// [新增] 计算属性：判断是否达到最大数量
const isMaxItemsReached = computed(() => localItems.value.length >= 5);

// [新增] 计算属性：判断最后一条是否未填写完整
const isLastItemIncomplete = computed(() => {
  if (localItems.value.length === 0) {
    return false; // 如果没有条目，则允许添加第一条
  }
  const lastItem = localItems.value[localItems.value.length - 1];
  // 检查关键字段是否为空
  return !lastItem.title || !lastItem.path || !lastItem.icon;
});

// [修改] 增强 handleAddItem 函数
const handleAddItem = () => {
  // 添加函数内部的保护校验
  if (isMaxItemsReached.value) {
    ElMessage.warning("最多只能添加 5 个子菜单项。");
    return;
  }
  if (isLastItemIncomplete.value) {
    ElMessage.warning("请先填写完当前项再添加新项。");
    return;
  }

  localItems.value.push({
    title: "",
    path: "",
    icon: "",
    isExternal: false
  });
};

const handleDeleteItem = (index: number) => {
  localItems.value.splice(index, 1);
};

const handleConfirm = () => {
  emit("update:items", localItems.value);
  isDialogVisible.value = false;
};

const handleCancel = () => {
  isDialogVisible.value = false;
};
</script>

<style scoped>
.mt-4 {
  margin-top: 1rem;
}

.add-button-container {
  position: relative;
  padding-bottom: 20px;
}
.validation-error {
  color: var(--el-color-danger);
  font-size: 12px;
  line-height: 1;
  position: absolute;
  bottom: 0;
  left: 0;
  padding-top: 4px;
}
</style>
