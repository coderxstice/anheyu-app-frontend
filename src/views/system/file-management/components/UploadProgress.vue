<template>
  <div v-if="show" class="upload-progress-panel">
    <div class="panel-header">
      <span>上传队列 ({{ queue.length }})</span>
      <div class="header-actions">
        <el-icon @click="clearFinished"><Delete /></el-icon>
        <el-icon @click="show = false"><Close /></el-icon>
      </div>
    </div>
    <div class="panel-body">
      <div v-if="queue.length === 0" class="empty-queue">没有上传任务</div>
      <div v-for="item in queue" :key="item.id" class="upload-item">
        <div class="item-icon">
          <el-icon><Document /></el-icon>
        </div>
        <div class="item-info">
          <div class="item-name">{{ item.name }}</div>
          <el-progress
            :percentage="item.progress"
            :status="item?.status as any"
          />
        </div>
        <div class="item-status">
          <el-icon
            v-if="item.status === 'success'"
            color="var(--el-color-success)"
            ><CircleCheckFilled
          /></el-icon>
          <el-icon v-if="item.status === 'error'" color="var(--el-color-error)"
            ><CircleCloseFilled
          /></el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useFileStore } from "@/store/modules/fileStore";
import {
  Close,
  Delete,
  Document,
  CircleCheckFilled,
  CircleCloseFilled
} from "@element-plus/icons-vue";

const fileStore = useFileStore();

const show = computed({
  get: () => fileStore.showUploadProgress,
  set: val => (fileStore.showUploadProgress = val)
});

const queue = computed(() => fileStore.uploadQueue);

const clearFinished = () => {
  fileStore.clearFinishedUploads();
};
</script>

<style scoped>
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
}
.empty-queue {
  text-align: center;
  padding: 30px 0;
  color: #909399;
}
</style>
