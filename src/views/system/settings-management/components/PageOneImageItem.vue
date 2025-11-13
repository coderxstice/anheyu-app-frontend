<template>
  <div class="page-one-image-item">
    <el-form-item :label="`是否开启${pageName}一图流`">
      <div>
        <el-switch v-model="localValue.enable" @change="handleUpdate" />
        <div class="form-item-help">开启后将显示全屏背景图片和标题</div>
      </div>
    </el-form-item>

    <template v-if="localValue.enable">
      <el-form-item :label="`${pageName}全屏背景图片URL`">
        <div>
          <el-input
            v-model="localValue.background"
            placeholder="请输入背景图片URL"
            @input="handleUpdate"
          />
          <div class="form-item-help">
            全屏背景图片的URL地址，建议使用高清大图
          </div>
        </div>
      </el-form-item>

      <el-form-item :label="`${pageName}主标题`">
        <div>
          <el-input
            v-model="localValue.mainTitle"
            placeholder="请输入主标题"
            @input="handleUpdate"
          />
          <div class="form-item-help">显示在页面顶部的主标题</div>
        </div>
      </el-form-item>

      <el-form-item :label="`${pageName}副标题`">
        <div>
          <el-input
            v-model="localValue.subTitle"
            placeholder="请输入副标题"
            @input="handleUpdate"
          />
          <div class="form-item-help">
            显示在主标题下方的副标题，开启一言后此设置将失效
          </div>
        </div>
      </el-form-item>

      <el-form-item :label="`${pageName}副标题打字机效果`">
        <div>
          <el-switch v-model="localValue.typingEffect" @change="handleUpdate" />
          <div class="form-item-help">开启后副标题将以打字机效果显示</div>
        </div>
      </el-form-item>

      <el-form-item :label="`${pageName}副标题一言`">
        <div>
          <el-switch v-model="localValue.hitokoto" @change="handleUpdate" />
          <div class="form-item-help">
            开启后将使用一言API随机显示句子，手动设置的副标题将失效
          </div>
        </div>
      </el-form-item>
    </template>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from "vue";
import type { PageOneImageItem } from "../type";

const props = defineProps<{
  modelValue: PageOneImageItem;
  pageName: string;
}>();

const emit = defineEmits(["update:modelValue"]);

const localValue = reactive<PageOneImageItem>({
  enable: props.modelValue.enable ?? false,
  background: props.modelValue.background ?? "",
  mainTitle: props.modelValue.mainTitle ?? "",
  subTitle: props.modelValue.subTitle ?? "",
  typingEffect: props.modelValue.typingEffect ?? false,
  hitokoto: props.modelValue.hitokoto ?? false
});

watch(
  () => props.modelValue,
  newValue => {
    Object.assign(localValue, newValue);
  },
  { deep: true }
);

const handleUpdate = () => {
  emit("update:modelValue", { ...localValue });
};
</script>

<style scoped lang="scss">
.page-one-image-item {
  .el-form-item {
    margin-bottom: 24px;
  }

  .form-item-help {
    margin-top: 8px;
    font-size: 13px;
    line-height: 1.5;
    color: #909399;
  }
}
</style>
