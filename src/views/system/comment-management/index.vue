<script setup lang="ts">
import { ref } from "vue";
import { useCommentManagement } from "./utils/hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ImportExportDialog from "./components/ImportExportDialog.vue";
import EditCommentDialog from "./components/EditCommentDialog.vue";

import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Refresh from "@iconify-icons/ep/refresh";
import Search from "@iconify-icons/ri/search-line";
import StarFill from "@iconify-icons/ri/star-fill";
import Star from "@iconify-icons/ri/star-line";
import ChatLine from "@iconify-icons/ri/chat-1-line";
import Upload from "@iconify-icons/ep/upload";

defineOptions({
  name: "CommentManagement"
});

const formRef = ref();
const tableRef = ref();
const importExportDialogVisible = ref(false);

const {
  form,
  loading,
  columns,
  dataList,
  pagination,
  loadingConfig,
  selectedIds,
  statusOptions,
  editDialogVisible,
  editingComment,
  onSizeChange,
  onCurrentChange,
  onSearch,
  resetForm,
  handlePinUpdate,
  handleDelete,
  handleBatchDelete,
  handleEdit,
  handleEditSuccess,
  handleReply,
  handleSelectionChange
} = useCommentManagement();

function onFullscreen() {
  tableRef.value?.setAdaptive();
}

// 打开导入导出对话框
function openImportExportDialog() {
  importExportDialogVisible.value = true;
}

// 导入导出成功后刷新列表
function onImportExportSuccess() {
  onSearch();
}
</script>

<template>
  <div class="main">
    <!-- 搜索表单 -->
    <el-form
      ref="formRef"
      :inline="true"
      :model="form"
      class="search-form bg-bg_color w-full pl-8 pt-[12px] overflow-auto"
    >
      <el-form-item label="昵称：" prop="nickname">
        <el-input
          v-model="form.nickname"
          placeholder="输入昵称搜索"
          clearable
          class="!w-[140px]"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="邮箱：" prop="email">
        <el-input
          v-model="form.email"
          placeholder="输入邮箱搜索"
          clearable
          class="!w-[180px]"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="来源路径：" prop="target_path">
        <el-input
          v-model="form.target_path"
          placeholder="输入路径搜索"
          clearable
          class="!w-[180px]"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="IP地址：" prop="ip_address">
        <el-input
          v-model="form.ip_address"
          placeholder="输入IP搜索"
          clearable
          class="!w-[140px]"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="内容：" prop="content">
        <el-input
          v-model="form.content"
          placeholder="输入内容搜索"
          clearable
          class="!w-[180px]"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="状态：" prop="status">
        <el-select
          v-model="form.status"
          placeholder="状态筛选"
          clearable
          class="!w-[120px]"
        >
          <el-option
            v-for="item in statusOptions.filter(s => s.value !== undefined)"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          >
            <span class="status-option">
              <span
                class="status-dot"
                :style="{ backgroundColor: item.color }"
              />
              <span>{{ item.label }}</span>
            </span>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item class="search-buttons">
        <el-button
          v-ripple
          type="primary"
          :icon="useRenderIcon(Search)"
          :loading="loading"
          @click="onSearch"
        >
          搜索
        </el-button>
        <el-button
          v-ripple
          :icon="useRenderIcon(Refresh)"
          @click="resetForm(formRef)"
        >
          重置
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 表格区域 -->
    <PureTableBar
      title="评论管理"
      :columns="columns"
      :tableRef="tableRef?.getTableRef()"
      class="table-bar"
      @refresh="onSearch"
      @fullscreen="onFullscreen"
    >
      <template #title>
        <div class="table-title">
          <span class="title-text">评论管理</span>
          <span class="title-desc">
            管理站点评论，支持审核、编辑、回复和置顶功能
          </span>
        </div>
      </template>

      <template #buttons>
        <el-button
          v-ripple
          type="primary"
          :icon="useRenderIcon(Upload)"
          @click="openImportExportDialog"
        >
          导入/导出
        </el-button>
        <el-button
          v-if="selectedIds.length > 0"
          v-ripple
          type="danger"
          :icon="useRenderIcon(Delete)"
          @click="handleBatchDelete"
        >
          批量删除 ({{ selectedIds.length }})
        </el-button>
      </template>

      <template v-slot="{ dynamicColumns }">
        <pure-table
          ref="tableRef"
          adaptive
          :adaptiveConfig="{ offsetBottom: 108 }"
          align-whole="center"
          row-key="id"
          table-layout="fixed"
          :loading-config="loadingConfig"
          :loading="loading"
          :data="dataList"
          :columns="dynamicColumns"
          :pagination="pagination"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
          @selection-change="handleSelectionChange"
          @page-size-change="onSizeChange"
          @page-current-change="onCurrentChange"
        >
          <template #operation="{ row }">
            <div class="operation-btns">
              <!-- 置顶/取消置顶 -->
              <el-tooltip
                :content="row.pinned_at ? '取消置顶' : '置顶评论'"
                placement="top"
              >
                <el-button
                  v-ripple
                  :type="row.pinned_at ? 'warning' : 'default'"
                  size="small"
                  :icon="useRenderIcon(row.pinned_at ? StarFill : Star)"
                  @click="handlePinUpdate(row, !row.pinned_at)"
                />
              </el-tooltip>

              <!-- 编辑 -->
              <el-tooltip content="编辑" placement="top">
                <el-button
                  v-ripple
                  type="primary"
                  size="small"
                  :icon="useRenderIcon(EditPen)"
                  @click="handleEdit(row)"
                />
              </el-tooltip>

              <!-- 回复 -->
              <el-tooltip
                :content="row.is_anonymous ? '匿名评论无法回复' : '回复'"
                placement="top"
              >
                <el-button
                  v-ripple
                  type="success"
                  size="small"
                  :icon="useRenderIcon(ChatLine)"
                  :disabled="row.is_anonymous"
                  @click="handleReply(row)"
                />
              </el-tooltip>

              <!-- 删除 -->
              <el-tooltip content="删除" placement="top">
                <el-button
                  v-ripple
                  type="danger"
                  size="small"
                  :icon="useRenderIcon(Delete)"
                  @click="handleDelete(row)"
                />
              </el-tooltip>
            </div>
          </template>
        </pure-table>
      </template>
    </PureTableBar>

    <!-- 导入导出对话框 -->
    <ImportExportDialog
      v-model="importExportDialogVisible"
      :selected-ids="selectedIds"
      @success="onImportExportSuccess"
    />

    <!-- 编辑评论对话框 -->
    <EditCommentDialog
      v-model="editDialogVisible"
      :comment="editingComment"
      @success="handleEditSuccess"
    />
  </div>
</template>

<style lang="scss" scoped>
.main {
  margin: 24px;
}

// 搜索表单
.search-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 16px;
  border: var(--style-border);
  border-radius: 12px;

  :deep(.search-buttons) {
    margin-left: auto;
    margin-right: 16px;
  }
}

// 表格公共样式已移至 @/style/table-bar.scss

// 响应式调整
@media (max-width: 768px) {
  .main {
    margin: 10px;
  }

  .search-form {
    padding: 12px !important;
  }
}
</style>
