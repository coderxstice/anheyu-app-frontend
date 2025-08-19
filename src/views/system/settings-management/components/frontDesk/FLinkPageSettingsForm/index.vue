<template>
  <div>
    <el-form-item label="友链默认分类">
      <el-select
        v-model="model.friendLinkDefaultCategory"
        placeholder="请选择默认分类"
        style="width: 100%"
        :loading="categoryLoading"
      >
        <el-option
          v-for="item in categories"
          :key="item.id"
          :label="item.name"
          :value="item.id.toString()"
        />
      </el-select>
    </el-form-item>

    <JsonEditorTable
      v-model="applyConditionsJsonString"
      title="申请友链条件"
      :columns="conditionColumns"
      :new-item-template="{ text: '' }"
    />

    <el-form-item label="申请友链自定义代码">
      <el-input
        v-model="model.friendLinkApplyCustomCode"
        type="textarea"
        :rows="5"
        placeholder="可在此处添加自定义 HTML/CSS/JS 代码，将显示在申请条件的上方。"
      />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { ElMessage } from "element-plus";
import type { FLinkSettingsInfo, JsonEditorTableColumn } from "../../../type";
import JsonEditorTable from "../components/JsonEditorTable.vue";
import { getLinkCategories } from "@/api/postLink";
import type { LinkCategory } from "@/api/postLink/type";

const model = defineModel<FLinkSettingsInfo>({ required: true });

const categories = ref<LinkCategory[]>([]);
const categoryLoading = ref(false);

const conditionColumns: JsonEditorTableColumn[] = [
  { prop: "text", label: "条件内容（支持HTML）" }
];

/**
 * --- 核心修正 ---
 *
 * 这个计算属性是连接 `model` (数据为 string[]) 和 `JsonEditorTable` (prop 为 string) 的桥梁。
 */
const applyConditionsJsonString = computed({
  /**
   * get: 将 model 中的 string[] 数组转换为 JsonEditorTable 需要的 JSON 字符串。
   * 1. model.value.friendLinkApplyCondition (string[]) -> object[] e.g., [{ text: "..." }]
   * 2. object[] -> JSON.stringify -> string
   */
  get() {
    if (!Array.isArray(model.value.friendLinkApplyCondition)) {
      return "[]"; // 返回一个空数组的字符串形式作为默认值
    }
    const objectArray = model.value.friendLinkApplyCondition.map(text => ({
      text
    }));
    return JSON.stringify(objectArray, null, 2);
  },
  /**
   * set: 接收 JsonEditorTable 发出的 JSON 字符串，并更新 model。
   * 1. jsonString (string) -> JSON.parse -> object[] e.g., [{ text: "..." }]
   * 2. object[] -> string[]
   * 3. 更新 model.value.friendLinkApplyCondition
   */
  set(jsonString: string) {
    try {
      const objectArray = JSON.parse(jsonString || "[]");
      model.value.friendLinkApplyCondition = objectArray.map(item => item.text);
    } catch (e) {
      console.error("解析申请友链条件JSON失败:", e);
      // 可以在这里处理无效的JSON，例如不清空数组，以防用户误操作
    }
  }
});

// 获取友链分类列表
const fetchCategories = async () => {
  categoryLoading.value = true;
  try {
    const res = await getLinkCategories();
    if (res.code === 200) {
      categories.value = res.data || [];
    } else {
      ElMessage.error("获取友链分类列表失败");
    }
  } catch (error) {
    console.error(error);
    ElMessage.error("获取友链分类列表时发生错误");
  } finally {
    categoryLoading.value = false;
  }
};

onMounted(() => {
  fetchCategories();
});
</script>
