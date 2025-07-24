<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-21 18:36:57
 * @LastEditTime: 2025-07-24 17:35:04
 * @LastEditors: 安知鱼
-->
<template>
  <el-divider content-position="left">
    <h3>页面设置</h3>
  </el-divider>

  <el-form-item>
    <template #label>
      <span>相册页面【/album】请求后端 URL</span>
      <div class="form-item-help" style="margin-top: 0">
        相册页面后端 URL
        用于请求相册数据，如果有比较好的又不想自己传相册的，可以直接使用他人部署的鱼鱼来直接使用。注意需要以/结尾。
      </div>
    </template>
    <el-input
      v-model="formData.albumApiURL"
      placeholder="例如：https://album.anheyu.com/"
    />
  </el-form-item>

  <el-form-item label="默认缩略图参数">
    <el-input
      v-model="formData.defaultThumbParam"
      placeholder="例如：size=small (不需要添加 ? 前缀)"
    />
    <div class="form-item-help">
      用于相册页面的缩略图参数，留空则不添加任何参数。
    </div>
  </el-form-item>

  <el-form-item label="默认大图参数">
    <el-input
      v-model="formData.defaultBigParam"
      placeholder="例如：size=large (不需要添加 ? 前缀)"
    />
    <div class="form-item-help">
      用于相册页面的大图参数，留空则不添加任何参数。
    </div>
  </el-form-item>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PageSittingInfo } from "../type";

const props = defineProps<{
  modelValue: PageSittingInfo;
}>();

const emit = defineEmits(["update:modelValue"]);

const formData = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});
</script>

<style scoped lang="scss">
// 样式与 BaseInfoForm 和 IconSettingsForm 相同
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
