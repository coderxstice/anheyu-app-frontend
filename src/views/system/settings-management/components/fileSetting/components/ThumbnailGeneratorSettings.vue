<!-- src/components/file-settings/ThumbnailSettings.vue -->
<template>
  <h2>缩略图生成器</h2>
  <el-alert type="info" show-icon :closable="false" class="setting-alert">
    <p>
      默认情况下，非本机存储策略只会使用“存储策略原生”生成器。你可以在存储策略设置页面开启“生僻文件代理”功能扩展第三方存储策略的缩略图能力。<el-link
        type="primary"
        href="#"
        >官方文档</el-link
      >
    </p>
  </el-alert>

  <el-collapse v-model="activeGenerators" class="setting-collapse">
    <el-collapse-item name="StoragePolicyNative" class="setting-group">
      <template #title>
        <div class="setting-group-header">
          <el-checkbox
            :model-value="true"
            label="存储策略原生"
            size="large"
            :disabled="true"
            @click.stop
          />
        </div>
      </template>
      <div class="setting-group-content">
        <p class="description">
          使用存储提供方原生的图像处理接口。对于本机和 S3
          策略，这一生成器不可用，将会自动顺沿其他生成器。对于其他存储策略，请前往存储策略设置页面设置允许的扩展名。
        </p>
      </div>
    </el-collapse-item>

    <!-- Built-in Generator -->
    <el-collapse-item name="builtin" class="setting-group">
      <template #title>
        <div class="setting-group-header">
          <el-checkbox
            v-model="formData.enableBuiltinGenerator"
            label="内置"
            size="large"
            @click.stop
          />
        </div>
      </template>
      <div class="setting-group-content">
        <p class="description">使用内置的图像处理库，支持常见的图像格式。</p>
        <el-form-item label="最大原始文件尺寸">
          <FileSizeInput
            v-model="formData.builtinMaxFileSize"
            placeholder="0"
          />
          <div class="form-item-help">
            可生成缩略图的最大原始文件的大小，超出此大小的文件不会生成缩略图。填写
            0 为不限制。
          </div>
        </el-form-item>
        <el-form-item label="直接输出的扩展名">
          <el-input
            v-model="formData.builtinDirectServeExts"
            type="textarea"
            :rows="2"
            placeholder="avif,webp"
          />
          <div class="form-item-help">
            这些扩展名的文件将直接提供给用户,
            不经过解码处理。多个请使用半角逗号隔开。
          </div>
        </el-form-item>
      </div>
    </el-collapse-item>

    <!-- Music Cover Generator -->
    <el-collapse-item name="music" class="setting-group">
      <template #title>
        <div class="setting-group-header">
          <el-checkbox
            v-model="formData.enableMusicCoverGenerator"
            label="歌曲封面"
            size="large"
            @click.stop
          />
        </div>
      </template>
      <div class="setting-group-content">
        <p class="description">
          提取音频文件中的专辑封面，支持 ID3 (v1, 2.2, 2.3, 2.4)
          元数据容器。这一生成器依赖于任一其他图像生成器 (内置或 VIPS)。
        </p>
        <el-form-item label="最大原始文件尺寸">
          <FileSizeInput
            v-model="formData.musicCoverMaxFileSize"
            placeholder="1"
          />
          <div class="form-item-help">
            可生成缩略图的最大原始文件的大小，超出此大小的文件不会生成缩略图。
          </div>
        </el-form-item>
        <el-form-item label="可用扩展名">
          <el-input
            v-model="formData.musicCoverSupportedExts"
            type="textarea"
            :rows="2"
            placeholder="mp3,m4a,ogg,flac"
          />
          <div class="form-item-help">
            此生成器可用的文件扩展名列表，多个请使用半角逗号隔开。
          </div>
        </el-form-item>
      </div>
    </el-collapse-item>

    <!-- VIPS Generator -->
    <el-collapse-item name="vips" class="setting-group">
      <template #title>
        <div class="setting-group-header">
          <el-checkbox
            v-model="formData.enableVipsGenerator"
            label="VIPS"
            size="large"
            @click.stop
          />
        </div>
      </template>
      <div class="setting-group-content">
        <p class="description">
          使用 VIPS 生成高质量缩略图，支持海量图片格式，性能优秀。
        </p>
        <el-form-item label="最大原始文件尺寸">
          <FileSizeInput v-model="formData.vipsMaxFileSize" placeholder="75" />
          <div class="form-item-help">
            可生成缩略图的最大原始文件的大小，超出此大小的文件不会生成缩略图。
          </div>
        </el-form-item>
        <el-form-item label="可用扩展名">
          <el-input
            v-model="formData.vipsSupportedExts"
            type="textarea"
            :rows="5"
            placeholder="3fr,ari,arw,..."
          />
          <div class="form-item-help">
            此生成器可用的文件扩展名列表，多个请使用半角逗号隔开。
          </div>
        </el-form-item>
      </div>
    </el-collapse-item>

    <!-- FFmpeg Generator -->
    <el-collapse-item name="ffmpeg" class="setting-group">
      <template #title>
        <div class="setting-group-header">
          <el-checkbox
            v-model="formData.enableFfmpegGenerator"
            label="FFmpeg"
            size="large"
            @click.stop
          />
        </div>
      </template>
      <div class="setting-group-content">
        <p class="description">使用 FFmpeg 生成视频缩略图。</p>
        <el-form-item label="可执行文件">
          <el-input v-model="formData.ffmpegPath" placeholder="ffmpeg">
            <template #append>
              <el-button type="primary" link>测试</el-button>
            </template>
          </el-input>
          <div class="form-item-help">第三方生成器可执行文件的路径或命令。</div>
        </el-form-item>
        <el-form-item label="最大原始文件尺寸">
          <FileSizeInput
            v-model="formData.ffmpegMaxFileSize"
            placeholder="10"
          />
          <div class="form-item-help">
            可生成缩略图的最大原始文件的大小，超出此大小的文件不会生成缩略图。
          </div>
        </el-form-item>
        <el-form-item label="可用扩展名">
          <el-input
            v-model="formData.ffmpegSupportedExts"
            type="textarea"
            :rows="4"
            placeholder="3g2,3gp,asf,..."
          />
          <div class="form-item-help">
            此生成器可用的文件扩展名列表，多个请使用半角逗号隔开。
          </div>
        </el-form-item>
        <el-form-item label="缩略图截取位置">
          <el-input
            v-model="formData.ffmpegCaptureTime"
            placeholder="00:00:01.00"
          />
          <div class="form-item-help">
            定义缩略图截取的时间，推荐选择较小值以加速生成过程。如果超出视频实际长度，会导致缩略图截取失败。
          </div>
        </el-form-item>
      </div>
    </el-collapse-item>
  </el-collapse>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  ElInput,
  ElFormItem,
  ElAlert,
  ElLink,
  ElCollapse,
  ElCollapseItem,
  ElCheckbox,
  ElButton
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
const activeGenerators = ref<string[]>([]);
</script>

<style scoped lang="scss">
@use "./shared-settings-styles.scss";
</style>
