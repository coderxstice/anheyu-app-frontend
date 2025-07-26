<template>
  <div class="json-editor-table">
    <el-divider content-position="left">{{ title }}</el-divider>
    <el-table :data="tableData" border style="width: 100%">
      <!-- 动态生成列 -->
      <el-table-column
        v-for="col in columns"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        min-width="150"
      >
        <template #default="scope">
          <el-input
            v-model="scope.row[col.prop]"
            :placeholder="`请输入 ${col.label}`"
          />
        </template>
      </el-table-column>

      <!-- 操作列 -->
      <el-table-column label="操作" width="90" fixed="right">
        <template #default="scope">
          <el-button
            type="danger"
            :icon="Delete"
            circle
            @click="handleDeleteItem(scope.$index)"
          />
        </template>
      </el-table-column>
    </el-table>
    <el-button
      class="mt-4"
      style="width: 100%"
      :disabled="isLastRowIncomplete"
      @click="handleAddItem"
    >
      添加一项
    </el-button>
    <div v-if="isLastRowIncomplete" class="el-form-item__error custom-error">
      请填写完当前项再添加新项
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, toRaw, computed } from "vue";
import { Delete } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

// 定义列的类型
interface Column {
  prop: string;
  label: string;
}

const props = defineProps<{
  modelValue: string; // 接收 v-model 的值，必须是 JSON 字符串
  title: string;
  columns: Column[];
  newItemTemplate: Record<string, any>; // 添加新项目时使用的模板
}>();

// [已修改] 增加自定义事件，用于同步删除
const emit = defineEmits(["update:modelValue", "item-deleted"]);

const tableData = ref<any[]>([]);

// [新功能] 计算属性，判断最后一行是否未填写完整
const isLastRowIncomplete = computed(() => {
  if (tableData.value.length === 0) {
    return false; // 如果表格为空，允许添加第一行
  }
  const lastItem = tableData.value[tableData.value.length - 1];
  // 检查模板中的所有键，如果任意一个对应的值是空字符串或null，则认为未完成
  return Object.keys(props.newItemTemplate).some(
    key =>
      lastItem[key] === "" ||
      lastItem[key] === null ||
      lastItem[key] === undefined
  );
});

// 监视来自父组件的 modelValue 变化，并更新表格数据
watch(
  () => props.modelValue,
  newVal => {
    try {
      const parsedData = JSON.parse(newVal || "[]");
      // 避免不必要的更新和循环，防止光标跳动
      if (
        JSON.stringify(toRaw(tableData.value)) !== JSON.stringify(parsedData)
      ) {
        tableData.value = parsedData;
      }
    } catch (e) {
      console.error(`"${props.title}" 的JSON解析失败:`, newVal, e);
      // 解析失败时清空表格，防止UI错误
      tableData.value = [];
    }
  },
  { immediate: true }
);

// 监视表格数据的变化，并通知父组件
watch(
  tableData,
  newVal => {
    // 使用 null, 2 参数美化输出的JSON字符串
    emit("update:modelValue", JSON.stringify(newVal, null, 2));
  },
  { deep: true }
);

const handleAddItem = () => {
  // 双重保险，虽然按钮已禁用，但直接调用时也进行检查
  if (isLastRowIncomplete.value) {
    ElMessage.warning("请先填写完当前行的数据！");
    return;
  }
  tableData.value.push({ ...props.newItemTemplate });
};

const handleDeleteItem = (index: number) => {
  tableData.value.splice(index, 1);
  emit("item-deleted", index);
};
</script>

<style scoped>
.json-editor-table {
  margin-bottom: 24px;
}
.mt-4 {
  margin-top: 1rem;
}
.custom-error {
  color: var(--el-color-danger);
  font-size: 12px;
  line-height: 1;
  padding-top: 4px;
  position: relative;
}
</style>
