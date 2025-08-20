<!--
 * @Description: 装备页设置表单
 * @Author: 安知鱼
 * @Date: 2025-08-20
-->
<template>
  <el-divider content-position="left">
    <h3>装备页配置</h3>
  </el-divider>

  <el-form-item label="横幅背景图片">
    <el-input
      v-model="formData.banner.background"
      placeholder="请输入横幅背景图片链接地址"
    />
    <div class="form-item-help">装备页面顶部的横幅背景图片。</div>
  </el-form-item>

  <el-form-item label="横幅标题">
    <el-input v-model="formData.banner.title" placeholder="请输入横幅标题" />
    <div class="form-item-help">装备页面横幅的标题文字。</div>
  </el-form-item>

  <el-form-item label="横幅描述">
    <el-input
      v-model="formData.banner.description"
      placeholder="请输入横幅描述"
    />
    <div class="form-item-help">装备页面横幅的描述文字。</div>
  </el-form-item>

  <el-form-item label="横幅提示">
    <el-input v-model="formData.banner.tip" placeholder="请输入横幅提示文字" />
    <div class="form-item-help">装备页面横幅的提示文字。</div>
  </el-form-item>

  <!-- 装备列表配置 -->
  <EquipmentEditor
    :equipment-list="formData.list"
    :banner-config="formData.banner"
    @update:equipment-list="formData.list = $event"
    @update:banner-config="formData.banner = $event"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { EquipmentPageSettingsInfo } from "../../../type";
import EquipmentEditor from "./EquipmentEditor.vue";

const props = defineProps<{
  modelValue: EquipmentPageSettingsInfo;
}>();

const emit = defineEmits(["update:modelValue"]);

const formData = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

// 装备列表JSON处理
const equipmentListJson = computed({
  get: () => {
    try {
      return JSON.stringify(props.modelValue.list || [], null, 2);
    } catch {
      return "[]";
    }
  },
  set: (value: string) => {
    try {
      const parsed = JSON.parse(value);
      formData.value.list = parsed;
    } catch (error) {
      console.error("装备列表JSON解析失败:", error);
    }
  }
});
</script>

<style scoped lang="scss">
.el-form-item {
  margin-bottom: 24px;
}
.form-item-help {
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
  margin-top: 4px;
}
.el-divider {
  margin: 40px 0 28px 0;
  h3 {
    margin: 0;
    color: #606266;
  }
}
</style>
