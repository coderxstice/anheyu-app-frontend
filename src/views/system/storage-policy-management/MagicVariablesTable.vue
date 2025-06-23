<script setup lang="ts">
import { ref, computed } from "vue";

defineOptions({
  name: "MagicVariablesTable"
});

// 1. 定义 props 来接收上下文
const props = defineProps<{
  context: "path" | "filename";
}>();

const pathVariables = ref([
  {
    variable: "{randomkey16}",
    description: "16 位随机字符",
    example: "a1b2c3d4e5f6g7h8"
  },
  {
    variable: "{randomkey8}",
    description: "8 位随机字符",
    example: "a1b2c3d4"
  },
  { variable: "{timestamp}", description: "秒级时间戳", example: "1609459200" },
  {
    variable: "{timestamp_nano}",
    description: "纳秒级时间戳",
    example: "1609459200000000000"
  },
  { variable: "{uid}", description: "用户 ID", example: "1" },
  {
    variable: "{datetime}",
    description: "日期时间",
    example: "20220101120000"
  },
  { variable: "{date}", description: "日期", example: "20220101" },
  { variable: "{year}", description: "年份", example: "2022" },
  { variable: "{month}", description: "月份", example: "01" },
  { variable: "{day}", description: "日", example: "01" },
  {
    variable: "{path}",
    description: "用户上传文件时的初始路径",
    example: "/path/to/"
  }
  // ... 其他变量可以按需添加
]);

const filenameVariables = ref([
  ...pathVariables.value.filter(v => v.variable !== "{path}"),
  {
    variable: "{originname}",
    description: "原始文件名",
    example: "example.jpg"
  },
  { variable: "{ext}", description: "文件扩展名", example: ".jpg" },
  {
    variable: "{originname_without_ext}",
    description: "无扩展名的原始文件名",
    example: "example"
  },
  {
    variable: "{uuid}",
    description: "UUID V4",
    example: "550e8400-e29b-41d4-a716-446655440000"
  }
]);

// 2. 使用 computed 动态计算表格标题
const tableTitle = computed(() => {
  return props.context === "path" ? "路径命名可用变量" : "文件名命名可用变量";
});

// 3. 使用 computed 动态计算表格数据
const tableData = computed(() => {
  return props.context === "path"
    ? pathVariables.value
    : filenameVariables.value;
});
</script>

<template>
  <div>
    <el-divider content-position="left">{{ tableTitle }}</el-divider>
    <el-table :data="tableData" border stripe max-height="400">
      <el-table-column prop="variable" label="魔法变量" width="220" />
      <el-table-column prop="description" label="描述" />
      <el-table-column prop="example" label="示例" />
    </el-table>
  </div>
</template>
