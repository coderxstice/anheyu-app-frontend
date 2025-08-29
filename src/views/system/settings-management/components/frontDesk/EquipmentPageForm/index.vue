<template>
  <el-divider content-position="left">
    <h3>装备页配置</h3>
  </el-divider>

  <EquipmentEditor
    :equipment-list="modelValue.list"
    :banner-config="modelValue.banner"
    @update:equipment-list="handleListUpdate"
    @update:banner-config="handleBannerUpdate"
  />
</template>

<script setup lang="ts">
import type {
  EquipmentPageSettingsInfo,
  EquipmentCategory
} from "../../../type";
import EquipmentEditor from "./EquipmentEditor.vue";

const props = defineProps<{
  modelValue: EquipmentPageSettingsInfo;
}>();

const emit = defineEmits(["update:modelValue"]);

/**
 * @description 处理装备列表更新事件
 * @param newList 最新的装备列表数组
 */
const handleListUpdate = (newList: EquipmentCategory[]) => {
  // 创建一个全新的对象，包含更新后的 list，然后 emit 出去
  // 这是确保 v-model 能够正确响应对象内部变化的正确做法
  emit("update:modelValue", {
    ...props.modelValue,
    list: newList
  });
};

/**
 * @description 处理横幅配置更新事件
 * @param newBanner 最新的横幅配置对象
 */
const handleBannerUpdate = (newBanner: EquipmentPageSettingsInfo["banner"]) => {
  // 创建一个全新的对象，包含更新后的 banner，然后 emit 出去
  emit("update:modelValue", {
    ...props.modelValue,
    banner: newBanner
  });
};
</script>

<style scoped lang="scss">
.el-divider {
  margin: 40px 0 28px;

  h3 {
    margin: 0;
    color: #606266;
  }
}
</style>
