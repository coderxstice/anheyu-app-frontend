<script setup lang="ts">
import { ref, h } from "vue";
import { useAlbum } from "./utils/hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { addDialog } from "@/components/AnDialog";

import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Refresh from "@iconify-icons/ep/refresh";
import AddFill from "@iconify-icons/ri/add-circle-line";
import Search from "@iconify-icons/ri/search-line";
import Upload from "@iconify-icons/ep/upload";
import Download from "@iconify-icons/ep/download";
import Setting from "@iconify-icons/ep/setting";
import DeleteBatch from "@iconify-icons/ep/delete-filled";
import View from "@iconify-icons/ep/view";
import CategoryManage from "./category-manage.vue";

defineOptions({
  name: "AlbumManagement"
});

const formRef = ref();
const tableRef = ref();
const {
  form,
  categories,
  loading,
  columns,
  dataList,
  pagination,
  selectedRows,
  loadingConfig,
  onSizeChange,
  onCurrentChange,
  onSearch,
  resetForm,
  openDialog,
  handleDelete,
  handleBatchDelete,
  handleSelectionChange,
  handleExport,
  openImportDialog,
  loadCategories
} = useAlbum();

function onFullscreen() {
  // 重置表格高度
  tableRef.value.setAdaptive();
}

// 打开分类管理对话框
function openCategoryManage() {
  addDialog({
    title: "相册分类管理",
    width: "700px",
    draggable: true,
    fullscreenIcon: true,
    closeOnClickModal: false,
    hideFooter: true,
    contentRenderer: () =>
      h(CategoryManage, {
        onRefresh: () => {
          loadCategories();
        }
      })
  });
}

// 打开相册页面
function openAlbumPage() {
  window.open("/album", "_blank");
}
</script>

<template>
  <div class="main">
    <el-form
      ref="formRef"
      :inline="true"
      :model="form"
      class="search-form bg-bg_color w-full pl-8 pt-[12px] overflow-auto"
    >
      <el-form-item label="分类：" prop="categoryId">
        <el-select
          v-model="form.categoryId"
          placeholder="请选择分类"
          clearable
          class="!w-[180px]"
        >
          <el-option
            v-for="category in categories"
            :key="category.id"
            :label="category.name"
            :value="category.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="上传时间：" prop="created_at">
        <el-date-picker
          v-model="form.created_at"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          format="YYYY/MM/DD hh:mm:ss"
          value-format="YYYY/MM/DD hh:mm:ss"
        />
      </el-form-item>
      <el-form-item label="排序：" prop="sort">
        <el-select
          v-model="form.sort"
          placeholder="请选择"
          clearable
          class="!w-[180px]"
        >
          <el-option label="按排序号" value="display_order_asc" />
          <el-option label="最新创建" value="created_at_desc" />
          <el-option label="最早创建" value="created_at_asc" />
          <el-option label="热度排序" value="view_count_desc" />
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

    <PureTableBar
      title="相册图片管理"
      :columns="columns"
      :tableRef="tableRef?.getTableRef()"
      storageKey="album-management"
      class="table-bar"
      @refresh="onSearch"
      @fullscreen="onFullscreen"
    >
      <template #title>
        <div class="table-title">
          <span class="title-text">相册图片管理</span>
          <span class="title-desc">
            管理相册图片，支持分类、标签、批量导入导出等功能
          </span>
        </div>
      </template>
      <template #buttons>
        <div class="button-group">
          <el-button
            v-ripple
            type="primary"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog()"
          >
            <span class="hidden md:inline">新增图片</span>
            <span class="md:hidden">新增</span>
          </el-button>
          <el-button
            v-ripple
            type="success"
            :icon="useRenderIcon(Upload)"
            @click="openImportDialog()"
          >
            <span class="hidden md:inline">导入相册</span>
            <span class="md:hidden">导入</span>
          </el-button>
          <el-button
            v-ripple
            type="warning"
            :icon="useRenderIcon(Download)"
            @click="handleExport()"
          >
            <span class="hidden md:inline">导出相册</span>
            <span class="md:hidden">导出</span>
          </el-button>
          <el-popconfirm
            :title="`确认批量删除选中的 ${selectedRows.length} 张图片吗？`"
            @confirm="handleBatchDelete"
          >
            <template #reference>
              <el-button
                v-ripple
                type="danger"
                :icon="useRenderIcon(DeleteBatch)"
                :disabled="selectedRows.length === 0"
              >
                <span class="hidden md:inline"
                  >批量删除{{
                    selectedRows.length > 0 ? `(${selectedRows.length})` : ""
                  }}</span
                >
                <span class="md:hidden"
                  >删除{{
                    selectedRows.length > 0 ? `(${selectedRows.length})` : ""
                  }}</span
                >
              </el-button>
            </template>
          </el-popconfirm>
          <el-button
            v-ripple
            :icon="useRenderIcon(Setting)"
            @click="openCategoryManage()"
          >
            <span class="hidden md:inline">分类管理</span>
            <span class="md:hidden">分类</span>
          </el-button>
          <el-button
            v-ripple
            type="info"
            :icon="useRenderIcon(View)"
            @click="openAlbumPage()"
          >
            <span class="hidden md:inline">查看相册</span>
            <span class="md:hidden">查看</span>
          </el-button>
        </div>
      </template>
      <template v-slot="{ size, dynamicColumns }">
        <pure-table
          ref="tableRef"
          adaptive
          :adaptiveConfig="{ offsetBottom: 130 }"
          align-whole="center"
          row-key="id"
          showOverflowTooltip
          table-layout="auto"
          :loading-config="loadingConfig"
          :loading="loading"
          :data="dataList"
          :columns="dynamicColumns"
          :pagination="pagination"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
          @page-size-change="onSizeChange"
          @page-current-change="onCurrentChange"
          @selection-change="handleSelectionChange"
        >
          <template #operation="{ row }">
            <div class="flex flex-col gap-1 sm:flex-row sm:gap-2">
              <el-button
                class="w-full reset-margin sm:w-auto"
                type="primary"
                :size="size"
                :icon="useRenderIcon(EditPen)"
                @click="openDialog('修改', row)"
              >
                修改
              </el-button>
              <el-popconfirm
                :title="`是否确认删除相册图片这条数据`"
                @confirm="handleDelete(row)"
              >
                <template #reference>
                  <el-button
                    v-ripple
                    class="w-full reset-margin sm:w-auto"
                    type="danger"
                    :size="size"
                    :icon="useRenderIcon(Delete)"
                  >
                    删除
                  </el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>
        </pure-table>
      </template>
    </PureTableBar>
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-table__inner-wrapper::before) {
  height: 0;
}

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

// 表格操作列移动端适配
:deep(.el-table) {
  @media (width <= 768px) {
    font-size: 13px;

    .el-button--small {
      padding: 4px 8px;
      font-size: 13px;
    }

    // 图片缩略图在移动端缩小
    img {
      max-width: 60px !important;
    }
  }
}

// 按钮组样式
.button-group {
  display: flex;
  gap: 12px;
  flex-wrap: nowrap;

  @media (width <= 768px) {
    gap: 6px;
    flex-wrap: wrap;

    :deep(.el-button) {
      flex: 1;
      min-width: 70px;
      max-width: 90px;
      margin: 0;
      padding: 6px 8px;
      font-size: 13px;

      span {
        white-space: nowrap;
      }
    }
  }

  @media (width > 768px) {
    :deep(.el-button) {
      min-width: 110px;
    }
  }
}
</style>
