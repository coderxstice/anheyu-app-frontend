<template>
  <div class="footer-link-editor">
    <el-alert
      title="管理页脚的多栏链接列表。每“栏”包含一个标题和多个链接。"
      type="info"
      show-icon
      :closable="false"
      style="margin-bottom: 16px"
    />
    <div
      v-for="(column, colIndex) in listData"
      :key="colIndex"
      class="column-item"
    >
      <div class="column-header">
        <span class="column-title">第 {{ colIndex + 1 }} 栏</span>
        <el-button
          type="danger"
          :icon="Delete"
          circle
          plain
          :disabled="!canRemoveColumn"
          @click="removeColumn(colIndex)"
        />
      </div>
      <div class="column-content">
        <el-form-item label="栏目标题" required>
          <el-input v-model="column.title" placeholder="例如：服务" />
        </el-form-item>

        <el-table :data="column.links" border size="small">
          <el-table-column label="链接标题" prop="title">
            <template #default="scope">
              <el-input
                v-model="scope.row.title"
                placeholder="例如：站点地图"
              />
            </template>
          </el-table-column>
          <el-table-column label="链接地址" prop="link">
            <template #default="scope">
              <el-input v-model="scope.row.link" placeholder="例如：/sitemap" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="70" align="center">
            <template #default="scope">
              <el-button
                type="danger"
                :icon="Delete"
                circle
                size="small"
                @click="removeLink(colIndex, scope.$index)"
              />
            </template>
          </el-table-column>
        </el-table>
        <el-button class="add-link-btn" :icon="Plus" @click="addLink(colIndex)">
          添加链接
        </el-button>
      </div>
    </div>

    <el-button
      type="primary"
      style="width: 100%; margin-top: 16px"
      :disabled="!canAddColumn"
      @click="addColumn"
    >
      <el-icon><Plus /></el-icon>
      <span>添加新一栏 (最多 5 栏)</span>
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { ElMessage } from "element-plus";
import { Plus, Delete } from "@element-plus/icons-vue";

// 为数据结构定义清晰的类型
interface LinkItem {
  title: string;
  link: string;
}
interface ColumnItem {
  title: string;
  links: LinkItem[];
}

const props = defineProps<{
  modelValue: string; // 接收 v-model 的 JSON 字符串
}>();

const emit = defineEmits(["update:modelValue"]);

const listData = ref<ColumnItem[]>([]);

// 计算属性，用于控制按钮的禁用状态，实现限制
const canAddColumn = computed(() => listData.value.length < 5);
const canRemoveColumn = computed(() => listData.value.length > 1);

// 监听外部传入的 modelValue，并解析为内部使用的数据
watch(
  () => props.modelValue,
  newVal => {
    try {
      // 避免当内部更新触发外部更新时，再次解析，导致光标跳动
      if (newVal === JSON.stringify(listData.value, null, 2)) return;

      const parsedData = JSON.parse(newVal || "[]");
      if (Array.isArray(parsedData)) {
        listData.value = parsedData;
      } else {
        listData.value = [];
      }
    } catch (e) {
      console.error("页脚链接列表JSON解析失败:", e);
      listData.value = [];
    }
  },
  { immediate: true }
);

// 监听内部数据的变化，并通知父组件更新 v-model
watch(
  listData,
  newVal => {
    // 使用 a, b, 2 参数进行美化，方便阅读
    emit("update:modelValue", JSON.stringify(newVal, null, 2));
  },
  { deep: true }
);

// --- 操作方法 ---
const addColumn = () => {
  if (!canAddColumn.value) {
    ElMessage.warning("最多只能添加 5 个栏目。");
    return;
  }
  listData.value.push({ title: "", links: [{ title: "", link: "" }] });
};

const removeColumn = (index: number) => {
  if (!canRemoveColumn.value) {
    ElMessage.warning("至少需要保留 1 个栏目。");
    return;
  }
  listData.value.splice(index, 1);
};

const addLink = (columnIndex: number) => {
  listData.value[columnIndex].links.push({ title: "", link: "" });
};

const removeLink = (columnIndex: number, linkIndex: number) => {
  listData.value[columnIndex].links.splice(linkIndex, 1);
};
</script>

<style scoped lang="scss">
.footer-link-editor {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  padding: 16px;
}

.column-item {
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  margin-bottom: 16px;
  background-color: var(--el-bg-color-page);
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background-color: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-light);
}

.column-title {
  font-weight: bold;
  font-size: 14px;
}

.column-content {
  padding: 16px;
}

.add-link-btn {
  width: 100%;
  margin-top: 12px;
  border-style: dashed;
}
</style>
