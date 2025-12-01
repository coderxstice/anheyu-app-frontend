<template>
  <div
    class="upload-item"
    :class="[`status-${item.status}`]"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- 进度背景填充 -->
    <div
      v-if="item.status === 'uploading' || item.status === 'pending'"
      class="progress-fill"
      :style="{ width: item.progress + '%' }"
    />

    <div class="item-icon">
      <el-icon v-if="item.status === 'success'" class="icon-success"
        ><CircleCheckFilled
      /></el-icon>
      <el-icon v-else-if="item.status === 'error'" class="icon-error"
        ><CircleCloseFilled
      /></el-icon>
      <el-icon v-else-if="item.status === 'uploading'" class="icon-uploading"
        ><Loading
      /></el-icon>
      <el-icon v-else><Document /></el-icon>
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
              <span class="progress-percent">{{ item.progress }}%</span>
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
                {{ formatBytes(item.uploadedSize, 1) }} /
                {{ formatBytes(item.size, 1) }}
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
              <el-tooltip content="删除记录" placement="top" :show-arrow="false"
                ><el-button
                  circle
                  :icon="Delete"
                  @click="emit('remove-item', item.id)"
              /></el-tooltip>
            </template>
            <template v-if="item.status === 'error'">
              <el-tooltip content="重试" placement="top" :show-arrow="false"
                ><el-button
                  circle
                  :icon="RefreshRight"
                  @click="emit('retry-item', item.id)"
              /></el-tooltip>
              <el-tooltip content="删除" placement="top" :show-arrow="false"
                ><el-button
                  circle
                  :icon="Delete"
                  @click="emit('remove-item', item.id)"
              /></el-tooltip>
            </template>
            <template v-if="item.status === 'conflict'">
              <el-tooltip content="覆盖" placement="top" :show-arrow="false"
                ><el-button
                  circle
                  :icon="Switch"
                  @click="emit('resolve-conflict', item.id, 'overwrite')"
              /></el-tooltip>
              <el-tooltip content="重命名" placement="top" :show-arrow="false"
                ><el-button
                  circle
                  :icon="EditPen"
                  @click="emit('resolve-conflict', item.id, 'rename')"
              /></el-tooltip>
              <el-tooltip content="删除" placement="top" :show-arrow="false"
                ><el-button
                  circle
                  :icon="Delete"
                  @click="emit('remove-item', item.id)"
              /></el-tooltip>
            </template>
            <template v-if="item.status === 'resumable'">
              <el-tooltip content="继续上传" placement="top" :show-arrow="false"
                ><el-button
                  circle
                  :icon="RefreshRight"
                  @click="emit('retry-item', item.id)"
              /></el-tooltip>
              <el-tooltip content="删除任务" placement="top" :show-arrow="false"
                ><el-button
                  circle
                  :icon="Delete"
                  @click="emit('remove-item', item.id)"
              /></el-tooltip>
            </template>
            <template v-if="['uploading', 'pending'].includes(item.status)">
              <el-tooltip content="取消" placement="top" :show-arrow="false"
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
  Warning,
  CircleCheckFilled,
  CircleCloseFilled,
  Loading
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
  padding: 14px 16px;
  margin-bottom: 8px;
  overflow: hidden;
  background-color: var(--anzhiyu-secondbg);
  border: 1px solid var(--anzhiyu-card-border);
  border-radius: 12px;
  transition:
    background-color 0.2s,
    border-color 0.2s,
    box-shadow 0.2s;
}

.upload-item:last-child {
  margin-bottom: 0;
}

.upload-item:hover {
  border-color: var(--anzhiyu-theme-op);
  box-shadow: 0 2px 8px rgb(0 0 0 / 6%);
}

/* 状态特定样式 */
.upload-item.status-success {
  background-color: color-mix(
    in srgb,
    var(--anzhiyu-green) 10%,
    var(--anzhiyu-card-bg)
  );
  border-color: color-mix(in srgb, var(--anzhiyu-green) 30%, transparent);
}

.upload-item.status-error {
  background-color: color-mix(
    in srgb,
    var(--el-color-error) 10%,
    var(--anzhiyu-card-bg)
  );
  border-color: color-mix(in srgb, var(--el-color-error) 30%, transparent);
}

.upload-item.status-uploading {
  border-color: color-mix(in srgb, var(--anzhiyu-theme) 40%, transparent);
}

.item-icon {
  position: relative;
  z-index: 2;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin-right: 14px;
  font-size: 20px;
  color: var(--anzhiyu-secondtext);
  background-color: var(--anzhiyu-card-bg);
  border-radius: 10px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 8%);
}

.icon-success {
  color: var(--anzhiyu-green);
}

.icon-error {
  color: var(--el-color-error);
}

.icon-uploading {
  color: var(--anzhiyu-theme);
  animation: spin 1.2s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
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
  font-weight: 500;
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
  gap: 10px;
  align-items: center;
  font-size: 12px;
  color: var(--anzhiyu-fontcolor);
  white-space: nowrap;
}

.progress-percent {
  min-width: 36px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--anzhiyu-theme);
}

.speed {
  min-width: 72px;
  padding: 2px 8px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--anzhiyu-theme);
  text-align: center;
  background-color: color-mix(in srgb, var(--anzhiyu-theme) 12%, transparent);
  border-radius: 4px;
}

.size-info {
  font-variant-numeric: tabular-nums;
  color: var(--anzhiyu-secondtext);
}

.item-message {
  overflow: hidden;
  font-size: 12px;
  line-height: 1.4;
  color: var(--anzhiyu-secondtext);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-message.is-success {
  font-weight: 500;
  color: var(--anzhiyu-green);
}

.item-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
  padding: 0 4px;
  backdrop-filter: blur(2px);
}

.item-actions .el-button {
  width: 28px;
  height: 28px;
}

/* 进度背景填充 */
.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  height: 100%;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--anzhiyu-theme) 18%, var(--anzhiyu-card-bg)),
    color-mix(in srgb, var(--anzhiyu-theme) 8%, var(--anzhiyu-card-bg))
  );
  border-radius: 11px;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
