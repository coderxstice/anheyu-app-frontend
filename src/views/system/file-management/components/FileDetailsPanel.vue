<template>
  <el-drawer
    :model-value="!!fileInfo?.file"
    :with-header="false"
    direction="rtl"
    :size="400"
    class="details-panel-drawer"
    @close="handleClose"
  >
    <div v-if="fileInfo?.file" class="details-panel-content">
      <!-- 1. 头部区域 -->
      <div class="panel-header">
        <div class="file-icon-wrapper">
          <component :is="getFileIcon(fileInfo?.file)" class="file-icon" />
        </div>
        <span class="file-name" :title="fileInfo?.file.name">{{
          fileInfo?.file.name
        }}</span>
        <el-button
          :icon="Close"
          text
          circle
          class="close-btn"
          @click="handleClose"
        />
      </div>

      <!-- 2. Tab 切换区域 -->
      <el-tabs v-model="activeTab" class="panel-tabs">
        <el-tab-pane label="详情" name="details">
          <div class="details-section">
            <el-descriptions title="基本信息" :column="1" border>
              <el-descriptions-item label="类型">{{
                fileInfo?.file.type === FileType.Dir ? "文件夹" : "文件"
              }}</el-descriptions-item>
              <el-descriptions-item label="所在目录">{{
                getDirectory(fileInfo?.file.path)
              }}</el-descriptions-item>
            </el-descriptions>

            <!-- 关键修改：根据文件类型显示不同的大小信息 -->
            <!-- a) 如果是文件夹 -->
            <el-descriptions
              v-if="fileInfo?.file.type === FileType.Dir"
              :column="1"
              border
              class="mt-4"
            >
              <el-descriptions-item label="大小">
                <div v-loading="isCalculating" class="size-cell">
                  <span v-if="isCalculating">计算中...</span>
                  <span v-else-if="calculatedSize">{{
                    formatSize(calculatedSize.logicalSize)
                  }}</span>
                  <el-link
                    v-else
                    type="primary"
                    :underline="false"
                    @click="handleCalculateSize"
                  >
                    点击计算
                  </el-link>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="占用空间">
                <div v-loading="isCalculating" class="size-cell">
                  <span v-if="isCalculating">计算中...</span>
                  <span v-else-if="calculatedSize">{{
                    formatSize(calculatedSize.storageConsumption)
                  }}</span>
                  <span v-else>--</span>
                </div>
              </el-descriptions-item>
            </el-descriptions>
            <!-- b) 如果是文件 -->
            <el-descriptions v-else :column="1" border class="mt-4">
              <el-descriptions-item label="大小">{{
                formatSize(fileInfo?.file.size)
              }}</el-descriptions-item>
              <el-descriptions-item label="占用空间">{{
                formatSize(fileInfo?.file.size)
              }}</el-descriptions-item>
            </el-descriptions>

            <el-descriptions title="存储" :column="1" border class="mt-4">
              <el-descriptions-item label="存储策略">
                {{ fileInfo?.storagePolicy?.name || "未知" }}
              </el-descriptions-item>
              <el-descriptions-item label="我的权限"
                >读写文件</el-descriptions-item
              >
            </el-descriptions>

            <el-descriptions title="时间" :column="1" border class="mt-4">
              <el-descriptions-item label="创建于">{{
                formatDateTime(fileInfo?.file.created_at)
              }}</el-descriptions-item>
              <el-descriptions-item label="修改于">{{
                formatDateTime(fileInfo?.file.updated_at)
              }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>
        <el-tab-pane label="活动" name="activity">
          <el-empty description="暂无活动记录" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { PropType } from "vue";
import { useFileIcons } from "../hooks/useFileIcons";
import { formatSize, formatDateTime } from "@/utils/format";
import {
  FileInfoResponse,
  FileType,
  type FolderSizeData
} from "@/api/sys-file/type";
import { calculateFolderSize } from "@/api/sys-file/sys-file";
import { Close } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { extractLogicalPathFromUri } from "@/utils/fileUtils";

const props = defineProps({
  fileInfo: {
    type: Object as PropType<FileInfoResponse | null>,
    default: null
  }
});

const emit = defineEmits(["close"]);

const { getFileIcon } = useFileIcons();
const activeTab = ref("details");

// 状态管理
const isCalculating = ref(false);
const calculatedSize = ref<FolderSizeData | null>(null);

// 事件处理
const handleClose = () => {
  emit("close");
};

/**
 * 重置文件夹大小相关的状态
 */
const resetFolderSizeState = () => {
  isCalculating.value = false;
  calculatedSize.value = null;
};

/**
 * 处理点击“计算”的事件
 */
const handleCalculateSize = async () => {
  if (!props.fileInfo || isCalculating.value) return;

  isCalculating.value = true;
  try {
    const res = await calculateFolderSize(props.fileInfo.file.id);
    if (res.code === 200 && res.data) {
      calculatedSize.value = res.data;
    } else {
      ElMessage.error(res.message || "计算失败");
      calculatedSize.value = null; // 失败时清空
    }
  } catch (error) {
    console.error("计算文件夹大小失败:", error);
    ElMessage.error("计算失败，请检查网络或联系管理员");
    calculatedSize.value = null; // 失败时清空
  } finally {
    isCalculating.value = false;
  }
};

// 辅助函数
const getDirectory = (uri: string | undefined | null): string => {
  if (!uri) return "未知";
  const logicalPath = extractLogicalPathFromUri(uri);
  if (logicalPath === "/") {
    return "-"; // 表示根目录
  }
  const lastSlashIndex = logicalPath.lastIndexOf("/");
  if (lastSlashIndex === -1) {
    return "未知";
  }
  if (lastSlashIndex === 0) {
    return "我的文件 (/)";
  }
  return logicalPath.substring(0, lastSlashIndex);
};

// 生命周期与侦听器
// 侦听 file prop 的变化，以便在切换文件时重置状态
watch(
  () => props.fileInfo,
  newFileInfo => {
    if (newFileInfo) {
      resetFolderSizeState();
      activeTab.value = "details"; // 每次打开新文件时，默认显示详情页

      console.log("当前文件信息:", newFileInfo);
    }
  },
  { immediate: true } // 保证组件首次加载时也能执行
);
</script>

<style lang="scss">
.details-panel-drawer {
  .el-drawer__body {
    padding: 0;
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    border: var(--style-border);

    .file-icon-wrapper {
      flex-shrink: 0;

      .file-icon {
        width: 32px;
        height: 32px;
      }
    }

    .file-name {
      flex-grow: 1;
      margin-left: 12px;
      overflow: hidden;
      font-size: 16px;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .close-btn {
      margin-left: 8px;
    }
  }

  .panel-tabs {
    padding: 0 20px;

    .el-tabs__header {
      margin-bottom: 24px;
    }
  }

  .details-section {
    // 增加一个 max-height 和 overflow-y 来允许内容滚动
    // 防止内容过多时撑开抽屉
    max-height: calc(100vh - 160px); // 根据你的布局微调这个值
    padding-bottom: 20px;
    overflow-y: auto;

    .el-descriptions__title {
      font-size: 14px;
      color: var(--anzhiyu-fontcolor);
    }

    .el-descriptions {
      margin-top: 20px;
    }
  }

  // 为计算大小的单元格添加样式
  .size-cell {
    display: flex;
    align-items: center;
    min-height: 24px; // 防止 v-loading 时高度变化
  }
}
</style>
