<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { usePolicy } from "./utils/hook";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { IconifyIconOffline } from "@/components/ReIcon";
import { createPolicy, type StoragePolicy } from "@/api/sys-policy";
import { message } from "@/utils/message";

import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Refresh from "@iconify-icons/ep/refresh";
import AddFill from "@iconify-icons/ri/add-circle-line";
import ServerIcon from "@iconify-icons/ri/server-line";
import CloudIcon from "@iconify-icons/ri/cloud-line";
// 导入新的 OneDrive 创建表单
import OneDriveCreateForm from "./components/onedrive/CreateForm.vue";

defineOptions({
  name: "StoragePolicyManagement"
});

const router = useRouter();
const {
  loading,
  dataList,
  pagination,
  onSearch,
  handleCreate: handleSimpleCreate, // 重命名旧的创建方法
  handleEdit,
  handleDelete,
  onSizeChange,
  onCurrentChange
} = usePolicy(router);

// 创建流程控制
const chooseTypeDialogVisible = ref(false);
const oneDriveCreateDialogVisible = ref(false);
const oneDriveFormRef = ref();
const isCreating = ref(false);

const storageTypes = [
  { type: "local", name: "本机存储", icon: ServerIcon },
  { type: "onedrive", name: "OneDrive", icon: CloudIcon }
] as const;

// 根据类型分发创建流程
function triggerCreateFlow(type: "local" | "onedrive", typeName: string) {
  chooseTypeDialogVisible.value = false;
  if (type === "onedrive") {
    // 打开 OneDrive 专属创建弹窗
    oneDriveCreateDialogVisible.value = true;
  } else {
    // 其他类型使用旧的简单创建流程
    handleSimpleCreate(type, typeName);
  }
}

// 处理 OneDrive 表单提交
async function handleOneDriveCreateSubmit(payload: Partial<StoragePolicy>) {
  try {
    isCreating.value = true;
    const { data: newPolicy } = await createPolicy(payload);
    message(`策略 ${payload.name} 创建成功，请继续配置。`, { type: "success" });
    oneDriveCreateDialogVisible.value = false;
    // 跳转到编辑页面进行授权
    router.push({ name: "StoragePolicyEdit", params: { id: newPolicy.id } });
  } catch (e) {
    console.error(e);
  } finally {
    isCreating.value = false;
  }
}

// 点击弹窗的“创建”按钮
function confirmOneDriveCreate() {
  oneDriveFormRef.value?.submitForm();
}

const typeIconMap = {
  local: ServerIcon,
  onedrive: CloudIcon
};

// 用于将 flag 转换为可读的文本
const flagDisplayMap = {
  article_image: "文章图片默认",
  comment_image: "评论图片默认"
};

function getFlagDisplayName(flag: string): string {
  return flagDisplayMap[flag] || "未知标志";
}
</script>

<template>
  <div class="card-list-main">
    <div>
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
              <IconifyIconOffline :icon="typeIconMap[item.type] || CloudIcon" />
            </el-icon>
            <div class="policy-details">
              <h4 class="policy-name">
                {{ item.name }}
                <el-tag
                  v-if="item.flag"
                  type="warning"
                  size="small"
                  effect="dark"
                  style="margin-left: 8px"
                >
                  {{ getFlagDisplayName(item.flag) }}
                </el-tag>
              </h4>
              <div class="policy-tags">
                <el-tag
                  v-if="item.type === 'onedrive'"
                  :type="item.access_key ? 'success' : 'warning'"
                  size="small"
                >
                  {{ item.access_key ? "已授权" : "未授权" }}
                </el-tag>
                <el-tag type="info" size="small">{{ item.type }}</el-tag>
              </div>
            </div>
          </div>

          <div class="card-overlay">
            <div class="card-actions">
              <el-tooltip content="修改" :show-arrow="false">
                <el-button
                  :icon="useRenderIcon(EditPen)"
                  circle
                  @click="handleEdit(item)"
                />
              </el-tooltip>

              <el-popconfirm
                v-if="
                  !item.flag &&
                  !(item.type === 'local' && item.virtual_path === '/')
                "
                :title="`确认删除存储策略 ${item.name} 吗?`"
                @confirm="handleDelete(item)"
              >
                <template #reference>
                  <el-button
                    :icon="useRenderIcon(Delete)"
                    circle
                    type="danger"
                  />
                </template>
              </el-popconfirm>
            </div>
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
        :background="true"
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
          @click="triggerCreateFlow(st.type, st.name)"
        >
          <el-icon :size="24">
            <IconifyIconOffline :icon="st.icon" />
          </el-icon>
          <span>{{ st.name }}</span>
        </div>
      </div>
    </el-dialog>

    <el-dialog
      v-model="oneDriveCreateDialogVisible"
      title="添加 OneDrive 存储策略"
      width="650px"
      :close-on-click-modal="false"
    >
      <OneDriveCreateForm
        ref="oneDriveFormRef"
        @submit="handleOneDriveCreateSubmit"
      />
      <template #footer>
        <el-button @click="oneDriveCreateDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="isCreating"
          @click="confirmOneDriveCreate"
        >
          创建
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  min-height: 150px;
  padding: 4px;
}

.card-list-main {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: calc(100% - 48px);
  padding: 16px;
  overflow: hidden;
  background-color: var(--el-bg-color);
  border-radius: 12px;
}

.card-list-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.card-item {
  position: relative;
  height: 130px;
  overflow: hidden;
  cursor: pointer;
  background-color: var(--el-bg-color-page);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgb(0 0 0 / 5%);
  transition: all 0.3s ease;
}

.pagination-container {
  margin-top: 20px;
}

.add-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  border: 2px dashed var(--el-border-color);

  p {
    margin-top: 8px;
    font-size: 1rem;
  }

  &:hover {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary);
  }
}

.policy-card {
  display: flex;
  align-items: center;
  padding: 20px;

  .policy-content {
    display: flex;
    gap: 16px;
    align-items: center;
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
    display: flex;
    align-items: center;
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .policy-tags {
    display: flex;
    gap: 8px;
  }

  .card-overlay {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: rgba(var(--el-bg-color-rgb), 0.7);
    backdrop-filter: blur(2px);
    opacity: 0;
    transition: opacity 0.4s ease;
  }

  .card-actions {
    display: flex;
    gap: 10px;
    transition: transform 0.4s ease;
    transform: translateY(20px);

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

.storage-type-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.type-item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  transition: all 0.2s ease-in-out;

  &:hover {
    color: var(--anzhiyu-white);
    background-color: var(--anzhiyu-theme);
    border-color: var(--el-color-primary);
  }
}

@media screen and (width <= 768px) {
  .card-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}
</style>
