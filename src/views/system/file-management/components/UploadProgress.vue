<template>
  <div>
    <Teleport to="body">
      <Transition name="upload-panel-fade">
        <div
          v-if="visible"
          class="upload-progress-panel"
          :class="{ 'is-collapsed': isCollapsed }"
        >
          <div class="panel-header">
            <!-- Tooltip for Close Icon -->
            <el-tooltip content="关闭" placement="bottom">
              <span class="icon-wrapper" @click="emit('close')">
                <el-icon class="action-icon"><Close /></el-icon>
              </span>
            </el-tooltip>

            <span>上传队列</span>

            <div class="header-actions">
              <!-- Tooltip for Add Icon -->
              <el-tooltip content="添加文件" placement="bottom">
                <span class="icon-wrapper" @click="emit('add-files')">
                  <el-icon class="action-icon"><Plus /></el-icon>
                </span>
              </el-tooltip>

              <!-- Popover for More Actions -->
              <el-popover
                ref="popoverRef"
                v-model:visible="isMoreActionsPopoverVisible"
                placement="bottom-end"
                trigger="click"
                :width="200"
                popper-class="upload-panel-popover"
                transition="dropdown-scale"
                :teleported="true"
              >
                <template #reference>
                  <span
                    class="icon-wrapper"
                    :title="isMoreActionsPopoverVisible ? '' : '更多操作'"
                  >
                    <el-icon class="action-icon"><MoreFilled /></el-icon>
                  </span>
                </template>

                <ul class="popover-menu">
                  <!-- 速度设置 -->
                  <li
                    :class="{ active: speedMode === 'instant' }"
                    @click="handleCommand('set-speed-mode', 'instant')"
                  >
                    瞬时速度
                  </li>
                  <li
                    :class="{ active: speedMode === 'average' }"
                    @click="handleCommand('set-speed-mode', 'average')"
                  >
                    平均速度
                  </li>
                  <li class="divider" />
                  <!-- 视图设置 -->
                  <li
                    :class="{ active: hideCompleted }"
                    @click="toggleHideCompleted"
                  >
                    隐藏已完成任务
                  </li>
                  <li class="divider" />
                  <!-- 排序设置 -->
                  <li
                    :class="{ active: sortOrder === 'asc' }"
                    @click="setSortOrder('asc')"
                  >
                    最先添加靠前
                  </li>
                  <li
                    :class="{ active: sortOrder === 'desc' }"
                    @click="setSortOrder('desc')"
                  >
                    最后添加靠前
                  </li>
                  <li class="divider" />
                  <!-- 上传设置 -->
                  <li @click="handleCommand('set-concurrency')">设置并发数</li>
                  <li
                    :class="{ active: isGlobalOverwrite }"
                    @click="handleCommand('toggle-overwrite-all')"
                  >
                    覆盖所有同名文件
                  </li>
                  <li class="divider" />
                  <!-- 批量操作 -->
                  <li @click="handleCommand('retry-all')">重试所有失败任务</li>
                  <li @click="handleCommand('clear-finished')">
                    清除已完成任务
                  </li>
                </ul>
              </el-popover>

              <!-- Tooltip for Collapse/Expand Icon -->
              <el-tooltip
                :content="isCollapsed ? '展开' : '收起'"
                placement="bottom"
              >
                <span class="icon-wrapper" @click="emit('toggle-collapse')">
                  <el-icon class="action-icon">
                    <component :is="isCollapsed ? ArrowUp : ArrowDown" />
                  </el-icon>
                </span>
              </el-tooltip>
            </div>
          </div>

          <div class="collapsible-content">
            <div class="panel-body">
              <div v-if="processedQueue.length === 0" class="empty-queue">
                <span v-if="queue.length > 0">所有任务已完成</span>
                <span v-else>没有上传任务</span>
              </div>
              <TransitionGroup name="list" tag="div">
                <!-- [核心修改] v-for 循环现在使用计算属性 processedQueue -->
                <UploadItemComponent
                  v-for="item in processedQueue"
                  :key="item.id"
                  :item="item"
                  :speed-mode="speedMode"
                  @retry-item="emit('retry-item', $event)"
                  @remove-item="emit('remove-item', $event)"
                  @resolve-conflict="
                    (itemId, strategy) =>
                      emit('resolve-conflict', itemId, strategy)
                  "
                />
              </TransitionGroup>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { UploadItem } from "@/api/sys-file/type";
import {
  Close,
  MoreFilled,
  ArrowUp,
  ArrowDown,
  Plus
} from "@element-plus/icons-vue";
import UploadItemComponent from "./UploadItem.vue";

const props = defineProps<{
  visible: boolean;
  isCollapsed: boolean;
  queue: UploadItem[];
  speedMode: "instant" | "average";
  // [新增 Prop] 接收全局覆盖状态
  isGlobalOverwrite: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "toggle-collapse"): void;
  (e: "add-files"): void;
  (e: "retry-item", itemId: number): void;
  (e: "remove-item", itemId: number): void;
  (
    e: "resolve-conflict",
    itemId: number,
    strategy: "overwrite" | "rename"
  ): void;
  (e: "global-command", command: string, value?: any): void;
}>();

