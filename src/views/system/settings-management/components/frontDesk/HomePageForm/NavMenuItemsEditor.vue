<template>
  <el-dialog
    v-model="isDialogVisible"
    title="编辑页眉下拉菜单链接"
    width="800"
    append-to-body
    :close-on-click-modal="false"
    destroy-on-close
  >
    <el-table :data="localItems" border height="400px">
      <el-table-column label="名称" prop="name" width="180">
        <template #default="{ row }">
          <el-input v-model="row.name" placeholder="链接名称" />
        </template>
      </el-table-column>

      <el-table-column label="链接" prop="link" min-width="220">
        <template #default="{ row }">
          <el-input v-model="row.link" placeholder="https://example.com" />
        </template>
      </el-table-column>

      <el-table-column label="图标 URL" prop="icon" min-width="220">
        <template #default="{ row }">
          <el-input v-model="row.icon" placeholder="https://.../icon.png" />
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
        添加链接项
      </el-button>
      <div v-if="isLastItemIncomplete" class="validation-error">
        请先填写完当前项的“名称”和“链接”再添加新项。
      </div>
      <div v-else-if="isMaxItemsReached" class="validation-error">
        最多只能添加 5 个链接项。
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
import type { NavMenuItem } from "../../../type";

const props = defineProps<{
  items: NavMenuItem[];
  visible: boolean;
}>();

const emit = defineEmits(["update:items", "update:visible"]);

const isDialogVisible = computed({
  get: () => props.visible,
  set: val => emit("update:visible", val)
});

const localItems = ref<NavMenuItem[]>([]);

watch(
  () => props.items,
  newItems => {
    localItems.value = JSON.parse(JSON.stringify(newItems || []));
  },
  { immediate: true, deep: true }
);

const isMaxItemsReached = computed(() => localItems.value.length >= 5);
const isLastItemIncomplete = computed(() => {
  if (localItems.value.length === 0) return false;
  const lastItem = localItems.value[localItems.value.length - 1];
  return !lastItem.name || !lastItem.link;
});

const handleAddItem = () => {
  if (isMaxItemsReached.value) {
    ElMessage.warning("最多只能添加 5 个链接项。");
    return;
  }
  if (isLastItemIncomplete.value) {
    ElMessage.warning("请先填写完当前项的“名称”和“链接”。");
    return;
  }
  localItems.value.push({ name: "", link: "", icon: "" });
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
  position: absolute;
  bottom: 0;
  left: 0;
  padding-top: 4px;
  font-size: 12px;
  line-height: 1;
  color: var(--anzhiyu-red);
}
</style>
