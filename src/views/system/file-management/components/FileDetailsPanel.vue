<template>
  <el-drawer
    :model-value="!!file"
    :with-header="false"
    direction="rtl"
    :size="400"
    class="details-panel-drawer"
    @close="handleClose"
  >
    <div v-if="file" class="details-panel-content">
      <!-- 1. 头部区域 -->
      <div class="panel-header">
        <div class="file-icon-wrapper">
          <component :is="getFileIcon(file)" class="file-icon" />
        </div>
        <span class="file-name" :title="file.name">{{ file.name }}</span>
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
                file.type === FileType.Dir ? "文件夹" : "文件"
              }}</el-descriptions-item>
              <el-descriptions-item label="所在目录">{{
                getDirectory(file.path)
              }}</el-descriptions-item>
            </el-descriptions>

            <el-descriptions :column="1" border class="mt-4">
              <el-descriptions-item label="大小">{{
                formatSize(file.size)
              }}</el-descriptions-item>
              <el-descriptions-item label="占用空间">{{
                formatSize(file.size)
              }}</el-descriptions-item>
            </el-descriptions>

            <el-descriptions title="存储" :column="1" border class="mt-4">
              <el-descriptions-item label="存储策略"
                >本地存储</el-descriptions-item
              >
              <el-descriptions-item label="我的权限"
                >读写文件</el-descriptions-item
              >
            </el-descriptions>

            <el-descriptions title="时间" :column="1" border class="mt-4">
              <el-descriptions-item label="创建于">{{
                formatDateTime(file.created_at)
              }}</el-descriptions-item>
              <el-descriptions-item label="修改于">{{
                formatDateTime(file.updated_at)
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
import { ref } from "vue";
import type { PropType } from "vue";
import { useFileIcons } from "../hooks/useFileIcons";
import { formatSize, formatDateTime } from "@/utils/format";
import { FileItem, FileType } from "@/api/sys-file/type";
import { Close } from "@element-plus/icons-vue";
// 核心修复: 引入路径解析工具函数
import { extractLogicalPathFromUri } from "@/utils/fileUtils";

defineProps({
  file: {
    type: Object as PropType<FileItem | null>,
    default: null
  }
});

const emit = defineEmits(["close"]);

const { getFileIcon } = useFileIcons();
const activeTab = ref("details");

const handleClose = () => {
  emit("close");
};

/**
 * 核心修复: 重写 getDirectory 函数以正确解析路径
 * @param {string | undefined | null} uri - 后端返回的完整 URI
 * @returns {string} - 用户友好的目录路径
 */
const getDirectory = (uri: string | undefined | null): string => {
  if (!uri) return "未知";

  // 1. 从 URI (e.g., "anzhiyu://folder/file.txt") 中提取逻辑路径 (e.g., "/folder/file.txt")
  const logicalPath = extractLogicalPathFromUri(uri);

  // 2. 如果项目本身就是根目录，它没有“所在目录”
  if (logicalPath === "/") {
    return "-";
  }

  // 3. 找到最后一个斜杠的位置，以确定父路径
  const lastSlashIndex = logicalPath.lastIndexOf("/");
  if (lastSlashIndex === -1) {
    return "未知"; // 理论上不会发生
  }

  // 4. 如果最后一个斜杠是第一个字符，说明父目录是根目录
  if (lastSlashIndex === 0) {
    return "我的文件 (/)";
  }

  // 5. 对于其他情况，返回截取的父目录路径
  return logicalPath.substring(0, lastSlashIndex);
};
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
    border-bottom: 1px solid #e0e0e0;
    .file-icon-wrapper {
      flex-shrink: 0;
      .file-icon {
        width: 32px;
        height: 32px;
      }
    }
    .file-name {
      font-size: 16px;
      font-weight: 600;
      margin-left: 12px;
      flex-grow: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
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
    padding-bottom: 20px;
    .el-descriptions__title {
      font-size: 14px;
      color: #606266;
    }
    .el-descriptions {
      margin-top: 20px;
    }
  }
}
</style>