// --- 新增本地状态 ---
const isMoreActionsPopoverVisible = ref(false);
/**
 * @description: 是否隐藏已完成（成功或取消）的任务
 */
const hideCompleted = ref(false);
/**
 * @description: 任务列表的排序顺序, 'asc' - 正序 (id小在前), 'desc' - 倒序 (id大在前)
 */
const sortOrder = ref<"asc" | "desc">("asc");
// ---

const activeUploadsCount = computed(
  () =>
    props.queue.filter(item =>
      ["uploading", "pending", "processing"].includes(item.status)
    ).length
);

/**
 * @description: [核心新增] 一个计算属性，根据“隐藏”和“排序”选项来处理原始队列
 */
const processedQueue = computed(() => {
  let queue = [...props.queue]; // 创建一个副本以防修改 props

  // 1. 根据 "隐藏已完成" 过滤
  if (hideCompleted.value) {
    queue = queue.filter(
      item => !["success", "canceled"].includes(item.status)
    );
  }

  // 2. 根据排序顺序排序
  if (sortOrder.value === "desc") {
    // id 越大越新，所以倒序就是 id 降序
    queue.sort((a, b) => b.id - a.id);
  } else {
    // 默认是 'asc'，id 越小越旧，所以正序就是 id 升序
    queue.sort((a, b) => a.id - b.id);
  }

  return queue;
});

/**
 * @description: 切换“隐藏已完成”状态
 */
const toggleHideCompleted = () => {
  hideCompleted.value = !hideCompleted.value;
  isMoreActionsPopoverVisible.value = false;
};

/**
 * @description: 设置排序顺序
 */
const setSortOrder = (order: "asc" | "desc") => {
  sortOrder.value = order;
  isMoreActionsPopoverVisible.value = false;
};

/**
 * @description: 处理来自菜单的全局命令
 */
const handleCommand = (command: string, value?: any) => {
  // [修改] 为覆盖选项创建一个新的命令
  if (command === "toggle-overwrite-all") {
    emit("global-command", "set-overwrite-all", !props.isGlobalOverwrite);
  } else {
    emit("global-command", command, value);
  }
  isMoreActionsPopoverVisible.value = false;
};
</script>

<style>
/* 全局样式保持不变 */
.upload-panel-popover.el-popover {
  padding: 8px 0 !important;
  z-index: 2060 !important;
  box-shadow:
    0 5px 5px -3px rgba(0, 0, 0, 0.2),
    0 8px 10px 1px rgba(0, 0, 0, 0.14),
    0 3px 14px 2px rgba(0, 0, 0, 0.12) !important;
  border: none !important;
  border-radius: 8px !important;
}

.dropdown-scale-enter-active,
.dropdown-scale-leave-active {
  transition:
    transform 0.25s ease,
    opacity 0.2s ease;
  transform-origin: top right;
}

.dropdown-scale-enter-from,
.dropdown-scale-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>

<style scoped>
.popover-menu {
  list-style: none;
  margin: 0;
  padding: 0;
  user-select: none;
}
.popover-menu li {
  display: flex; /* 改为 flex 布局 */
  align-items: center; /* 垂直居中 */
  padding: 8px 24px 8px 32px; /* 调整 padding 为勾选图标留出空间 */
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}
.popover-menu li:hover {
  background-color: #f5f7fa;
}

.popover-menu li.active {
  color: var(--el-color-primary);
  font-weight: 500;
}
.popover-menu li.active::before {
  content: "✓";
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  font-weight: bold;
}

.popover-menu li.divider {
  height: 1px;
  padding: 0;
  margin: 8px 0;
  background-color: #e9e9eb;
  cursor: default;
}
.popover-menu li.divider:hover {
  background-color: #e9e9eb;
}

.icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* Scoped 样式保持不变 */
.list-enter-active,
.list-leave-active {
  transition: all 0.4s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
.list-leave-active {
  position: absolute;
  width: calc(100% - 16px);
}
.list-move {
  transition: transform 0.4s ease;
}

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
  width: 420px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow:
    0 6px 16px -8px rgba(0, 0, 0, 0.08),
    0 9px 28px 0 rgba(0, 0, 0, 0.05),
    0 12px 48px 16px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  z-index: 2000;
  color: #303133;
  transition:
    max-height 0.3s ease-in-out,
    height 0.3s ease-in-out;
  overflow: hidden;
  max-height: 500px;
}

.upload-progress-panel.is-collapsed {
  max-height: 53px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 500;
  flex-shrink: 0;
  height: 53px;
  box-sizing: border-box;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}
.action-icon {
  color: #909399;
  font-size: 16px;
  transition: color 0.2s;
}
.icon-wrapper:hover .action-icon {
  color: var(--el-color-primary);
}

.collapsible-content {
  overflow: hidden;
  transition: opacity 0.3s ease-in-out;
}
.is-collapsed .collapsible-content {
  opacity: 0;
}

.panel-body {
  padding: 8px;
  overflow-y: auto;
  flex: 1;
  height: calc(500px - 53px);
  max-height: calc(500px - 53px);
}

.empty-queue {
  text-align: center;
  padding: 40px 0;
  color: #909399;
  font-size: 14px;
}
</style>
