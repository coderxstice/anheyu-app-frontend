<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-04-11 15:37:10
 * @LastEditTime: 2025-06-19 09:57:14
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { ref } from "vue";
import ReCol from "@/components/ReCol";
import { formRules } from "./utils/rule";
import { FormProps } from "./utils/types";

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    id: null,
    imageUrl: "",
    bigImageUrl: "",
    downloadUrl: "",
    thumbParam: "",
    bigParam: "",
    tags: [],
    viewCount: 0,
    downloadCount: 1
  })
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

function getRef() {
  return ruleFormRef.value;
}

defineExpose({ getRef });
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="newFormInline"
    :rules="formRules"
    label-width="140px"
  >
    <el-row :gutter="30">
      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="图片链接" prop="imageUrl">
          <el-input
            v-model="newFormInline.imageUrl"
            clearable
            placeholder="请输入图片图链接"
            type="textarea"
            :rows="8"
          />
        </el-form-item>
      </re-col>
      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="大图链接">
          <el-input
            v-model="newFormInline.bigImageUrl"
            clearable
            placeholder="请输入大图链接"
            type="textarea"
            :rows="8"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="下载地址" prop="downloadUrl">
          <el-input
            v-model="newFormInline.downloadUrl"
            clearable
            placeholder="请输入下载地址"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="缩略图参数" prop="thumbParam">
          <el-input
            v-model="newFormInline.thumbParam"
            clearable
            placeholder="请输入缩略图参数"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="大图参数" prop="bigParam">
          <el-input
            v-model="newFormInline.bigParam"
            clearable
            placeholder="请输入大图参数"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="查看次数">
          <el-input-number
            v-model="newFormInline.viewCount"
            class="w-full!"
            :min="0"
            :max="9999"
            controls-position="right"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="下载次数">
          <el-input-number
            v-model="newFormInline.downloadCount"
            class="w-full!"
            :min="0"
            :max="9999"
            controls-position="right"
          />
        </el-form-item>
      </re-col>

      <re-col :value="12" :xs="24" :sm="24">
        <el-form-item label="标签">
          <el-input-tag
            v-model="newFormInline.tags"
            tag-type="primary"
            tag-effect="light"
            placeholder="请输入标签名称"
          >
            <template #tag="{ value }">
              <div class="flex items-center">
                <span>{{ value }}</span>
              </div>
            </template>
          </el-input-tag>
        </el-form-item>
      </re-col>
    </el-row>
  </el-form>
</template>
