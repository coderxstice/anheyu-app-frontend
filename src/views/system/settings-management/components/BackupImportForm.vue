<!--
 * @Description: 备份&导入表单组件
 * @Author: 安知鱼
 * @Date: 2025-01-05
-->
<template>
  <div class="backup-import-form">
    <!-- 提示信息 -->
    <el-alert type="info" :closable="false" show-icon class="tips-alert">
      <template #title>
        <span>
          配置备份功能会保存数据库中的设置项。恢复或导入配置后，建议刷新页面以查看最新配置。
        </span>
      </template>
    </el-alert>

    <!-- 导入导出区域 -->
    <div class="section">
      <h3 class="section-title">
        <el-icon><Document /></el-icon>
        导入 & 导出
      </h3>
      <div class="section-description">
        导出当前系统配置为 JSON 文件，或导入配置文件恢复设置。
      </div>

      <div class="action-row">
        <el-tooltip content="将当前数据库配置导出为 JSON 文件" placement="top">
          <el-button
            type="primary"
            :icon="Upload"
            :loading="exporting"
            @click="handleExport"
          >
            导出配置
          </el-button>
        </el-tooltip>
        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :show-file-list="false"
          accept=".json"
          :on-change="handleFileChange"
          :disabled="importing"
        >
          <el-tooltip content="从 JSON 文件导入配置到数据库" placement="top">
            <el-button type="success" :icon="Download" :loading="importing">
              导入配置
            </el-button>
          </el-tooltip>
        </el-upload>
      </div>
    </div>

    <!-- 备份管理区域 -->
    <div class="section">
      <div class="section-header-row">
        <div>
          <h3 class="section-title">
            <el-icon><FolderOpened /></el-icon>
            备份管理
            <el-tag
              v-if="backupList.length > 0"
              size="small"
              type="info"
              class="backup-count"
            >
              {{ backupList.length }} 个备份
            </el-tag>
          </h3>
          <div class="section-description">
            管理系统配置备份，支持手动创建备份、恢复备份和清理旧备份。
          </div>
        </div>
        <el-tooltip content="刷新备份列表" placement="top">
          <el-button
            :icon="Refresh"
            circle
            size="small"
            :loading="loading"
            @click="fetchBackups"
          />
        </el-tooltip>
      </div>

      <!-- 创建备份 -->
      <div class="backup-create">
        <el-input
          v-model="backupDescription"
          placeholder="备份描述（可选，例如：升级前备份）"
          clearable
          style="width: 320px"
          @keyup.enter="handleCreateBackup"
        />
        <el-button
          type="primary"
          :icon="Plus"
          :loading="creating"
          @click="handleCreateBackup"
        >
          创建备份
        </el-button>
      </div>

      <!-- 备份列表 -->
      <div class="backup-list">
        <el-table
          v-loading="loading"
          :data="backupList"
          stripe
          :empty-text="
            loading ? '加载中...' : '暂无备份记录，点击「创建备份」开始'
          "
        >
          <el-table-column label="文件名" prop="filename" min-width="220">
            <template #default="{ row }">
              <div class="filename-cell">
                <el-icon class="file-icon"><Document /></el-icon>
                <span class="filename-text">{{ row.filename }}</span>
                <el-tag v-if="row.is_auto" size="small" type="warning">
                  自动
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="描述" prop="description" min-width="160">
            <template #default="{ row }">
              <span v-if="row.description" class="description-text">
                {{ row.description }}
              </span>
              <span v-else class="text-muted">无描述</span>
            </template>
          </el-table-column>
          <el-table-column
            label="文件大小"
            prop="size"
            width="100"
            align="center"
          >
            <template #default="{ row }">
              <span class="size-text">{{ formatFileSize(row.size) }}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="创建时间"
            prop="created_at"
            width="170"
            align="center"
          >
            <template #default="{ row }">
              <span class="time-text">{{ formatTime(row.created_at) }}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="操作"
            width="160"
            fixed="right"
            align="center"
          >
            <template #default="{ row }">
              <el-tooltip content="恢复此备份" placement="top">
                <el-button
                  type="primary"
                  size="small"
                  :icon="RefreshRight"
                  link
                  @click="handleRestore(row)"
                >
                  恢复
                </el-button>
              </el-tooltip>
              <el-tooltip content="删除此备份" placement="top">
                <el-button
                  type="danger"
                  size="small"
                  :icon="Delete"
                  link
                  @click="handleDelete(row)"
                >
                  删除
                </el-button>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 清理旧备份 -->
      <div class="backup-clean">
        <span class="clean-label">清理旧备份，保留最近</span>
        <el-input-number
          v-model="keepCount"
          :min="1"
          :max="100"
          size="small"
          :disabled="backupList.length === 0"
        />
        <span class="clean-label">份</span>
        <el-tooltip
          :content="
            backupList.length <= keepCount
              ? `当前只有 ${backupList.length} 个备份，无需清理`
              : `将删除 ${backupList.length - keepCount} 个旧备份`
          "
          placement="top"
        >
          <el-button
            type="warning"
            size="small"
            :icon="Delete"
            :loading="cleaning"
            :disabled="backupList.length <= keepCount"
            @click="handleClean"
          >
            执行清理
          </el-button>
        </el-tooltip>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  Document,
  FolderOpened,
  Upload,
  Download,
  Plus,
  Delete,
  Refresh,
  RefreshRight
} from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox, type UploadFile } from "element-plus";
import {
  exportConfig,
  importConfig,
  listBackups,
  createBackup,
  restoreBackup,
  deleteBackup,
  cleanOldBackups,
  type BackupInfo
} from "@/api/config";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

