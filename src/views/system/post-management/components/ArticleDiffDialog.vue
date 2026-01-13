<script setup lang="ts">
/**
 * @Description: 版本对比弹窗组件
 * @Author: 安知鱼
 * @Date: 2026-01-13
 */
import { ref, watch, computed } from "vue";
import { ElMessage } from "element-plus";
import { Right } from "@element-plus/icons-vue";
import { compareHistoryVersions } from "@/api/article-history";
import type { ArticleHistory } from "@/api/article-history/types";
import AnDialog from "@/components/AnDialog/index.vue";
import * as Diff from "diff";

const props = defineProps<{
  visible: boolean;
  articleId: string;
  v1?: number;
  v2?: number;
}>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: val => emit("update:visible", val)
});

// 状态
const loading = ref(false);
const oldVersion = ref<ArticleHistory | null>(null);
const newVersion = ref<ArticleHistory | null>(null);
const viewMode = ref<"unified" | "split">("split");

// 生成diff HTML
const diffHtml = computed(() => {
  if (!oldVersion.value || !newVersion.value) return "";

  const oldText = oldVersion.value.content_md || "";
  const newText = newVersion.value.content_md || "";

  if (viewMode.value === "unified") {
    return generateUnifiedDiff(oldText, newText);
  } else {
    return generateSplitDiff(oldText, newText);
  }
});

// 生成统一视图diff
const generateUnifiedDiff = (oldText: string, newText: string): string => {
  const diff = Diff.diffLines(oldText, newText);
  let html = '<div class="diff-unified">';

  diff.forEach(part => {
    const className = part.added
      ? "diff-added"
      : part.removed
        ? "diff-removed"
        : "diff-unchanged";
    const prefix = part.added ? "+" : part.removed ? "-" : " ";
    const lines = part.value.split("\n");

    lines.forEach((line, index) => {
      // 跳过最后一个空行
      if (index === lines.length - 1 && line === "") return;

      const escapedLine = escapeHtml(line);
      html += `<div class="diff-line ${className}"><span class="diff-prefix">${prefix}</span><span class="diff-content">${escapedLine || "&nbsp;"}</span></div>`;
    });
  });

  html += "</div>";
  return html;
};

// 生成分栏视图diff
const generateSplitDiff = (oldText: string, newText: string): string => {
  const diff = Diff.diffLines(oldText, newText);
  let leftHtml = "";
  let rightHtml = "";

  diff.forEach(part => {
    const lines = part.value.split("\n");

    lines.forEach((line, index) => {
      if (index === lines.length - 1 && line === "") return;

      const escapedLine = escapeHtml(line);
      const displayLine = escapedLine || "&nbsp;";

      if (part.added) {
        leftHtml += `<div class="diff-line diff-empty"><span class="diff-content">&nbsp;</span></div>`;
        rightHtml += `<div class="diff-line diff-added"><span class="diff-content">${displayLine}</span></div>`;
      } else if (part.removed) {
        leftHtml += `<div class="diff-line diff-removed"><span class="diff-content">${displayLine}</span></div>`;
        rightHtml += `<div class="diff-line diff-empty"><span class="diff-content">&nbsp;</span></div>`;
      } else {
        leftHtml += `<div class="diff-line"><span class="diff-content">${displayLine}</span></div>`;
        rightHtml += `<div class="diff-line"><span class="diff-content">${displayLine}</span></div>`;
      }
    });
  });

  return `<div class="diff-split"><div class="diff-panel diff-left">${leftHtml}</div><div class="diff-panel diff-right">${rightHtml}</div></div>`;
};

