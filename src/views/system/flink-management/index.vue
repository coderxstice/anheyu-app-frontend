<script setup lang="ts">
import { ref } from "vue";
import { useFlinkManagement } from "./utils/hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import LinkDialog from "./components/LinkDialog.vue";
import CategoryTagManager from "./components/CategoryTagManager.vue";
import ImportDialog from "./components/ImportDialog.vue";

import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Refresh from "@iconify-icons/ep/refresh";
import AddFill from "@iconify-icons/ri/add-circle-line";
import Search from "@iconify-icons/ri/search-line";
import Upload from "@iconify-icons/ep/upload";
import Download from "@iconify-icons/ep/download";
import Check from "@iconify-icons/ep/check";
import Close from "@iconify-icons/ep/close";
import Setting from "@iconify-icons/ep/setting";
import Monitor from "@iconify-icons/ep/monitor";

defineOptions({
  name: "FlinkManagement"
});

const formRef = ref();
const tableRef = ref();

const {
  form,
  loading,
  columns,
  dataList,
  pagination,
  loadingConfig,
  categories,
  tags,
  statusOptions,
  healthCheckRunning,
  onSizeChange,
  onCurrentChange,
  onSearch,
  resetForm,
  handleDelete,
  handleReview,
  handleExport,
  handleHealthCheck,
  handleSelectionChange
} = useFlinkManagement();

// 抽屉状态
const drawer = ref({
  visible: false,
  isEdit: false,
  data: null as any
});

// 分类标签管理器
const manager = ref({
  visible: false
});

// 导入对话框
const importDialog = ref({
  visible: false
});

function handleCreate() {
  drawer.value.isEdit = false;
  drawer.value.data = null;
  drawer.value.visible = true;
}

function handleEdit(row: any) {
  drawer.value.isEdit = true;
  drawer.value.data = row;
  drawer.value.visible = true;
}

function handleManage() {
  manager.value.visible = true;
}

function handleImport() {
  importDialog.value.visible = true;
}

function onFullscreen() {
  tableRef.value?.setAdaptive();
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
      <el-form-item label="关键词：" prop="name">
        <el-input
          v-model="form.name"
          placeholder="搜索网站名称"
          clearable
          class="!w-[180px]"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="网址：" prop="url">
        <el-input
          v-model="form.url"
          placeholder="搜索网站网址"
          clearable
          class="!w-[180px]"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="状态：" prop="status">
        <el-select
          v-model="form.status"
          placeholder="全部状态"
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
      <el-form-item label="分类：" prop="category_id">
        <el-select
          v-model="form.category_id"
          placeholder="全部分类"
          clearable
          class="!w-[120px]"
        >
          <el-option
            v-for="category in categories"
            :key="category.id"
            :label="category.name"
            :value="category.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="标签：" prop="tag_id">
        <el-select
          v-model="form.tag_id"
          placeholder="全部标签"
          clearable
          class="!w-[120px]"
        >
          <el-option
            v-for="tag in tags"
            :key="tag.id"
            :label="tag.name"
            :value="tag.id"
          />
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
      title="友链管理"
      :columns="columns"
      :tableRef="tableRef?.getTableRef()"
      class="table-bar"
      @refresh="onSearch"
      @fullscreen="onFullscreen"
    >
      <template #buttons>
        <el-button
          v-ripple
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="handleCreate"
        >
          新建友链
        </el-button>
        <el-button
          v-ripple
          :icon="useRenderIcon(Setting)"
          @click="handleManage"
        >
          管理分类标签
        </el-button>
        <el-button v-ripple :icon="useRenderIcon(Upload)" @click="handleImport">
          批量导入
        </el-button>
        <el-button
          v-ripple
          :icon="useRenderIcon(Download)"
          @click="handleExport"
        >
          导出友链
        </el-button>
        <el-button
          v-ripple
          :icon="useRenderIcon(Monitor)"
          :loading="healthCheckRunning"
          :disabled="healthCheckRunning"
          @click="handleHealthCheck"
        >
          {{ healthCheckRunning ? "检查中..." : "健康检查" }}
        </el-button>
      </template>

      <template v-slot="{ dynamicColumns }">
        <pure-table
          ref="tableRef"
          adaptive
          :adaptiveConfig="{ offsetBottom: 108 }"
          align-whole="center"
          row-key="id"
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
          @selection-change="handleSelectionChange"
          @page-size-change="onSizeChange"
          @page-current-change="onCurrentChange"
        >
          <template #operation="{ row }">
            <div class="operation-btns">
              <!-- 待审核的特殊操作 -->
              <template v-if="row.status === 'PENDING'">
                <el-button
                  v-ripple
                  type="success"
                  size="small"
                  :icon="useRenderIcon(Check)"
                  @click="handleReview(row, 'APPROVED')"
                >
                  通过
                </el-button>
                <el-button
                  v-ripple
                  type="danger"
                  size="small"
                  :icon="useRenderIcon(Close)"
                  @click="handleReview(row, 'REJECTED')"
                >
                  拒绝
                </el-button>
              </template>

              <!-- 编辑按钮 -->
              <el-button
                v-ripple
                type="primary"
                size="small"
                :icon="useRenderIcon(EditPen)"
                @click="handleEdit(row)"
              >
                编辑
              </el-button>

              <!-- 删除按钮 -->
              <el-popconfirm
                :title="`确定要删除友链「${row.name}」吗？`"
                @confirm="handleDelete(row)"
              >
                <template #reference>
                  <el-button
                    v-ripple
                    type="danger"
                    size="small"
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

    <!-- 新建/编辑对话框 -->
    <LinkDialog
      v-model="drawer.visible"
      :is-edit-mode="drawer.isEdit"
      :data="drawer.data"
      @success="onSearch"
    />

    <!-- 分类和标签管理器 -->
    <CategoryTagManager v-model="manager.visible" @refresh="onSearch" />

    <!-- 批量导入对话框 -->
    <ImportDialog v-model="importDialog.visible" @success="onSearch" />
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
