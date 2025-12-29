<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-21 18:06:37
 * @LastEditTime: 2025-12-29 10:00:00
 * @LastEditors: 安知鱼
-->
<template>
  <h3>图标</h3>

  <el-alert type="info" :closable="false" class="icon-description">
    <template #default>
      这些图标路径默认是引用的本地前端字段。需要修改可以在文件管理上传图片后获取外链并填写。
      如果需要直接替换本地资源的话，可以按照
      <el-link
        href="https://dev.anheyu.com/docs/configuration/#%E9%9D%99%E6%80%81%E8%B5%84%E6%BA%90%E8%87%AA%E5%AE%9A%E4%B9%89"
        target="_blank"
        type="primary"
      >
        静态资源自定义
      </el-link>
      功能进行操作。
    </template>
  </el-alert>

  <el-form-item label="LOGO">
    <div class="logo-inputs">
      <div class="logo-input-item">
        <div class="input-with-upload">
          <el-input v-model="formData.logoDay" placeholder="日间模式 LOGO 地址">
            <template #prepend>日间模式</template>
          </el-input>
          <el-button
            type="primary"
            :icon="FolderOpened"
            @click="openResourceLibrary('logoDay')"
          />
        </div>
      </div>
      <div class="logo-input-item">
        <div class="input-with-upload">
          <el-input
            v-model="formData.logoNight"
            placeholder="黑暗模式 LOGO 地址"
          >
            <template #prepend>黑暗模式</template>
          </el-input>
          <el-button
            type="primary"
            :icon="FolderOpened"
            @click="openResourceLibrary('logoNight')"
          />
        </div>
      </div>
    </div>
    <div class="w-full form-item-help">
      LOGO 图像的地址，用于在左上角展示；请分别提供黑暗模式和日间模式下不同的
      LOGO。
    </div>

    <div class="flex">
      <el-image
        v-if="formData.logoDay"
        :src="formData.logoDay"
        fit="contain"
        class="bg-[var(--anzhiyu-card-bg-grey)] max-w-44 max-h-12 rounded-lg p-2 mt-2"
      />
      <el-image
        v-if="formData.logoNight"
        :src="formData.logoNight"
        fit="contain"
        class="w-full p-2 mt-2 ml-4 bg-black rounded-lg max-w-44 max-h-12"
      />
    </div>
  </el-form-item>

  <el-form-item label="小图标 (Favicon)">
    <div class="w-full">
      <div class="input-with-upload">
        <el-input
          v-model="formData.favicon"
          placeholder="请输入 .ico 图标地址"
        />
        <el-button
          type="primary"
          :icon="FolderOpened"
          @click="openResourceLibrary('favicon')"
        />
      </div>
      <div class="form-item-help">扩展名为 ico 的小图标地址。</div>
    </div>

    <div class="flex">
      <el-image
        v-if="formData.favicon"
        :src="formData.favicon"
        fit="contain"
        class="bg-[var(--anzhiyu-card-bg-grey)] max-w-44 max-h-12 rounded-lg p-2 mt-2"
      />
    </div>
  </el-form-item>

  <el-form-item label="中图标 (PWA)">
    <div class="w-full">
      <div class="input-with-upload">
        <el-input
          v-model="formData.iconMedium"
          placeholder="请输入 192x192 的 PNG 图标地址"
        />
        <el-button
          type="primary"
          :icon="FolderOpened"
          @click="openResourceLibrary('iconMedium')"
        />
      </div>
      <div class="form-item-help">192x192 的中等图标地址，png 格式。</div>
    </div>

    <div class="flex">
      <el-image
        v-if="formData.iconMedium"
        :src="formData.iconMedium"
        fit="contain"
        class="bg-[var(--anzhiyu-card-bg-grey)] max-w-[192px] max-h-[192px] rounded-lg p-2 mt-2"
      />
    </div>
  </el-form-item>

  <el-form-item label="大图标 (PWA)">
    <div class="w-full">
      <div class="input-with-upload">
        <el-input
          v-model="formData.iconLarge"
          placeholder="请输入 512x512 的 PNG 图标地址"
        />
        <el-button
          type="primary"
          :icon="FolderOpened"
          @click="openResourceLibrary('iconLarge')"
        />
      </div>
      <div class="form-item-help">512x512 的大图标地址，png 格式。</div>
    </div>

    <div class="flex">
      <el-image
        v-if="formData.iconLarge"
        :src="formData.iconLarge"
        fit="contain"
        class="bg-[var(--anzhiyu-card-bg-grey)] max-w-[512px] max-h-[512px] rounded-lg p-2 mt-2"
      />
    </div>
  </el-form-item>

  <!-- 资源库组件 -->
  <ResourceLibrary
    v-model="resourceLibraryVisible"
    :multiple="false"
    @confirm="handleResourceConfirm"
  />
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { FolderOpened } from "@element-plus/icons-vue";
import type { SiteInfo } from "../type";
import ResourceLibrary from "@/components/ResourceLibrary/index.vue";

const props = defineProps<{
  modelValue: SiteInfo;
}>();

const emit = defineEmits(["update:modelValue"]);

// 使用 computed 来实现 props 和本地数据状态的双向绑定
const formData = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

// 资源库相关状态
const resourceLibraryVisible = ref(false);
const currentField = ref<keyof SiteInfo | null>(null);

// 打开资源库
const openResourceLibrary = (field: keyof SiteInfo) => {
  currentField.value = field;
  resourceLibraryVisible.value = true;
};

// 资源库确认选择
const handleResourceConfirm = (urls: string[]) => {
  if (currentField.value && urls.length > 0) {
    // 使用类型断言来安全地设置值
    (formData.value as any)[currentField.value] = urls[0];
  }
};
</script>

<style scoped lang="scss">
.el-form-item {
  margin-bottom: 24px;
}

.form-item-help {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--anzhiyu-secondtext);
}

.icon-description {
  margin-bottom: 24px;
}

.el-divider {
  margin: 40px 0 28px;

  h3 {
    margin: 0;
    color: var(--anzhiyu-fontcolor);
  }

  :deep(.el-divider__text) {
    background-color: var(--anzhiyu-background);
  }
}

.el-image {
  border: var(--style-border);
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.02);
    box-shadow: var(--anzhiyu-shadow-border);
  }
}

.logo-inputs {
  width: 100%;

  .logo-input-item {
    &:first-child {
      margin-bottom: 10px;
    }
  }
}

// 输入框与上传按钮组合样式
.input-with-upload {
  display: flex;
  gap: 8px;
  width: 100%;

  .el-input {
    flex: 1;
  }

  .el-button {
    flex-shrink: 0;
  }
}

// 暗色模式下的输入框优化
@media (prefers-color-scheme: dark) {
  :deep(.el-input__wrapper) {
    background-color: var(--anzhiyu-card-bg);
    border-color: var(--el-border-color-darker);

    &:hover {
      border-color: var(--anzhiyu-card-border);
    }

    &.is-focus {
      background-color: var(--anzhiyu-card-bg);
      border-color: var(--anzhiyu-theme);
      box-shadow: 0 0 0 1px var(--anzhiyu-theme) inset;
    }
  }
}

// 手动切换暗色模式支持
html.dark {
  :deep(.el-input__wrapper) {
    background-color: var(--anzhiyu-card-bg);
    border-color: var(--el-border-color-darker);

    &:hover {
      border-color: var(--anzhiyu-card-border);
    }

    &.is-focus {
      background-color: var(--anzhiyu-card-bg);
      border-color: var(--anzhiyu-theme);
      box-shadow: 0 0 0 1px var(--anzhiyu-theme) inset;
    }
  }
}
</style>
