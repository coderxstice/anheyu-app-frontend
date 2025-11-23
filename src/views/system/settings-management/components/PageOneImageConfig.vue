<template>
  <el-divider content-position="left">
    <h3>页面一图流配置</h3>
  </el-divider>

  <div class="one-image-config">
    <!-- 全局配置 -->
    <div class="global-config">
      <el-form-item label="一言 API 地址">
        <div>
          <el-input
            v-model="formData.hitokotoAPI"
            placeholder="请输入一言API地址"
            @input="handleUpdate"
          />
          <div class="form-item-help">
            用于获取随机一言的 API 地址，默认为官方 API：https://v1.hitokoto.cn/
          </div>
        </div>
      </el-form-item>

      <el-form-item label="打字机效果速度（毫秒/字符）">
        <div>
          <el-input-number
            v-model="formData.typingSpeed"
            :min="10"
            :max="500"
            :step="10"
            @change="handleUpdate"
          />
          <div class="form-item-help">
            打字机效果的打字速度，单位为毫秒/字符。数值越小速度越快，建议范围
            50-200
          </div>
        </div>
      </el-form-item>
    </div>

    <el-divider />

    <el-collapse v-model="activePages" accordion>
      <!-- 首页配置 -->
      <el-collapse-item title="首页一图流配置" name="home">
        <PageOneImageItem
          v-model="formData.oneImageConfig.home"
          page-name="首页"
          @update:model-value="handleUpdate"
        />
      </el-collapse-item>

      <!-- 分类页配置 -->
      <el-collapse-item title="分类页一图流配置" name="categories">
        <PageOneImageItem
          v-model="formData.oneImageConfig.categories"
          page-name="分类页"
          @update:model-value="handleUpdate"
        />
      </el-collapse-item>

      <!-- 标签页配置 -->
      <el-collapse-item title="标签页一图流配置" name="tags">
        <PageOneImageItem
          v-model="formData.oneImageConfig.tags"
          page-name="标签页"
          @update:model-value="handleUpdate"
        />
      </el-collapse-item>

      <!-- 归档页配置 -->
      <el-collapse-item title="归档页一图流配置" name="archives">
        <PageOneImageItem
          v-model="formData.oneImageConfig.archives"
          page-name="归档页"
          @update:model-value="handleUpdate"
        />
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { PageSittingInfo, PageOneImageConfig } from "../type";
import PageOneImageItem from "./PageOneImageItem.vue";

const props = defineProps<{
  modelValue: PageSittingInfo;
}>();

const emit = defineEmits(["update:modelValue"]);

const activePages = ref<string[]>([]);

// 默认的一图流配置
const defaultOneImageConfig: PageOneImageConfig = {
  home: {
    enable: false,
    background: "",
    mediaType: "image",
    mainTitle: "安和鱼",
    subTitle: "生活明朗，万物可爱",
    typingEffect: false,
    hitokoto: false,
    videoAutoplay: true,
    videoLoop: true,
    videoMuted: true
  },
  categories: {
    enable: false,
    background: "",
    mediaType: "image",
    mainTitle: "安和鱼",
    subTitle: "生活明朗，万物可爱",
    typingEffect: false,
    hitokoto: false,
    videoAutoplay: true,
    videoLoop: true,
    videoMuted: true
  },
  tags: {
    enable: false,
    background: "",
    mediaType: "image",
    mainTitle: "安和鱼",
    subTitle: "生活明朗，万物可爱",
    typingEffect: false,
    hitokoto: false,
    videoAutoplay: true,
    videoLoop: true,
    videoMuted: true
  },
  archives: {
    enable: false,
    background: "",
    mediaType: "image",
    mainTitle: "安和鱼",
    subTitle: "生活明朗，万物可爱",
    typingEffect: false,
    hitokoto: false,
    videoAutoplay: true,
    videoLoop: true,
    videoMuted: true
  }
};

