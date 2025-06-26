<template>
  <!-- 使用 v-model:visible 模式，或直接用 :visible 和 @update:visible -->
  <div v-if="visible" class="upload-progress-panel">
    <div class="panel-header">
      <span>上传队列 ({{ queue.length }})</span>
      <div class="header-actions">
        <!-- 发出事件 -->
        <el-tooltip content="清除已完成" placement="bottom">
          <el-icon @click="emit('clear-finished')"><Delete /></el-icon>
        </el-tooltip>
        <el-tooltip content="关闭" placement="bottom">
          <el-icon @click="emit('update:visible', false)"><Close /></el-icon>
        </el-tooltip>
      </div>
    </div>
    <div class="panel-body">
      <div v-if="queue.length === 0" class="empty-queue">没有上传任务</div>
      <!-- 使用从 props 传入的 queue -->
      <div v-for="item in queue" :key="item.id" class="upload-item">
        <div class="item-icon">
          <!-- 可以根据文件类型显示不同图标 -->
          <el-icon><Document /></el-icon>
        </div>
        <div class="item-info">
          <div class="item-name" :title="item.name">{{ item.name }}</div>
          <!-- 修复 progress status 的类型问题 -->
          <el-progress
            :percentage="item.progress"
            :status="getProgressStatus(item.status)"
          />
          <div v-if="item.status === 'error'" class="error-message">
            {{ item.errorMessage }}
          </div>
        </div>
        <div class="item-status">
          <el-tooltip content="取消上传" placement="bottom">
            <el-icon
              v-if="item.status === 'uploading' || item.status === 'pending'"
              class="cancel-icon"
              @click="emit('cancel-upload', item.id)"
            >
              <CircleClose />
            </el-icon>
          </el-tooltip>
          <el-icon
            v-if="item.status === 'success'"
            color="var(--el-color-success)"
            ><CircleCheckFilled
          /></el-icon>
          <el-tooltip
            v-if="item.status === 'error'"
            :content="item.errorMessage"
            placement="top"
          >
            <el-icon color="var(--el-color-error)"
              ><CircleCloseFilled
            /></el-icon>
          </el-tooltip>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UploadItem } from "@/api/sys-file/type";
import {
  Close,
  Delete,
  Document,
  CircleCheckFilled,
  CircleCloseFilled,
  CircleClose // 新增取消图标
} from "@element-plus/icons-vue";
import type { ProgressProps } from "element-plus";

// --- 1. 定义 Props 和 Emits ---
defineProps<{
  visible: boolean;
  queue: UploadItem[];
}>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "clear-finished"): void;
  (e: "cancel-upload", itemId: number): void;
}>();

// --- 2. 辅助函数 ---
// 将我们的上传状态映射到 Element Plus 的 Progress 组件状态
const getProgressStatus = (
  status: UploadItem["status"]
): ProgressProps["status"] => {
  switch (status) {
    case "success":
      return "success";
    case "error":
      return "exception";
    case "uploading":
    case "pending":
    default:
      return undefined; // 默认颜色
  }
};
</script>

<style scoped>
/* 样式基本保持不变，增加一些细节 */
.upload-progress-panel {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 350px;
  max-height: 400px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 2050;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 500;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.header-actions .el-icon {
  cursor: pointer;
  color: #909399;
}
.header-actions .el-icon:hover {
  color: var(--el-color-primary);
}
.panel-body {
  padding: 8px;
  overflow-y: auto;
  flex: 1;
}
.upload-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 4px;
}
.upload-item:hover {
  background-color: #f5f7fa;
}
.item-icon {
  font-size: 24px;
  margin-right: 12px;
  color: #909399;
}
.item-info {
  flex-grow: 1;
  overflow: hidden;
}
.item-name {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}
.item-status {
  font-size: 20px;
  margin-left: 12px;
  display: flex;
  align-items: center;
}
.cancel-icon {
  cursor: pointer;
  color: #c0c4cc;
}
.cancel-icon:hover {
  color: #909399;
}
.error-message {
  font-size: 12px;
  color: var(--el-color-error);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.empty-queue {
  text-align: center;
  padding: 30px 0;
  color: #909399;
}
</style>
