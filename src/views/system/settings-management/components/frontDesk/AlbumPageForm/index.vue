<!--
 * @Description: 相册页配置表单
 * @Author: 安知鱼
 * @Date: 2025-12-29 14:00:00
 * @LastEditTime: 2025-12-29 14:00:00
 * @LastEditors: 安知鱼
-->
<template>
  <el-divider content-position="left">
    <h3>相册页配置</h3>
  </el-divider>

  <!-- 横幅配置区域 -->
  <div class="config-section">
    <h4 class="section-title">
      <el-icon><Picture /></el-icon>
      横幅配置
    </h4>
    <div class="config-grid">
      <el-form-item label="背景图片">
        <el-input
          :model-value="modelValue.banner.background"
          placeholder="请输入横幅背景图片链接地址"
          clearable
          @update:model-value="updateBannerConfig('background', $event)"
        >
          <template #prepend>
            <el-icon><Link /></el-icon>
          </template>
        </el-input>
        <div class="form-item-help">相册页面的横幅背景图片。</div>
      </el-form-item>

      <el-form-item label="标题">
        <el-input
          :model-value="modelValue.banner.title"
          placeholder="请输入横幅标题"
          clearable
          @update:model-value="updateBannerConfig('title', $event)"
        />
        <div class="form-item-help">相册页面的横幅标题文字。</div>
      </el-form-item>

      <el-form-item label="描述">
        <el-input
          :model-value="modelValue.banner.description"
          placeholder="请输入横幅描述"
          clearable
          @update:model-value="updateBannerConfig('description', $event)"
        />
        <div class="form-item-help">相册页面的横幅描述文字。</div>
      </el-form-item>

      <el-form-item label="提示">
        <el-input
          :model-value="modelValue.banner.tip"
          placeholder="请输入横幅提示文字"
          clearable
          @update:model-value="updateBannerConfig('tip', $event)"
        />
        <div class="form-item-help">相册页面的横幅提示文字。</div>
      </el-form-item>
    </div>
  </div>

  <!-- 布局配置区域 -->
  <div class="config-section">
    <h4 class="section-title">
      <el-icon><Grid /></el-icon>
      布局配置
    </h4>
    <div class="config-grid">
      <el-form-item label="布局模式">
        <el-select
          :model-value="modelValue.layoutMode"
          placeholder="请选择布局模式"
          @update:model-value="updateConfig('layoutMode', $event)"
        >
          <el-option label="网格布局" value="grid" />
          <el-option label="瀑布流布局" value="waterfall" />
        </el-select>
        <div class="form-item-help">
          网格布局：图片等高排列，整齐美观；瀑布流布局：图片按原始比例展示，参差错落。
        </div>
      </el-form-item>

      <el-form-item label="每页显示数量">
        <el-input-number
          :model-value="modelValue.pageSize"
          :min="1"
          :max="100"
          @update:model-value="updateConfig('pageSize', $event)"
        />
        <div class="form-item-help">每页显示的图片数量，默认 24 张。</div>
      </el-form-item>

      <el-form-item label="显示评论">
        <el-switch
          :model-value="modelValue.enableComment"
          active-text="开启"
          inactive-text="关闭"
          @update:model-value="updateConfig('enableComment', $event as boolean)"
        />
        <div class="form-item-help">是否在相册页面底部显示评论区。</div>
      </el-form-item>
    </div>
  </div>

  <!-- 瀑布流配置区域（仅在瀑布流模式下显示） -->
  <div v-if="modelValue.layoutMode === 'waterfall'" class="config-section">
    <h4 class="section-title">
      <el-icon><SetUp /></el-icon>
      瀑布流配置
    </h4>
    <div class="config-grid">
      <el-form-item label="大屏列数 (≥1200px)">
        <el-input-number
          :model-value="modelValue.waterfall?.columnCount?.large ?? 4"
          :min="1"
          :max="8"
          @update:model-value="updateWaterfallColumnCount('large', $event)"
        />
        <div class="form-item-help">屏幕宽度大于等于 1200px 时显示的列数。</div>
      </el-form-item>

      <el-form-item label="中屏列数 (≥768px)">
        <el-input-number
          :model-value="modelValue.waterfall?.columnCount?.medium ?? 3"
          :min="1"
          :max="6"
          @update:model-value="updateWaterfallColumnCount('medium', $event)"
        />
        <div class="form-item-help">
          屏幕宽度 768px 至 1199px 时显示的列数。
        </div>
      </el-form-item>

      <el-form-item label="小屏列数 (<768px)">
        <el-input-number
          :model-value="modelValue.waterfall?.columnCount?.small ?? 1"
          :min="1"
          :max="4"
          @update:model-value="updateWaterfallColumnCount('small', $event)"
        />
        <div class="form-item-help">屏幕宽度小于 768px 时显示的列数。</div>
      </el-form-item>

      <el-form-item label="图片间距 (px)">
        <el-input-number
          :model-value="modelValue.waterfall?.gap ?? 16"
          :min="0"
          :max="50"
          @update:model-value="updateWaterfallGap($event)"
        />
        <div class="form-item-help">
          瀑布流布局中图片之间的间距，单位为像素。
        </div>
      </el-form-item>
    </div>
  </div>

  <!-- 相册数据配置区域 -->
  <div class="config-section">
    <h4 class="section-title">
      <el-icon><FolderOpened /></el-icon>
      相册数据配置
    </h4>
    <div class="config-grid single-column">
      <el-form-item>
        <template #label>
          <span>相册页面【/album】请求后端 URL</span>
        </template>
        <el-input
          :model-value="modelValue.apiURL"
          placeholder="例如：https://album.anheyu.com/"
          clearable
          @update:model-value="updateConfig('apiURL', $event)"
        >
          <template #prepend>
            <el-icon><Link /></el-icon>
          </template>
        </el-input>
        <div class="form-item-help">
          相册页面后端
          URL，用于请求相册数据。如果有比较好的又不想自己传相册的，可以直接使用他人部署的【安和鱼】来直接使用。注意需要以
          / 结尾。
        </div>
      </el-form-item>

      <el-form-item label="默认缩略图参数">
        <el-input
          :model-value="modelValue.defaultThumbParam"
          placeholder="例如：size=small (不需要添加 ? 前缀)"
          clearable
          @update:model-value="updateConfig('defaultThumbParam', $event)"
        />
        <div class="form-item-help">
          用于相册页面的缩略图参数，留空则不添加任何参数。
        </div>
      </el-form-item>

      <el-form-item label="默认大图参数">
        <el-input
          :model-value="modelValue.defaultBigParam"
          placeholder="例如：size=large (不需要添加 ? 前缀)"
          clearable
          @update:model-value="updateConfig('defaultBigParam', $event)"
        />
        <div class="form-item-help">
          用于相册页面的大图参数，留空则不添加任何参数。
        </div>
      </el-form-item>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Picture,
  Link,
  Grid,
  SetUp,
  FolderOpened
} from "@element-plus/icons-vue";
import type { AlbumPageSettingsInfo } from "../../../type";