// 状态
const loading = ref(false);
const creating = ref(false);
const cleaning = ref(false);
const exporting = ref(false);
const importing = ref(false);
const backupList = ref<BackupInfo[]>([]);
const backupDescription = ref("");
const keepCount = ref(5);

// 获取备份列表
const fetchBackups = async () => {
  loading.value = true;
  try {
    const res = await listBackups();
    backupList.value = res.data || [];
  } catch (error: unknown) {
    console.error("获取备份列表失败:", error);
    ElMessage.error("获取备份列表失败，请检查网络连接");
  } finally {
    loading.value = false;
  }
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// 格式化时间
const formatTime = (timeStr: string): string => {
  const date = new Date(timeStr);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

// 导出配置
const handleExport = async () => {
  exporting.value = true;
  try {
    const blob = await exportConfig();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `anheyu-settings-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    ElMessage.success("配置导出成功");
  } catch (error: unknown) {
    console.error("导出配置失败:", error);
    ElMessage.error("导出配置失败，请稍后重试");
  } finally {
    exporting.value = false;
  }
};

// 导入配置文件变更处理
const handleFileChange = async (uploadFile: UploadFile) => {
  if (!uploadFile.raw) return;

  try {
    await ElMessageBox.confirm(
      `<p>导入配置将覆盖数据库中的系统设置。</p>
       <p style="margin-top: 8px;">系统会在导入前<strong>自动备份</strong>当前配置。</p>
       <p style="color: var(--el-color-warning); margin-top: 8px;">
         <strong>注意：</strong>导入成功后页面将自动刷新以应用新配置。
       </p>`,
      "确认导入配置",
      {
        confirmButtonText: "确定导入",
        cancelButtonText: "取消",
        type: "warning",
        dangerouslyUseHTMLString: true
      }
    );

    importing.value = true;

    // 导入前自动备份当前配置
    try {
      await createBackup("导入配置前自动备份");
      console.info("✅ 导入前自动备份成功");
    } catch (backupError) {
      console.warn("⚠️ 导入前自动备份失败:", backupError);
      // 备份失败不阻止导入，但给用户提示
      ElMessage.warning("自动备份失败，将继续导入配置");
    }

    await importConfig(uploadFile.raw);

    // 刷新备份列表
    await fetchBackups();

    // 清除本地缓存，确保使用服务器最新数据
    const siteConfigStore = useSiteConfigStore();
    siteConfigStore.clearCache();

    ElMessage({
      type: "success",
      message: "配置导入成功！页面将在 2 秒后刷新...",
      duration: 2000
    });

    // 延迟刷新页面，让用户看到提示
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  } catch (error: unknown) {
    if (error !== "cancel") {
      console.error("导入配置失败:", error);
      ElMessage.error("导入配置失败，请检查文件格式是否正确");
    }
  } finally {
    importing.value = false;
  }
};

// 创建备份
const handleCreateBackup = async () => {
  creating.value = true;
  try {
    await createBackup(backupDescription.value);
    ElMessage.success("备份创建成功");
    backupDescription.value = "";
    await fetchBackups();
  } catch (error: unknown) {
    console.error("创建备份失败:", error);
    ElMessage.error("创建备份失败，请稍后重试");
  } finally {
    creating.value = false;
  }
};

// 恢复备份
const handleRestore = async (backup: BackupInfo) => {
  try {
    await ElMessageBox.confirm(
      `<p>确定要恢复备份 <strong>"${backup.filename}"</strong> 吗？</p>
       <p style="margin-top: 8px;">系统会在恢复前自动创建当前配置的备份。</p>
       <p style="color: var(--el-color-warning); margin-top: 8px;">
         <strong>注意：</strong>恢复成功后页面将自动刷新以应用配置。
       </p>`,
      "确认恢复备份",
      {
        confirmButtonText: "确定恢复",
        cancelButtonText: "取消",
        type: "warning",
        dangerouslyUseHTMLString: true
      }
    );

    await restoreBackup(backup.filename);

    // 清除本地缓存，确保使用服务器最新数据
    const siteConfigStore = useSiteConfigStore();
    siteConfigStore.clearCache();

    ElMessage({
      type: "success",
      message: "备份恢复成功！页面将在 2 秒后刷新...",
      duration: 2000
    });

    // 延迟刷新页面，让用户看到提示
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  } catch (error: unknown) {
    if (error !== "cancel") {
      console.error("恢复备份失败:", error);
      ElMessage.error("恢复备份失败，请稍后重试");
    }
  }
};

// 删除备份
const handleDelete = async (backup: BackupInfo) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除备份 "${backup.filename}" 吗？<br/>此操作不可恢复。`,
      "确认删除",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "error",
        dangerouslyUseHTMLString: true
      }
    );

    await deleteBackup(backup.filename);
    ElMessage.success("备份删除成功");
    await fetchBackups();
  } catch (error: unknown) {
    if (error !== "cancel") {
      console.error("删除备份失败:", error);
      ElMessage.error("删除备份失败，请稍后重试");
    }
  }
};

