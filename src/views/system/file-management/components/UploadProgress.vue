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
            <el-tooltip content="关闭" placement="bottom" :show-arrow="false">
              <span class="icon-wrapper" @click="emit('close')">
                <el-icon class="action-icon"><Close /></el-icon>
              </span>
            </el-tooltip>

            <span>上传队列</span>

            <div class="header-actions">
              <!-- Tooltip for Add Icon -->
              <el-tooltip
                content="添加文件"
                placement="bottom"
                :show-arrow="false"
              >
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
                :show-arrow="false"
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
                :show-arrow="false"
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
                <span
                  v-if="
                    queue.length > 0 &&
                    queue.every(item =>
                      ['success', 'canceled'].includes(item.status)
                    )
                  "
                >
                  所有任务已处理完毕
                </span>
                <span v-else-if="queue.length > 0"> 所有活动任务已完成 </span>
                <span v-else> 没有上传任务 </span>
              </div>
              <TransitionGroup name="list" tag="div">
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
  isGlobalOverwrite: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "toggle-collapse"): void;
  (e: "add-files"): void;
  (e: "retry-item", itemId: string): void;
  (e: "remove-item", itemId: string): void;
  (
    e: "resolve-conflict",
    itemId: string,
    strategy: "overwrite" | "rename"
  ): void;
  (e: "global-command", command: string, value?: any): void;
}>();

const isMoreActionsPopoverVisible = ref(false);
/**
 * @description: 是否隐藏已完成（成功或取消）的任务
 */
const hideCompleted = ref(false);
/**
 * @description: 任务列表的排序顺序, 'asc' - 正序 (id小在前), 'desc' - 倒序 (id大在前)
 */
const sortOrder = ref<"asc" | "desc">("asc");
//

const activeUploadsCount = computed(
  () =>
    props.queue.filter(item =>
      ["uploading", "pending", "processing"].includes(item.status)
    ).length
);

/**
 * @description: 一个计算属性，根据“隐藏”和“排序”选项来处理原始队列
 */
const processedQueue = computed(() => {
  let queue = [...props.queue];
  if (hideCompleted.value) {
    queue = queue.filter(
      item => !["success", "canceled"].includes(item.status)
    );
  }

  // 修正：因为 id 现在是字符串，不能直接用减法排序
  queue.sort((a, b) => {
    if (sortOrder.value === "desc") {
      // 字符串比较
      return b.id.localeCompare(a.id);
    }
    // 默认 asc
    return a.id.localeCompare(b.id);
  });

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
  // 为覆盖选项创建一个新的命令
  if (command === "toggle-overwrite-all") {
    emit("global-command", "set-overwrite-all", !props.isGlobalOverwrite);
  } else {
    emit("global-command", command, value);
  }
  isMoreActionsPopoverVisible.value = false;
};
</script>

<style>
.upload-panel-popover.el-popover {
  z-index: 2060 !important;
  padding: 8px 0 !important;
  border: none !important;
  border-radius: 8px !important;
  box-shadow:
    0 5px 5px -3px rgb(0 0 0 / 20%),
    0 8px 10px 1px rgb(0 0 0 / 14%),
    0 3px 14px 2px rgb(0 0 0 / 12%) !important;
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
  padding: 0;
  margin: 0;
  list-style: none;
  user-select: none;
}

.popover-menu li {
  position: relative;
  display: flex; /* 改为 flex 布局 */
  align-items: center; /* 垂直居中 */
  padding: 8px 24px 8px 32px; /* 调整 padding 为勾选图标留出空间 */
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.popover-menu li:hover {
  background-color: var(--anzhiyu-secondbg);
}

.popover-menu li.active {
  font-weight: 500;
  color: var(--anzhiyu-theme);
}

.popover-menu li.active::before {
  position: absolute;
  top: 50%;
  left: 12px;
  font-size: 12px;
  font-weight: bold;
  content: "✓";
  transform: translateY(-50%);
}

.popover-menu li.divider {
  height: 1px;
  padding: 0;
  margin: 8px 0;
  cursor: default;
  background-color: var(--anzhiyu-card-bg-grey);
}

.popover-menu li.divider:hover {
  background-color: var(--anzhiyu-card-bg-grey);
}

.icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

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
  right: 20px;
  bottom: 20px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  width: 420px;
  max-height: 500px;
  overflow: hidden;
  color: var(--anzhiyu-fontcolor);
  background-color: var(--anzhiyu-card-bg);
  border-radius: 12px;
  border: var(--style-border);
  box-shadow: var(--anzhiyu-shadow-border);
  transition:
    max-height 0.3s ease-in-out,
    height 0.3s ease-in-out;
}

.upload-progress-panel.is-collapsed {
  max-height: 53px;
}

.panel-header {
  box-sizing: border-box;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  height: 53px;
  padding: 12px 20px;
  font-weight: 500;
  border-bottom: 1px solid var(--anzhiyu-card-border);
}

.header-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.action-icon {
  font-size: 16px;
  color: var(--anzhiyu-secondtext);
  transition: color 0.2s;
}

.icon-wrapper:hover .action-icon {
  color: var(--anzhiyu-theme);
}

.collapsible-content {
  overflow: hidden;
  transition: opacity 0.3s ease-in-out;
}

.is-collapsed .collapsible-content {
  opacity: 0;
}

.panel-body {
  flex: 1;
  height: calc(500px - 53px);
  max-height: calc(500px - 53px);
  padding: 8px;
  overflow-y: auto;
}

.empty-queue {
  padding: 40px 0;
  font-size: 14px;
  color: var(--anzhiyu-secondtext);
  text-align: center;
}
</style>
