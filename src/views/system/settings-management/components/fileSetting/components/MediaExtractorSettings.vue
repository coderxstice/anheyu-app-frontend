<!-- src/components/file-settings/MediaExtractorSettings.vue -->
<template>
  <h2>媒体信息提取</h2>
  <el-alert type="info" show-icon :closable="false" class="setting-alert">
    <p>
      提取媒体文件的元数据以用于展示和搜索。默认情况下，非本机存储策略只会使用“存储策略原生”方式提取。你可以在存储策略设置页面开启“提取器代理”功能扩展第三方存储策略的缩略图能力。<el-link
        type="primary"
        href="#"
        >官方文档</el-link
      >
    </p>
  </el-alert>

  <el-collapse v-model="activeExtractors" class="setting-collapse">
    <!-- EXIF Extractor -->
    <el-collapse-item name="exif" class="setting-group">
      <template #title>
        <div class="setting-group-header">
          <el-checkbox
            v-model="formData.enableExifExtractor"
            label="EXIF"
            size="large"
            @click.stop
          />
        </div>
      </template>
      <div class="setting-group-content">
        <p class="description">
          从图片文件中提取 EXIF 元数据以用于展示和搜索。
        </p>
        <el-form-item label="最大文件大小 (本地存储)">
          <FileSizeInput v-model="formData.exifMaxSizeLocal" placeholder="1" />
          <div class="form-item-help">
            当文件存储在本机存储策略时，允许提取元数据的最大文件大小，填写为 0
            时不限制。
          </div>
        </el-form-item>
        <el-form-item label="最大文件大小 (远程存储)">
          <FileSizeInput
            v-model="formData.exifMaxSizeRemote"
            placeholder="100"
          />
          <div class="form-item-help">
            当文件存储在第三方存储策略时，允许提取元数据的最大文件大小，填写为 0
            时不限制。
          </div>
        </el-form-item>
        <el-form-item>
          <template #label>
            <div class="flex items-center">
              <span>必要时使用暴力搜索</span>
              <el-switch v-model="formData.exifUseBruteForce" class="ml-4" />
            </div>
          </template>
          <div class="form-item-help">
            启用后，如果在标准头部位置找不到 EXIF
            数据，将扫描整个文件以查找。这可能会增加处理时间，但可以找到非标准位置的
            EXIF 数据。
          </div>
        </el-form-item>
      </div>
    </el-collapse-item>

    <!-- Music Meta Extractor -->
    <el-collapse-item name="musicMeta" class="setting-group">
      <template #title>
        <div class="setting-group-header">
          <el-checkbox
            v-model="formData.enableMusicExtractor"
            label="音乐元数据"
            size="large"
            @click.stop
          />
        </div>
      </template>
      <div class="setting-group-content">
        <p class="description">
          从音乐文件中提取元数据，包括标题、艺术家、专辑等信息。
        </p>
        <el-form-item label="最大文件大小 (本地存储)">
          <FileSizeInput v-model="formData.musicMaxSizeLocal" placeholder="1" />
          <div class="form-item-help">
            当文件存储在本机存储策略时，允许提取元数据的最大文件大小，填写为 0
            时不限制。
          </div>
        </el-form-item>
        <el-form-item label="最大文件大小 (远程存储)">
          <FileSizeInput
            v-model="formData.musicMaxSizeRemote"
            placeholder="1"
          />
          <div class="form-item-help">
            当文件存储在第三方存储策略时，允许提取元数据的最大文件大小，填写为 0
            时不限制。
          </div>
        </el-form-item>
      </div>
    </el-collapse-item>
  </el-collapse>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  ElFormItem,
  ElAlert,
  ElLink,
  ElCollapse,
  ElCollapseItem,
  ElCheckbox,
  ElSwitch
} from "element-plus";
import FileSizeInput from "./FileSizeInput.vue";
import type { FileSettingsInfo } from "../../../type";

const props = defineProps<{
  modelValue: FileSettingsInfo;
}>();

const emit = defineEmits(["update:modelValue"]);

const formData = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

// UI state for this component
const activeExtractors = ref<string[]>([]);
</script>

<style scoped lang="scss">
@use "./shared-settings-styles.scss";
</style>