const props = defineProps<{
  modelValue: AlbumPageSettingsInfo;
}>();

const emit = defineEmits(["update:modelValue"]);

/**
 * @description 更新横幅配置
 * @param key 要更新的字段名
 * @param value 新的值
 */
const updateBannerConfig = (
  key: keyof AlbumPageSettingsInfo["banner"],
  value: string
) => {
  const newBanner = {
    ...props.modelValue.banner,
    [key]: value
  };

  emit("update:modelValue", {
    ...props.modelValue,
    banner: newBanner
  });
};

/**
 * @description 更新配置
 * @param key 要更新的字段名
 * @param value 新的值
 */
const updateConfig = <K extends keyof AlbumPageSettingsInfo>(
  key: K,
  value: AlbumPageSettingsInfo[K]
) => {
  emit("update:modelValue", {
    ...props.modelValue,
    [key]: value
  });
};

/**
 * @description 更新瀑布流列数配置
 * @param size 屏幕尺寸类型 (large/medium/small)
 * @param value 列数值
 */
const updateWaterfallColumnCount = (
  size: "large" | "medium" | "small",
  value: number
) => {
  const currentColumnCount = props.modelValue.waterfall?.columnCount ?? {
    large: 4,
    medium: 3,
    small: 1
  };

  emit("update:modelValue", {
    ...props.modelValue,
    waterfall: {
      ...props.modelValue.waterfall,
      columnCount: {
        ...currentColumnCount,
        [size]: value
      },
      gap: props.modelValue.waterfall?.gap ?? 16
    }
  });
};

/**
 * @description 更新瀑布流间距配置
 * @param value 间距值
 */
const updateWaterfallGap = (value: number) => {
  emit("update:modelValue", {
    ...props.modelValue,
    waterfall: {
      ...props.modelValue.waterfall,
      columnCount: props.modelValue.waterfall?.columnCount ?? {
        large: 4,
        medium: 3,
        small: 1
      },
      gap: value
    }
  });
};
</script>

<style scoped lang="scss">
.el-divider {
  margin: 40px 0 28px;

  h3 {
    margin: 0;
    color: var(--anzhiyu-fontcolor, #606266);
  }

  :deep(.el-divider__text) {
    background-color: var(--anzhiyu-background);
  }
}

.config-section {
  margin-bottom: 32px;
  padding: 24px;
  background: var(--anzhiyu-secondbg, #f8f9fa);
  border-radius: 8px;
  border: var(--style-border-always);
  transition: all 0.3s ease;

  .section-title {
    display: flex;
    gap: 8px;
    align-items: center;
    margin: 0 0 20px;
    font-size: 16px;
    font-weight: 600;
    color: var(--anzhiyu-fontcolor, #303133);

    .el-icon {
      color: var(--anzhiyu-theme, var(--anzhiyu-theme));
    }
  }

  .config-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
    max-width: 600px;

    &.single-column {
      max-width: 100%;
    }

    .el-form-item {
      margin-bottom: 0;

      .form-item-help {
        margin-top: 4px;
        font-size: 12px;
        line-height: 1.4;
        color: var(--anzhiyu-secondtext, #909399);
      }
    }
  }

  // 暗色模式优化
  @media (prefers-color-scheme: dark) {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  html.dark {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
}

@media (width >= 768px) {
  .config-grid:not(.single-column) {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}
</style>
