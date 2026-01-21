<script setup lang="ts">
/**
 * @Description: 文章历史版本抽屉组件
 * @Author: 安知鱼
 * @Date: 2026-01-13
 */
import { ref, watch, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Clock, Switch, DocumentCopy } from "@element-plus/icons-vue";
import {
  getArticleHistory,
  restoreHistoryVersion
} from "@/api/article-history";
import type {
  ArticleHistoryListItem,
  ArticleHistory
} from "@/api/article-history/types";
import ArticleDiffDialog from "./ArticleDiffDialog.vue";

const props = defineProps<{
  visible: boolean;
  articleId: string;
}>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "restore", history: ArticleHistory): void;
}>();

const drawerVisible = computed({
  get: () => props.visible,
  set: val => emit("update:visible", val)
});

// 数据状态
const loading = ref(false);
const historyList = ref<ArticleHistoryListItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);

// 对比状态
const diffDialogVisible = ref(false);
const selectedVersions = ref<number[]>([]);

// 加载历史版本列表
const loadHistory = async () => {
  if (!props.articleId) return;

  loading.value = true;
  try {
    const res = await getArticleHistory(
      props.articleId,
      page.value,
      pageSize.value
    );
    if (res.code === 200) {
      historyList.value = res.data.list || [];
      total.value = res.data.total || 0;
    } else {
      ElMessage.error({
        message: res.message || "获取历史版本失败",
        customClass: "high-z-index-message"
      });
    }
  } catch (error) {
    ElMessage.error({
      message: "获取历史版本失败",
      customClass: "high-z-index-message"
    });
  } finally {
    loading.value = false;
  }
};

// 选择版本进行对比
const toggleVersionSelect = (version: number) => {
  const index = selectedVersions.value.indexOf(version);
  if (index === -1) {
    if (selectedVersions.value.length >= 2) {
      selectedVersions.value.shift();
    }
    selectedVersions.value.push(version);
  } else {
    selectedVersions.value.splice(index, 1);
  }
};

const isVersionSelected = (version: number) => {
  return selectedVersions.value.includes(version);
};

// 打开对比弹窗
const handleCompare = () => {
  if (selectedVersions.value.length !== 2) {
    ElMessage.warning({
      message: "请选择两个版本进行对比",
      customClass: "high-z-index-message"
    });
    return;
  }
  diffDialogVisible.value = true;
};

// 恢复到指定版本
const handleRestore = async (item: ArticleHistoryListItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要恢复到版本 v${item.version} 吗？这将用该版本的内容替换当前编辑器中的内容。`,
      "恢复版本确认",
      {
        confirmButtonText: "确定恢复",
        cancelButtonText: "取消",
        type: "warning",
        customClass: "high-z-index-message-box"
      }
    );

    const res = await restoreHistoryVersion(props.articleId, item.version);
    if (res.code === 200) {
      emit("restore", res.data);
      drawerVisible.value = false;
      ElMessage.success({
        message: "已恢复到版本 v" + item.version,
        customClass: "high-z-index-message"
      });
    } else {
      ElMessage.error({
        message: res.message || "恢复失败",
        customClass: "high-z-index-message"
      });
    }
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error({
        message: "恢复失败",
        customClass: "high-z-index-message"
      });
    }
  }
};

// 格式化日期
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

// 监听抽屉打开
watch(
  () => props.visible,
  newVal => {
    if (newVal) {
      page.value = 1;
      selectedVersions.value = [];
      loadHistory();
    }
  }
);

// 分页变化
const handlePageChange = (newPage: number) => {
  page.value = newPage;
  loadHistory();
};
</script>

<template>
  <el-drawer
    v-model="drawerVisible"
    title="历史版本"
    direction="rtl"
    size="480px"
    :destroy-on-close="true"
    class="history-drawer"
  >
    <template #header>
      <div class="drawer-header">
        <el-icon><Clock /></el-icon>
        <span>历史版本</span>
        <el-badge
          v-if="total > 0"
          :value="total"
          :max="99"
          class="history-count"
        />
      </div>
    </template>

    <div v-loading="loading" class="history-content">
      <!-- 对比操作栏 -->
      <div v-if="historyList.length > 1" class="compare-bar">
        <span class="compare-tip">
          选择 {{ selectedVersions.length }}/2 个版本进行对比
        </span>
        <el-button
          size="small"
          :type="selectedVersions.length === 2 ? 'primary' : 'default'"
          :disabled="selectedVersions.length !== 2"
          @click="handleCompare"
        >
          对比
        </el-button>
      </div>

      <!-- 空状态 -->
      <el-empty
        v-if="!loading && historyList.length === 0"
        description="暂无历史版本记录"
      />

      <!-- 历史版本列表 -->
      <div v-else class="history-list">
        <div
          v-for="item in historyList"
          :key="item.id"
          class="history-item"
          :class="{ selected: isVersionSelected(item.version) }"
          @click="toggleVersionSelect(item.version)"
        >
          <div class="item-left">
            <div class="item-header">
              <span class="version-badge">v{{ item.version }}</span>
              <span class="item-title">{{ item.title }}</span>
            </div>
            <div class="item-meta">
              {{ formatDate(item.created_at) }} · {{ item.editor_nickname }} ·
              {{ item.word_count }} 字
            </div>
            <div v-if="item.change_note" class="item-note">
              {{ item.change_note }}
            </div>
          </div>
          <div class="item-right" @click.stop>
            <el-button
              text
              type="primary"
              size="small"
              @click="handleRestore(item)"
            >
              恢复
            </el-button>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="total > pageSize" class="pagination">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          small
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 版本对比弹窗 -->
    <ArticleDiffDialog
      v-model:visible="diffDialogVisible"
      :article-id="articleId"
      :v1="selectedVersions[0]"
      :v2="selectedVersions[1]"
    />
  </el-drawer>
</template>

<style lang="scss" scoped>
.drawer-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;

  .history-count {
    margin-left: 4px;
  }
}

.history-content {
  min-height: 300px;
}

.compare-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  margin-bottom: 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;

  .compare-tip {
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 14px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    background: var(--el-fill-color-lighter);
  }

  &.selected {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }

  .item-left {
    flex: 1;
    min-width: 0;
  }

  .item-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 6px;

    .version-badge {
      flex-shrink: 0;
      padding: 2px 8px;
      font-size: 12px;
      font-weight: 500;
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-8);
      border-radius: 4px;
    }

    .item-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .item-meta {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 4px;
  }

  .item-note {
    margin-top: 8px;
    padding: 8px 10px;
    font-size: 12px;
    color: var(--el-text-color-regular);
    background: var(--el-fill-color-light);
    border-radius: 6px;
    line-height: 1.5;
  }

  .item-right {
    flex-shrink: 0;
    margin-left: 12px;
  }
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