// 清理旧备份
const handleClean = async () => {
  const deleteCount = backupList.value.length - keepCount.value;
  if (deleteCount <= 0) {
    ElMessage.info("当前备份数量未超过保留限制，无需清理");
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要清理旧备份吗？<br/>将删除 <strong>${deleteCount}</strong> 个旧备份，只保留最近 <strong>${keepCount.value}</strong> 份。`,
      "确认清理",
      {
        confirmButtonText: "确定清理",
        cancelButtonText: "取消",
        type: "warning",
        dangerouslyUseHTMLString: true
      }
    );

    cleaning.value = true;
    await cleanOldBackups(keepCount.value);
    ElMessage.success(`清理成功，已删除 ${deleteCount} 个旧备份`);
    await fetchBackups();
  } catch (error: unknown) {
    if (error !== "cancel") {
      console.error("清理备份失败:", error);
      ElMessage.error("清理备份失败，请稍后重试");
    }
  } finally {
    cleaning.value = false;
  }
};

onMounted(() => {
  fetchBackups();
});
</script>

<style scoped lang="scss">
.backup-import-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.tips-alert {
  :deep(.el-alert__content) {
    font-size: 13px;
  }
}

.section {
  padding: 24px;
  background: var(--el-fill-color-lighter);
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  }
}

.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);

  .el-icon {
    font-size: 18px;
    color: var(--el-color-primary);
  }

  .backup-count {
    margin-left: 8px;
    font-weight: 500;
  }
}

.section-description {
  margin-bottom: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.action-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.backup-create {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.backup-list {
  margin-bottom: 16px;

  :deep(.el-table) {
    border-radius: 8px;
    overflow: hidden;

    .el-table__empty-text {
      line-height: 60px;
      color: var(--el-text-color-secondary);
    }
  }
}

.filename-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .file-icon {
    color: var(--el-color-primary);
    flex-shrink: 0;
  }

  .filename-text {
    word-break: break-all;
  }

  .el-tag {
    margin-left: 4px;
    flex-shrink: 0;
  }
}

.description-text {
  color: var(--el-text-color-regular);
}

.size-text,
.time-text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.text-muted {
  color: var(--el-text-color-placeholder);
  font-style: italic;
  font-size: 13px;
}

.backup-clean {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  flex-wrap: wrap;
}

.clean-label {
  font-size: 14px;
  color: var(--el-text-color-regular);
}

// 响应式适配
@media (max-width: 768px) {
  .section {
    padding: 16px;
  }

  .backup-create {
    flex-direction: column;
    align-items: stretch;

    :deep(.el-input) {
      width: 100% !important;
    }
  }

  .backup-clean {
    flex-wrap: wrap;
    gap: 12px;
  }

  .section-header-row {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
