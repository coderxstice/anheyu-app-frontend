<template>
  <Teleport to="body">
    <Transition name="upload-panel-fade">
      <div v-if="visible" class="upload-progress-panel">
        <div class="panel-header">
          <span>上传队列 ({{ activeUploadsCount }}/{{ queue.length }})</span>
          <div class="header-actions">
            <el-tooltip content="更多操作" placement="bottom">
              <el-dropdown trigger="click" @command="handleGlobalCommand">
                <el-icon class="action-icon"><MoreFilled /></el-icon>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="overwrite-all"
                      >覆盖所有同名文件</el-dropdown-item
                    >
                    <el-dropdown-item command="retry-all"
                      >重试所有失败任务</el-dropdown-item
                    >
                    <el-dropdown-item command="clear-finished" divided
                      >清除已完成任务</el-dropdown-item
                    >
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </el-tooltip>
            <el-tooltip content="关闭" placement="bottom">
              <el-icon class="action-icon" @click="emit('close')"
                ><Close
              /></el-icon>
            </el-tooltip>
          </div>
        </div>
        <div class="panel-body">
          <div v-if="queue.length === 0" class="empty-queue">没有上传任务</div>
          <div v-for="item in queue" :key="item.id" class="upload-item">
            <div class="item-icon">
              <el-icon><Document /></el-icon>
            </div>
            <div class="item-info">
              <div class="item-name" :title="item.name">{{ item.name }}</div>
              <!-- 只有在非错误/冲突状态下显示进度条 -->
              <el-progress
                v-if="!['error', 'conflict', 'success'].includes(item.status)"
                :percentage="item.progress"
                :status="getProgressStatus(item.status)"
              />
              <div v-else class="item-message" :class="`is-${item.status}`">
                {{ getStatusText(item) }}
              </div>
            </div>
            <!-- 动态操作按钮 -->
            <div class="item-actions">
              <!-- 成功状态: 无按钮 -->
              <el-icon
                v-if="item.status === 'success'"
                color="var(--el-color-success)"
                ><CircleCheckFilled
              /></el-icon>

              <!-- 失败状态: 重试, 删除 -->
              <template v-if="item.status === 'error'">
                <el-tooltip content="重试" placement="bottom"
                  ><el-icon @click="emit('retry-item', item.id)"
                    ><RefreshRight /></el-icon
                ></el-tooltip>
                <el-tooltip content="删除" placement="bottom"
                  ><el-icon @click="emit('remove-item', item.id)"
                    ><Delete /></el-icon
                ></el-tooltip>
              </template>

              <!-- 冲突状态: 覆盖, 重命名, 删除 -->
              <template v-if="item.status === 'conflict'">
                <el-tooltip content="覆盖" placement="bottom"
                  ><el-icon
                    @click="emit('resolve-conflict', item.id, 'overwrite')"
                    ><Switch /></el-icon
                ></el-tooltip>
                <el-tooltip content="重命名" placement="bottom"
                  ><el-icon @click="emit('resolve-conflict', item.id, 'rename')"
                    ><EditPen /></el-icon
                ></el-tooltip>
                <el-tooltip content="删除" placement="bottom"
                  ><el-icon @click="emit('remove-item', item.id)"
                    ><Delete /></el-icon
                ></el-tooltip>
              </template>

              <!-- 进行中状态: 取消 -->
              <template
                v-if="item.status === 'uploading' || item.status === 'pending'"
              >
                <el-tooltip content="取消" placement="bottom"
                  ><el-icon @click="emit('remove-item', item.id)"
                    ><CircleClose /></el-icon
                ></el-tooltip>
              </template>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { UploadItem } from "@/api/sys-file/type";
import {
  Close,
  Delete,
  Document,
  CircleCheckFilled,
  CircleClose,
  MoreFilled,
  RefreshRight,
  Switch,
  EditPen
} from "@element-plus/icons-vue";
import type { ProgressProps } from "element-plus";

const props = defineProps<{
  visible: boolean;
  queue: UploadItem[];
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "clear-finished"): void;
  (e: "retry-item", itemId: number): void;
  (e: "remove-item", itemId: number): void;
  (
    e: "resolve-conflict",
    itemId: number,
    strategy: "overwrite" | "rename"
  ): void;
  (e: "global-command", command: string): void;
}>();

const activeUploadsCount = computed(
  () =>
    props.queue.filter(
      item => item.status === "uploading" || item.status === "pending"
    ).length
);

const getProgressStatus = (
  status: UploadItem["status"]
): ProgressProps["status"] => {
  switch (status) {
    case "success":
      return "success";
    case "error":
    case "conflict": // 冲突也视为一种异常
      return "exception";
    default:
      return undefined;
  }
};

const getStatusText = (item: UploadItem) => {
  switch (item.status) {
    case "error":
    case "conflict":
      return item.errorMessage || "未知错误";
    case "success":
      return "上传成功";
    default:
      return "";
  }
};

const handleGlobalCommand = (command: string | number | object) => {
  if (typeof command === "string") {
    emit("global-command", command);
  }
};
</script>

<style scoped>
.upload-panel-fade-enter-active,
.upload-panel-fade-leave-active {
  transition: all 0.3s ease;
}
.upload-panel-fade-enter-from,
.upload-panel-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.upload-progress-panel {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 380px; /* 稍微加宽以容纳按钮 */
  max-height: 450px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow:
    0 6px 16px -8px rgba(0, 0, 0, 0.08),
    0 9px 28px 0 rgba(0, 0, 0, 0.05),
    0 12px 48px 16px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  z-index: 2050;
  color: #303133;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 500;
  flex-shrink: 0;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}
.action-icon {
  cursor: pointer;
  color: #909399;
  font-size: 16px;
  transition: color 0.2s;
}
.action-icon:hover {
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
  padding: 10px 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}
.upload-item:hover {
  background-color: #f5f7fa;
}
.item-icon {
  font-size: 24px;
  margin-right: 12px;
  color: #909399;
  flex-shrink: 0;
}
.item-info {
  flex-grow: 1;
  overflow: hidden;
  padding-right: 8px;
}
.item-name {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}
.item-message {
  font-size: 12px;
  line-height: 1.4;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.item-message.is-error,
.item-message.is-conflict {
  color: var(--el-color-error);
}
.item-message.is-success {
  color: var(--el-color-success);
}
.item-actions {
  font-size: 18px;
  margin-left: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #909399;
  flex-shrink: 0;
}
.item-actions .el-icon {
  cursor: pointer;
  transition: color 0.2s;
}
.item-actions .el-icon:hover {
  color: var(--el-color-primary);
}
.empty-queue {
  text-align: center;
  padding: 40px 0;
  color: #909399;
  font-size: 14px;
}
</style>