const formData = computed({
  get: () => {
    // 确保 oneImageConfig 存在，如果不存在则使用默认值
    if (!props.modelValue.oneImageConfig) {
      return {
        ...props.modelValue,
        oneImageConfig: defaultOneImageConfig
      };
    }
    // 确保每个页面配置都存在
    const oneImageConfig = { ...defaultOneImageConfig };
    Object.keys(defaultOneImageConfig).forEach(key => {
      if (props.modelValue.oneImageConfig[key as keyof PageOneImageConfig]) {
        oneImageConfig[key as keyof PageOneImageConfig] = {
          ...defaultOneImageConfig[key as keyof PageOneImageConfig],
          ...props.modelValue.oneImageConfig[key as keyof PageOneImageConfig]
        };
      }
    });
    return {
      ...props.modelValue,
      oneImageConfig
    };
  },
  set: value => emit("update:modelValue", value)
});

const handleUpdate = () => {
  emit("update:modelValue", { ...formData.value });
};
</script>

<style scoped lang="scss">
.one-image-config {
  margin-top: 20px;

  .global-config {
    margin-bottom: 20px;
    padding: 20px;
    background: var(--anzhiyu-secondbg, #f8f9fa);
    border-radius: 8px;
    border: var(--style-border-always);
    transition: all 0.3s ease;

    .el-form-item {
      margin-bottom: 24px;
    }

    .form-item-help {
      margin-top: 8px;
      font-size: 13px;
      line-height: 1.5;
      color: var(--anzhiyu-secondtext, #909399);
    }

    // 暗色模式优化
    @media (prefers-color-scheme: dark) {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    html.dark {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
  }

  :deep(.el-collapse-item__header) {
    font-size: 15px;
    font-weight: 500;
    color: var(--anzhiyu-fontcolor, #303133);
    transition: color 0.3s ease;

    // 暗色模式优化
    @media (prefers-color-scheme: dark) {
      background-color: var(--anzhiyu-secondbg);
    }

    html.dark {
      background-color: var(--anzhiyu-secondbg);
    }
  }

  :deep(.el-collapse-item__content) {
    padding: 20px;
    background: var(--anzhiyu-secondbg, #f8f9fa);
    border-radius: 4px;
    transition: all 0.3s ease;

    // 暗色模式优化
    @media (prefers-color-scheme: dark) {
      background: var(--anzhiyu-card-bg);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    html.dark {
      background: var(--anzhiyu-card-bg);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
  }
}

// 分割线暗色模式
:deep(.el-divider) {
  margin: 40px 0 28px;

  h3 {
    color: var(--anzhiyu-fontcolor, #606266);
  }

  .el-divider__text {
    background-color: var(--anzhiyu-background);
    color: var(--anzhiyu-fontcolor);
  }
}

// 暗色模式下的输入框优化
@media (prefers-color-scheme: dark) {
  :deep(.el-input__wrapper) {
    background-color: var(--anzhiyu-card-bg);
    border-color: var(--el-border-color-darker);
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--anzhiyu-card-border);
    }

    &.is-focus {
      background-color: var(--anzhiyu-card-bg);
      border-color: var(--anzhiyu-theme);
      box-shadow: 0 0 0 1px var(--anzhiyu-theme) inset;
    }
  }

  :deep(.el-input-number) {
    .el-input__wrapper {
      background-color: var(--anzhiyu-card-bg);
      border-color: var(--el-border-color-darker);
    }
  }
}

// 手动切换暗色模式支持
html.dark {
  :deep(.el-input__wrapper) {
    background-color: var(--anzhiyu-card-bg);
    border-color: var(--el-border-color-darker);
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--anzhiyu-card-border);
    }

    &.is-focus {
      background-color: var(--anzhiyu-card-bg);
      border-color: var(--anzhiyu-theme);
      box-shadow: 0 0 0 1px var(--anzhiyu-theme) inset;
    }
  }

  :deep(.el-input-number) {
    .el-input__wrapper {
      background-color: var(--anzhiyu-card-bg);
      border-color: var(--el-border-color-darker);
    }
  }
}
</style>
