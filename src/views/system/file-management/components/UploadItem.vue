<template>
  <div
    class="upload-item"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div class="item-icon">
      <el-icon><Document /></el-icon>
    </div>
    <!-- **CSS 修复**: 移除了 item-info 的 overflow: hidden -->
    <div class="item-info">
      <div class="item-name" :title="item.name">{{ item.name }}</div>

      <div class="status-action-wrapper">
        <Transition
          :css="false"
          mode="out-in"
          @enter="onAnimateEnter"
          @leave="onAnimateLeave"
        >
          <!-- 状态/进度条 (非悬停时显示) -->
          <div
            v-if="!isHovered"
            :key="`status-${item.id}`"
            class="item-status-display"
          >
            <el-progress
              v-if="['pending', 'uploading'].includes(item.status)"
              :percentage="item.progress"
              :status="getProgressStatus(item.status)"
              :stroke-width="2"
              :show-text="false"
            />
            <div v-else class="item-message" :class="`is-${item.status}`">
              {{ getStatusText(item) }}
            </div>
          </div>

          <!-- 操作按钮 (悬停时显示) -->
          <div v-else :key="`actions-${item.id}`" class="item-actions">
            <!-- 成功状态: 新增“删除记录”按钮 -->
            <template v-if="item.status === 'success'">
              <el-tooltip content="删除记录" placement="top">
                <el-button
                  circle
                  :icon="Delete"
                  @click="emit('remove-item', item.id)"
                />
              </el-tooltip>
            </template>

            <!-- 错误状态: 重试, 删除 -->
            <template v-if="item.status === 'error'">
              <el-tooltip content="重试" placement="top">
                <el-button
                  circle
                  :icon="RefreshRight"
                  @click="emit('retry-item', item.id)"
                />
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button
                  circle
                  :icon="Delete"
                  @click="emit('remove-item', item.id)"
                />
              </el-tooltip>
            </template>

            <!-- 冲突状态: 覆盖, 重命名, 删除 -->
            <template v-if="item.status === 'conflict'">
              <el-tooltip content="覆盖" placement="top">
                <el-button
                  circle
                  :icon="Switch"
                  @click="emit('resolve-conflict', item.id, 'overwrite')"
                />
              </el-tooltip>
              <el-tooltip content="重命名" placement="top">
                <el-button
                  circle
                  :icon="EditPen"
                  @click="emit('resolve-conflict', item.id, 'rename')"
                />
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button
                  circle
                  :icon="Delete"
                  @click="emit('remove-item', item.id)"
                />
              </el-tooltip>
            </template>

            <!-- 进行中/等待中: 取消 -->
            <template v-if="['uploading', 'pending'].includes(item.status)">
              <el-tooltip content="取消" placement="top">
                <el-button
                  circle
                  :icon="CircleClose"
                  @click="emit('remove-item', item.id)"
                />
              </el-tooltip>
            </template>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import gsap from "gsap";
import type { UploadItem } from "@/api/sys-file/type";
import {
  Delete,
  Document,
  CircleClose,
  RefreshRight,
  Switch,
  EditPen
} from "@element-plus/icons-vue";
import type { ProgressProps } from "element-plus";

const props = defineProps<{
  item: UploadItem;
}>();

const emit = defineEmits<{
  (e: "retry-item", itemId: number): void;
  (e: "remove-item", itemId: number): void;
  (
    e: "resolve-conflict",
    itemId: number,
    strategy: "overwrite" | "rename"
  ): void;
}>();

const isHovered = ref(false);

const getProgressStatus = (
  status: UploadItem["status"]
): ProgressProps["status"] => {
  if (status === "success") return "success";
  if (status === "error" || status === "conflict") return "exception";
  return undefined;
};

const getStatusText = (item: UploadItem): string => {
  switch (item.status) {
    case "error":
      return item.errorMessage || "上传失败";
    case "conflict":
      return item.errorMessage || "同名文件已存在";
    case "success":
      return "上传成功";
    case "pending":
      return "等待上传...";
    case "uploading":
      return `正在上传... ${item.progress}%`;
    default:
      return "已完成";
  }
};

const onAnimateEnter = (el: Element, done: () => void) => {
  gsap.fromTo(
    el,
    { opacity: 0, y: 10 },
    { opacity: 1, y: 0, duration: 0.2, ease: "power1.inOut", onComplete: done }
  );
};

const onAnimateLeave = (el: Element, done: () => void) => {
  gsap.to(el, {
    opacity: 0,
    y: -10,
    duration: 0.2,
    ease: "power1.inOut",
    onComplete: done
  });
};
</script>

<style scoped>
.upload-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  transition: background-color 0.2s;
  position: relative;
}
.upload-item:hover {
  background-color: #f5f7fa;
}
.item-icon {
  font-size: 28px;
  margin-right: 12px;
  color: #909399;
  flex-shrink: 0;
}
.item-info {
  flex-grow: 1;
  /* **CSS 修复**: 增加 min-width: 0 来解决 flex 布局下的 overflow 问题 */
  min-width: 0;
  min-height: 38px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.item-name {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}
.status-action-wrapper {
  position: relative;
  height: 22px;
  display: flex;
  align-items: center;
}
.item-status-display {
  width: 100%;
}
.item-message {
  font-size: 12px;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #909399;
}
.item-message.is-error,
.item-message.is-conflict {
  color: var(--el-color-error);
  font-weight: 500;
}
.item-message.is-success {
  color: var(--el-color-success);
}
.item-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  gap: 8px;
}
.item-actions .el-button {
  width: 28px;
  height: 28px;
}
:deep(.el-progress-bar__inner) {
  transition: width 0.3s ease !important;
}
</style>
