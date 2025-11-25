<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-21 18:36:57
 * @LastEditTime: 2025-11-25 09:41:26
 * @LastEditors: 安知鱼
-->
<template>
  <el-divider content-position="left">
    <h3>页面设置</h3>
  </el-divider>

  <el-form-item label="外链跳转提示">
    <div>
      <el-switch
        v-model="formData.enableExternalLinkWarning"
        active-text="开启"
        inactive-text="关闭"
      />
      <div class="form-item-help">
        开启后，点击外部链接时会显示中间提示页面，提醒用户即将跳转到外部网站。
      </div>
    </div>
  </el-form-item>

  <el-form-item>
    <template #label>
      <span>相册页面【/album】请求后端 URL</span>
      <div class="form-item-help" style="margin-top: 0">
        相册页面后端 URL
        用于请求相册数据，如果有比较好的又不想自己传相册的，可以直接使用他人部署的【安和鱼】来直接使用。注意需要以/结尾。
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

  <el-divider content-position="left">
    <h3>自定义代码</h3>
  </el-divider>

  <el-form-item label="自定义头部 HTML 代码">
    <el-input
      v-model="formData.customHeaderHTML"
      type="textarea"
      :rows="6"
      placeholder="此处代码将插入到 </head> 标签前"
    />
    <div class="form-item-help">
      在页面头部 &lt;/head&gt; 标签前插入的自定义 HTML 代码。<br />
      可以包含 &lt;style&gt;、&lt;script&gt;、&lt;link&gt;、&lt;meta&gt;
      等任何标签。<br />
      例如：<code>&lt;style&gt;body { --theme: #ff6800; }&lt;/style&gt;</code>
    </div>
  </el-form-item>

  <el-form-item label="自定义底部 HTML 代码">
    <el-input
      v-model="formData.customFooterHTML"
      type="textarea"
      :rows="6"
      placeholder="此处代码将插入到 </body> 标签前"
    />
    <div class="form-item-help">
      在页面底部 &lt;/body&gt; 标签前插入的自定义 HTML 代码。<br />
      可以包含 &lt;script&gt; 等任何标签，适合添加网站统计、聊天插件等。<br />
      例如：<code>&lt;script src="..."&gt;&lt;/script&gt;</code>
    </div>
  </el-form-item>

  <el-divider content-position="left">
    <h3>文章页面自定义代码</h3>
  </el-divider>

  <el-form-item label="自定义文章顶部 HTML">
    <el-input
      v-model="formData.customPostTopHTML"
      type="textarea"
      :rows="6"
      placeholder="请填写文章顶部自定义HTML内容"
    />
    <div class="form-item-help">
      自定义文章顶部 HTML 代码，将插入到文章内容区域的最顶部（在 AI
      摘要之前）。<br />
      可用于添加广告位、提示信息、特殊公告等。支持完整的 HTML 代码（包括
      &lt;style&gt; 和 &lt;script&gt; 标签）。
    </div>
  </el-form-item>

  <el-form-item label="自定义文章底部 HTML">
    <el-input
      v-model="formData.customPostBottomHTML"
      type="textarea"
      :rows="6"
      placeholder="请填写文章底部自定义HTML内容"
    />
    <div class="form-item-help">
      自定义文章底部 HTML
      代码，将插入到文章内容区域的最底部（在评论区之前）。<br />
      可用于添加版权声明、相关推荐、打赏信息等。支持完整的 HTML 代码（包括
      &lt;style&gt; 和 &lt;script&gt; 标签）。
    </div>
  </el-form-item>

  <PageOneImageConfig v-model="formData" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PageSittingInfo } from "../type";
import PageOneImageConfig from "./PageOneImageConfig.vue";

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
.el-form-item {
  margin-bottom: 24px;
}

.form-item-help {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--anzhiyu-secondtext);
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

  :deep(.el-textarea__inner) {
    background-color: var(--anzhiyu-card-bg);
    border-color: var(--el-border-color-darker);
    color: var(--anzhiyu-fontcolor);

    &:hover {
      border-color: var(--anzhiyu-card-border);
    }

    &:focus {
      background-color: var(--anzhiyu-card-bg);
      border-color: var(--anzhiyu-theme);
      box-shadow: 0 0 0 1px var(--anzhiyu-theme) inset;
    }
  }

  :deep(.el-switch) {
    &.is-checked {
      .el-switch__core {
        background-color: var(--anzhiyu-theme);
      }
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

  :deep(.el-textarea__inner) {
    background-color: var(--anzhiyu-card-bg);
    border-color: var(--el-border-color-darker);
    color: var(--anzhiyu-fontcolor);

    &:hover {
      border-color: var(--anzhiyu-card-border);
    }

    &:focus {
      background-color: var(--anzhiyu-card-bg);
      border-color: var(--anzhiyu-theme);
      box-shadow: 0 0 0 1px var(--anzhiyu-theme) inset;
    }
  }

  :deep(.el-switch) {
    &.is-checked {
      .el-switch__core {
        background-color: var(--anzhiyu-theme);
      }
    }
  }
}
</style>