// HTML转义
const escapeHtml = (text: string): string => {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

// 加载对比数据
const loadCompare = async () => {
  if (!props.articleId || !props.v1 || !props.v2) return;

  loading.value = true;
  try {
    const res = await compareHistoryVersions(
      props.articleId,
      props.v1,
      props.v2
    );
    if (res.code === 200) {
      oldVersion.value = res.data.old_version;
      newVersion.value = res.data.new_version;
    } else {
      ElMessage.error(res.message || "获取对比数据失败");
    }
  } catch (error) {
    ElMessage.error("获取对比数据失败");
  } finally {
    loading.value = false;
  }
};

// 格式化日期
const formatDate = (dateStr?: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

// 监听弹窗打开
watch(
  () => props.visible,
  newVal => {
    if (newVal) {
      loadCompare();
    }
  }
);
</script>

<template>
  <AnDialog
    v-model="dialogVisible"
    title="版本对比"
    width="90%"
    max-width="1400px"
    max-height="90vh"
    hide-footer
    class="diff-dialog"
  >
    <div v-loading="loading" class="diff-container">
      <!-- 头部信息 -->
      <div class="diff-header">
        <div class="version-info">
          <span class="version-tag old">
            v{{ oldVersion?.version }}
            <span class="version-date">{{
              formatDate(oldVersion?.created_at)
            }}</span>
          </span>
          <el-icon class="arrow-icon"><Right /></el-icon>
          <span class="version-tag new">
            v{{ newVersion?.version }}
            <span class="version-date">{{
              formatDate(newVersion?.created_at)
            }}</span>
          </span>
        </div>
        <el-radio-group v-model="viewMode" size="small">
          <el-radio-button value="unified">统一视图</el-radio-button>
          <el-radio-button value="split">分栏视图</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 标题对比 -->
      <div v-if="oldVersion?.title !== newVersion?.title" class="title-compare">
        <div class="compare-label">标题变更</div>
        <div class="title-diff">
          <span class="old-title">{{ oldVersion?.title }}</span>
          <el-icon><Right /></el-icon>
          <span class="new-title">{{ newVersion?.title }}</span>
        </div>
      </div>

      <!-- 内容对比 -->
      <div class="diff-content" :class="{ 'split-view': viewMode === 'split' }">
        <div v-if="viewMode === 'split'" class="split-header">
          <span>旧版本 (v{{ oldVersion?.version }})</span>
          <span>新版本 (v{{ newVersion?.version }})</span>
        </div>
        <div class="diff-body" v-html="diffHtml" />
      </div>

      <!-- 统计信息 -->
      <div class="diff-stats">
        <span class="stat-item">
          旧版本字数: {{ oldVersion?.word_count || 0 }}
        </span>
        <span class="stat-item">
          新版本字数: {{ newVersion?.word_count || 0 }}
        </span>
        <span
          class="stat-item"
          :class="{
            positive:
              (newVersion?.word_count || 0) - (oldVersion?.word_count || 0) > 0,
            negative:
              (newVersion?.word_count || 0) - (oldVersion?.word_count || 0) < 0
          }"
        >
          变化:
          {{
            (newVersion?.word_count || 0) - (oldVersion?.word_count || 0) > 0
              ? "+"
              : ""
          }}{{ (newVersion?.word_count || 0) - (oldVersion?.word_count || 0) }}
          字
        </span>
      </div>
    </div>
  </AnDialog>
</template>

<style lang="scss" scoped>
.diff-dialog {
  :deep(.dialog-content) {
    padding: 0;
  }
}

.diff-container {
  min-height: 400px;
}

.diff-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-light);
  background: var(--el-fill-color-lighter);

  .version-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .version-tag {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px;
      border-radius: 4px;
      font-weight: 500;

      &.old {
        background: var(--el-color-danger-light-9);
        color: var(--el-color-danger);
      }

      &.new {
        background: var(--el-color-success-light-9);
        color: var(--el-color-success);
      }

      .version-date {
        font-size: 12px;
        font-weight: normal;
        opacity: 0.8;
      }
    }

    .arrow-icon {
      color: var(--el-text-color-secondary);
    }
  }
}

.title-compare {
  padding: 12px 20px;
  background: var(--el-color-warning-light-9);
  border-bottom: 1px solid var(--el-border-color-light);

  .compare-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 4px;
  }

  .title-diff {
    display: flex;
    align-items: center;
    gap: 12px;

    .old-title {
      text-decoration: line-through;
      color: var(--el-color-danger);
    }

    .new-title {
      color: var(--el-color-success);
      font-weight: 500;
    }
  }
}

.diff-content {
  max-height: 60vh;
  overflow: auto;

  .split-header {
    display: grid;
    grid-template-columns: 1fr 1fr;
    padding: 8px 20px;
    background: var(--el-fill-color-light);
    border-bottom: 1px solid var(--el-border-color-light);
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
  }

  .diff-body {
    font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
    font-size: 13px;
    line-height: 1.6;
  }
}

// Diff样式
:deep(.diff-unified) {
  padding: 12px 0;

  .diff-line {
    display: flex;
    padding: 2px 20px;

    &.diff-added {
      background: #d4edda;
      border-left: 3px solid #28a745;

      .diff-prefix {
        color: #28a745;
      }
    }

    &.diff-removed {
      background: #f8d7da;
      border-left: 3px solid #dc3545;

      .diff-prefix {
        color: #dc3545;
      }
    }

    .diff-prefix {
      width: 20px;
      text-align: center;
      color: var(--el-text-color-secondary);
      user-select: none;
      font-weight: 600;
    }

    .diff-content {
      flex: 1;
      white-space: pre-wrap;
      word-break: break-all;
    }
  }
}

:deep(.diff-split) {
  display: grid;
  grid-template-columns: 1fr 1fr;

  .diff-panel {
    border-right: 1px solid var(--el-border-color-light);

    &:last-child {
      border-right: none;
    }
  }

  .diff-line {
    padding: 2px 12px;
    min-height: 24px;
    border-left: 3px solid transparent;

    &.diff-added {
      background: #d4edda;
      border-left-color: #28a745;
    }

    &.diff-removed {
      background: #f8d7da;
      border-left-color: #dc3545;
    }

    &.diff-empty {
      background: #f5f5f5;
    }

    .diff-content {
      white-space: pre-wrap;
      word-break: break-all;
    }
  }
}

.diff-stats {
  display: flex;
  gap: 24px;
  padding: 12px 20px;
  border-top: 1px solid var(--el-border-color-light);
  background: var(--el-fill-color-lighter);
  font-size: 13px;
  color: var(--el-text-color-secondary);

  .stat-item {
    &.positive {
      color: var(--el-color-success);
    }

    &.negative {
      color: var(--el-color-danger);
    }
  }
}
</style>
