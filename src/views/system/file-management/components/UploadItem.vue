<template>
  <div
    class="upload-item"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- 进度条现在是独立的，作为背景 -->
    <div class="progress-bar-bg">
      <div class="progress-bar-fg" :style="{ width: item.progress + '%' }" />
    </div>

    <div class="item-icon">
      <el-icon><Document /></el-icon>
    </div>

    <div class="item-info">
      <div class="item-name">
        <span :title="item.name">{{ item.name }}</span>
        <!-- 根据 isResuming 标志显示"断点续传"标签 -->
        <el-tag
          v-if="item.isResuming && item.status !== 'success'"
          type="info"
          size="small"
          class="status-tag"
        >
          断点续传
        </el-tag>
      </div>

      <!-- 主要信息显示区域 -->
      <div class="status-action-wrapper">
        <Transition
          :css="false"
          mode="out-in"
          @enter="onAnimateEnter"
          @leave="onAnimateLeave"
        >
          <!-- 详细信息或状态文本 (非悬停时显示) -->
          <div
            v-if="!isHovered"
            :key="`status-${item.id}`"
            class="item-status-display"
          >
            <!-- 上传中/可续传时，显示详细信息 -->
            <div
              v-if="['uploading', 'resumable'].includes(item.status)"
              class="item-detail-info"
            >
              <!-- 根据父组件传入的速度模式，显示瞬时或平均速度 -->
              <span class="speed"
                >{{
                  formatBytes(
                    speedMode === "average"
                      ? item.averageSpeed
                      : item.instantSpeed,
                    2
                  )
                }}/s</span
              >
              <span class="size-info">
                已上传 {{ formatBytes(item.uploadedSize, 1) }}, 共
                {{ formatBytes(item.size, 1) }} - {{ item.progress }}%
              </span>
            </div>
            <!-- 其他状态，显示简单文本 -->
            <div v-else class="item-message" :class="`is-${item.status}`">
              {{ getStatusText(item) }}
            </div>
          </div>

          <!-- 操作按钮 (悬停时显示) -->
          <div v-else :key="`actions-${item.id}`" class="item-actions">
            <!-- 成功状态: 删除记录 -->
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

            <!-- 可续传状态: 继续上传, 删除 -->
            <template v-if="item.status === 'resumable'">
              <el-tooltip content="继续上传" placement="top">
                <el-button
                  circle
                  :icon="RefreshRight"
                  @click="emit('retry-item', item.id)"
                />
              </el-tooltip>
              <el-tooltip content="删除任务" placement="top">
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
import { formatBytes } from "@/utils/fileUtils"; // 引入格式化函数
import {
  Delete,
  Document,
  CircleClose,
  RefreshRight,
  Switch,
  EditPen
} from "@element-plus/icons-vue";

const props = defineProps<{
  item: UploadItem;
  speedMode: "instant" | "average";
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
    case "canceled":
      return "已取消";
    default:
      // 对于 uploading 和 resumable，我们显示详细信息，所以这里可以返回空
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
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  transition: background-color 0.2s;
  position: relative;
  overflow: hidden;
}
.upload-item:hover {
  background-color: #f5f7fa;
}
.item-icon {
  font-size: 28px;
  margin-right: 12px;
  color: #909399;
  flex-shrink: 0;
  position: relative;
  z-index: 2;
}
.item-info {
  flex-grow: 1;
  min-width: 0;
  min-height: 38px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  z-index: 2;
}
.item-name {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.status-tag {
  height: 18px;
  padding: 0 6px;
  line-height: 16px;
  border: none;
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
.item-detail-info {
  font-size: 12px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}
.speed {
  color: var(--el-color-primary);
  font-weight: 500;
  min-width: 75px;
  text-align: left;
}
.size-info {
  color: #909399;
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
.item-message.is-resumable {
  color: var(--el-color-warning);
}
.item-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  gap: 8px;
  /* 添加一个半透明背景，使其在悬停时能覆盖住下面的文字信息 */
  background-color: rgba(245, 247, 250, 0.85);
  backdrop-filter: blur(2px);
  padding: 0 4px;
}
.item-actions .el-button {
  width: 28px;
  height: 28px;
}
.progress-bar-bg {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #e9e9eb;
  z-index: 1;
}
.progress-bar-fg {
  height: 100%;
  background-color: var(--el-color-primary);
  transition: width 0.3s ease;
}
</style>
