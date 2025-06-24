<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { usePolicy } from "./utils/hook";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { IconifyIconOffline } from "@/components/ReIcon";

import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Refresh from "@iconify-icons/ep/refresh";
import AddFill from "@iconify-icons/ri/add-circle-line";
import ServerIcon from "@iconify-icons/ri/server-line";
import CloudIcon from "@iconify-icons/ri/cloud-line";
// import OssIcon from "@iconify-icons/clarity/storage-solid";

defineOptions({
  name: "StoragePolicyManagement"
});

const router = useRouter(); // 2. 获取 router 实例
// 3. 将 router 实例传入 hook
const {
  loading,
  dataList,
  pagination,
  onSearch,
  handleCreate,
  handleEdit,
  handleDelete,
  onSizeChange,
  onCurrentChange
} = usePolicy(router);

// 4. 控制选择类型弹窗的显示
const chooseTypeDialogVisible = ref(false);

const storageTypes = [
  { type: "local", name: "本机存储", icon: ServerIcon },
  { type: "onedrive", name: "OneDrive", icon: CloudIcon }
] as const;
</script>

<template>
  <div class="card-list-main">
    <div class="card-list-header">
      <div class="left-actions">
        <el-button v-ripple :icon="useRenderIcon(Refresh)" @click="onSearch">
          刷新
        </el-button>
      </div>
    </div>

    <div
      v-loading="loading"
      class="card-grid"
      element-loading-text="正在加载..."
    >
      <div
        v-ripple
        class="card-item add-card"
        @click="chooseTypeDialogVisible = true"
      >
        <el-icon :size="48" color="var(--el-color-primary)">
          <IconifyIconOffline :icon="AddFill" />
        </el-icon>
        <p>添加存储策略</p>
      </div>

      <div
        v-for="item in dataList"
        :key="item.id"
        class="card-item data-card policy-card"
      >
        <div class="policy-content">
          <el-icon :size="40" class="policy-icon">
            <IconifyIconOffline
              :icon="item.type === 'local' ? ServerIcon : CloudIcon"
            />
          </el-icon>
          <div class="policy-details">
            <h4 class="policy-name">{{ item.name }}</h4>
            <div class="policy-tags">
              <el-tag
                :type="item.is_private ? 'danger' : 'success'"
                size="small"
              >
                {{ item.is_private ? "私有" : "公开" }}
              </el-tag>
              <el-tag type="info" size="small">{{ item.type }}</el-tag>
            </div>
          </div>
        </div>

        <div class="card-overlay">
          <div class="card-actions">
            <el-tooltip content="修改">
              <el-button
                :icon="useRenderIcon(EditPen)"
                circle
                @click="handleEdit(item)"
              />
            </el-tooltip>
            <el-popconfirm
              :title="`确认删除存储策略 ${item.name} 吗?`"
              @confirm="handleDelete(item)"
            >
              <template #reference>
                <el-button :icon="useRenderIcon(Delete)" circle type="danger" />
              </template>
            </el-popconfirm>
          </div>
        </div>
      </div>
    </div>

    <div v-if="pagination.total > 0" class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        :background="pagination.background"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="onSizeChange"
        @current-change="onCurrentChange"
      />
    </div>

    <el-dialog
      v-model="chooseTypeDialogVisible"
      title="选择存储方式"
      width="600px"
    >
      <div class="storage-type-grid">
        <div
          v-for="st in storageTypes"
          :key="st.type"
          v-ripple
          class="type-item"
          @click="
            handleCreate(st.type, st.name);
            chooseTypeDialogVisible = false;
          "
        >
          <el-icon :size="24">
            <IconifyIconOffline :icon="st.icon" />
          </el-icon>
          <span>{{ st.name }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  flex: 1;
  padding: 4px;
  min-height: 150px;
}
.card-list-main {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: var(--el-bg-color);
  border-radius: 12px;
  padding: 16px;
}
.card-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-shrink: 0;
}
.card-item {
  position: relative;
  height: 120px;
  border-radius: 12px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  background-color: var(--el-bg-color-page);
}
.add-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 2px dashed var(--el-border-color);
  color: var(--el-text-color-secondary);
  p {
    margin-top: 8px;
    font-size: 1rem;
  }
  &:hover {
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
  }
}
.policy-card {
  padding: 20px;
  .policy-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .policy-icon {
    color: var(--el-text-color-primary);
  }
  .policy-details {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .policy-name {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
  }
  .policy-tags {
    display: flex;
    gap: 8px;
  }
  .card-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(var(--el-bg-color-rgb), 0.7);
    backdrop-filter: blur(2px);
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    transition: opacity 0.4s ease;
  }
  .card-actions {
    display: flex;
    gap: 10px;
    transform: translateY(20px);
    transition: transform 0.4s ease;
    :deep(.el-button span) {
      margin-left: 0 !important;
    }
  }
  &:hover {
    .card-overlay {
      opacity: 1;
    }
    .card-actions {
      transform: translateY(0);
    }
  }
}

// 新增的选择类型弹窗样式
.storage-type-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.type-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  &:hover {
    border-color: var(--el-color-primary);
    background-color: var(--anzhiyu-theme);
    color: var(--anzhiyu-white);
  }
}
</style>
