<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-14 10:06:55
 * @LastEditTime: 2025-08-14 10:27:47
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from "vue";
import { Editor } from "@bytemd/vue-next";
import gfm from "@bytemd/plugin-gfm";
import highlight from "@bytemd/plugin-highlight-ssr";
import frontmatter from "@bytemd/plugin-frontmatter";
import gemoji from "@bytemd/plugin-gemoji";

// 引入 Bytemd 核心样式
import "bytemd/dist/index.css";
// 引入一个代码高亮主题，github-dark 在亮色和暗色背景下效果都不错
import "highlight.js/styles/github-dark.css";

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  placeholder: {
    type: String,
    default: "在这里开始你的创作..."
  },
  height: {
    type: String,
    default: "100%"
  }
});

const emit = defineEmits(["update:modelValue"]);

// Bytemd 插件
const plugins = [gfm(), highlight(), frontmatter(), gemoji()];

const content = ref(props.modelValue);

// 监听父组件传来的值，同步更新编辑器内容
watch(
  () => props.modelValue,
  newValue => {
    if (newValue !== content.value) {
      content.value = newValue;
    }
  }
);

// 编辑器内容变化时，通知父组件
const handleChange = (v: string) => {
  content.value = v;
  emit("update:modelValue", v);
};
</script>

<template>
  <div class="editor-bytemd-container" :style="{ height: height }">
    <Editor
      :value="content"
      :plugins="plugins"
      :placeholder="placeholder"
      mode="split"
      @change="handleChange"
    />
  </div>
</template>

<style lang="scss">
.editor-bytemd-container {
  .bytemd {
    height: 100%;
  }

  /* Bytemd 使用 CSS 变量进行主题化。
    我们在这里覆盖这些变量，使其值与 Element Plus 的主题变量保持一致，
    这样编辑器的外观就能自动跟随应用的亮/暗模式切换了。
  */
  .bytemd {
    --byt-mono: "JetBrains Mono", monospace;
    --byt-background: var(--el-bg-color-overlay);
    --byt-text-color: var(--el-text-color-primary);
    --byt-border-color: var(--el-border-color-light);
    --byt-input-background: var(--el-bg-color-page);
  }
}
</style>
