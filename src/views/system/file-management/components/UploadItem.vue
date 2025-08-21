<template>
  <div
    class="upload-item"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div class="progress-bar-bg">
      <div class="progress-bar-fg" :style="{ width: item.progress + '%' }" />
    </div>

    <div class="item-icon">
      <el-icon><Document /></el-icon>
    </div>

    <div class="item-info">
      <div class="item-name">
        <span :title="item.name">{{ item.name }}</span>
        <el-tag
          v-if="item.isResuming && item.status !== 'success'"
          type="info"
          size="small"
          class="status-tag"
        >
          断点续传
        </el-tag>
      </div>

      <div
        v-if="item.errorMessage && ['error', 'conflict'].includes(item.status)"
        class="item-error-display"
      >
        <el-icon :size="13" style="margin-right: 4px"><Warning /></el-icon>
        <span>{{ item.errorMessage }}</span>
      </div>

      <div class="status-action-wrapper">
        <Transition
          :css="false"
          mode="out-in"
          @enter="onAnimateEnter"
          @leave="onAnimateLeave"
        >
          <div
            v-if="!isHovered"
            :key="`status-${item.id}`"
            class="item-status-display"
          >
            <div
              v-if="['uploading', 'resumable'].includes(item.status)"
              class="item-detail-info"
            >
              <span class="speed">
                {{
                  formatBytes(
                    speedMode === "average"
                      ? item.averageSpeed
                      : item.instantSpeed,
                    2
                  )
                }}/s
              </span>
              <span class="size-info">
                已上传 {{ formatBytes(item.uploadedSize, 1) }}, 共
                {{ formatBytes(item.size, 1) }} - {{ item.progress }}%
              </span>
            </div>
            <div
              v-else-if="!item.errorMessage"
              class="item-message"
              :class="`is-${item.status}`"
            >
              {{ getStatusText(item) }}
            </div>
          </div>

          <div v-else :key="`actions-${item.id}`" class="item-actions">
            <template v-if="item.status === 'success'">
              <el-tooltip content="删除记录" placement="top"
                ><el-button
                  circle
                  :icon="Delete"
                  @click="emit('remove-item', item.id)"
              /></el-tooltip>
            </template>
            <template v-if="item.status === 'error'">
              <el-tooltip content="重试" placement="top"
                ><el-button
                  circle
                  :icon="RefreshRight"
                  @click="emit('retry-item', item.id)"
              /></el-tooltip>
              <el-tooltip content="删除" placement="top"
                ><el-button
                  circle
                  :icon="Delete"
                  @click="emit('remove-item', item.id)"
              /></el-tooltip>
            </template>
            <template v-if="item.status === 'conflict'">
              <el-tooltip content="覆盖" placement="top"
                ><el-button
                  circle
                  :icon="Switch"
                  @click="emit('resolve-conflict', item.id, 'overwrite')"
              /></el-tooltip>
              <el-tooltip content="重命名" placement="top"
                ><el-button
                  circle
                  :icon="EditPen"
                  @click="emit('resolve-conflict', item.id, 'rename')"
              /></el-tooltip>
              <el-tooltip content="删除" placement="top"
                ><el-button
                  circle
                  :icon="Delete"
                  @click="emit('remove-item', item.id)"
              /></el-tooltip>
            </template>
            <template v-if="item.status === 'resumable'">
              <el-tooltip content="继续上传" placement="top"
                ><el-button
                  circle
                  :icon="RefreshRight"
                  @click="emit('retry-item', item.id)"
              /></el-tooltip>
              <el-tooltip content="删除任务" placement="top"
                ><el-button
                  circle
                  :icon="Delete"
                  @click="emit('remove-item', item.id)"
              /></el-tooltip>
            </template>
            <template v-if="['uploading', 'pending'].includes(item.status)">
              <el-tooltip content="取消" placement="top"
                ><el-button
                  circle
                  :icon="CircleClose"
                  @click="emit('remove-item', item.id)"
              /></el-tooltip>
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
import { formatBytes } from "@/utils/fileUtils";
import {
  Delete,
  Document,
  CircleClose,
  RefreshRight,
  Switch,
  EditPen,
  Warning
} from "@element-plus/icons-vue";

const props = defineProps<{
  item: UploadItem;
  speedMode: "instant" | "average";
}>();

const emit = defineEmits<{
  (e: "retry-item", itemId: string): void;
  (e: "remove-item", itemId: string): void;
  (
    e: "resolve-conflict",
    itemId: string,
    strategy: "overwrite" | "rename"
  ): void;
}>();

const isHovered = ref(false);

const getStatusText = (item: UploadItem): string => {
  switch (item.status) {
    case "success":
      return "上传成功";
    case "pending":
      return "等待上传...";
    case "canceled":
      return "已取消";
    default:
      return "";
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
  position: relative;
  display: flex;
  align-items: center;
  padding: 10px 12px;
  overflow: hidden;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.upload-item:hover {
  background-color: #f5f7fa;
}

.item-icon {
  position: relative;
  z-index: 2;
  flex-shrink: 0;
  margin-right: 12px;
  font-size: 28px;
  color: #909399;
}

.item-info {
  position: relative;
  z-index: 2;
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  min-height: 42px;
}

.item-name {
  display: flex;
  gap: 8px;
  align-items: center;
  overflow: hidden;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-tag {
  height: 18px;
  padding: 0 6px;
  line-height: 16px;
  border: none;
}

.item-error-display {
  display: flex;
  align-items: center;
  height: 22px;
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-color-error);
}

.status-action-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  height: 22px;
}

.item-error-display + .status-action-wrapper {
  display: none;
}

.upload-item:hover .item-error-display {
  display: none;
}

.upload-item:hover .item-error-display + .status-action-wrapper {
  display: flex;
}

.item-status-display,
.item-actions {
  width: 100%;
}

.item-detail-info {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  color: #606266;
  white-space: nowrap;
}

.speed {
  min-width: 75px;
  font-weight: 500;
  color: var(--el-color-primary);
  text-align: left;
}

.size-info {
  color: #909399;
}

.item-message {
  overflow: hidden;
  font-size: 12px;
  line-height: 1.4;
  color: #909399;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-message.is-success {
  color: var(--el-color-success);
}

.item-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
  padding: 0 4px;
  background-color: rgb(245 247 250 / 85%);
  backdrop-filter: blur(2px);
}

.item-actions .el-button {
  width: 28px;
  height: 28px;
}

.progress-bar-bg {
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 1;
  width: 100%;
  height: 2px;
  background-color: #e9e9eb;
}

.progress-bar-fg {
  height: 100%;
  background-color: var(--el-color-primary);
  transition: width 0.3s ease;
}
</style>
