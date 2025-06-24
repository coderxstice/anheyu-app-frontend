<template>
  <div class="file-breadcrumb-wrapper" @click="switchToEditMode">
    <div v-if="!isEditing" class="file-breadcrumb">
      <el-tooltip content="返回根目录" placement="bottom">
        <el-icon class="home-icon" @click.stop="goToPath('/')"
          ><HomeFilled
        /></el-icon>
      </el-tooltip>
      <el-breadcrumb :separator-icon="ArrowRight">
        <el-breadcrumb-item
          v-for="(segment, index) in pathSegments"
          :key="segment.path"
        >
          <span
            v-if="index === 0"
            class="is-link"
            @click.stop="goToPath(segment.path)"
          >
            {{ segment.name }}
          </span>
          <el-dropdown
            v-else
            trigger="click"
            placement="bottom-start"
            @command="handleCommand"
            @visible-change="isDropdownVisible = $event"
          >
            <span class="el-dropdown-link" @click.stop>
              {{ segment.name }}
              <IconifyIconOnline
                icon="raphael:arrowdown"
                class="el-icon--right"
              />
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :command="{ action: 'enter', segment }">
                  <IconifyIconOffline :icon="Back" class="dropdown-icon" />进入
                </el-dropdown-item>
                <el-dropdown-item :command="{ action: 'download', segment }">
                  <IconifyIconOffline
                    :icon="Download"
                    class="dropdown-icon"
                  />下载
                </el-dropdown-item>
                <el-dropdown-item :command="{ action: 'share', segment }">
                  <IconifyIconOffline :icon="Share" class="dropdown-icon" />分享
                </el-dropdown-item>
                <el-dropdown-item :command="{ action: 'rename', segment }">
                  <IconifyIconOffline
                    :icon="EditPen"
                    class="dropdown-icon"
                  />重命名
                </el-dropdown-item>
                <el-dropdown-item :command="{ action: 'copy', segment }">
                  <IconifyIconOffline
                    :icon="CopyDocument"
                    class="dropdown-icon"
                  />复制
                </el-dropdown-item>
                <el-dropdown-item :command="{ action: 'link', segment }">
                  <IconifyIconOffline
                    :icon="Link"
                    class="dropdown-icon"
                  />获取直链
                </el-dropdown-item>
                <el-dropdown-item
                  :command="{ action: 'tags', segment }"
                  divided
                >
                  <IconifyIconOffline
                    :icon="PriceTag"
                    class="dropdown-icon"
                  />标签
                </el-dropdown-item>
                <el-dropdown-item :command="{ action: 'organize', segment }">
                  <IconifyIconOffline
                    :icon="FolderOpened"
                    class="dropdown-icon"
                  />整理
                </el-dropdown-item>
                <el-dropdown-item :command="{ action: 'more', segment }">
                  <IconifyIconOffline
                    :icon="Setting"
                    class="dropdown-icon"
                  />更多操作
                </el-dropdown-item>
                <el-dropdown-item
                  :command="{ action: 'info', segment }"
                  divided
                >
                  <IconifyIconOffline
                    :icon="InfoFilled"
                    class="dropdown-icon"
                  />详细信息
                </el-dropdown-item>
                <el-dropdown-item
                  :command="{ action: 'delete', segment }"
                  class="danger-item"
                >
                  <IconifyIconOffline
                    :icon="Delete"
                    class="dropdown-icon"
                  />删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div v-else class="input-mode">
      <el-tooltip content="返回根目录" placement="bottom">
        <el-icon class="home-icon" @click.stop="goToPath('/')"
          ><HomeFilled
        /></el-icon>
      </el-tooltip>
      <el-input
        ref="pathInputRef"
        v-model="pathInput"
        placeholder="请输入绝对路径后按 Enter"
        @blur="handleSubmit"
        @keydown.enter.prevent="handleSubmit"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from "vue";
import { useFileStore } from "@/store/modules/fileStore";
import { ElMessage, ElMessageBox } from "element-plus";

// --- 图标引入 ---
import { HomeFilled, ArrowRight } from "@element-plus/icons-vue";
import Back from "@iconify-icons/ep/back";
import Download from "@iconify-icons/ep/download";
import Share from "@iconify-icons/ep/share";
import EditPen from "@iconify-icons/ep/edit-pen";
import CopyDocument from "@iconify-icons/ep/copy-document";
import Link from "@iconify-icons/ep/link";
import PriceTag from "@iconify-icons/ep/price-tag";
import FolderOpened from "@iconify-icons/ep/folder-opened";
import Setting from "@iconify-icons/ep/setting";
import InfoFilled from "@iconify-icons/ep/info-filled";
import Delete from "@iconify-icons/ep/delete";

const fileStore = useFileStore();
// ... (剩余的 script 内容完全保持不变) ...
const pathSegments = computed(() => fileStore.pathSegments);
const isEditing = ref(false);
const pathInput = ref("");
const pathInputRef = ref<HTMLInputElement | null>(null);
const isDropdownVisible = ref(false);
const switchToEditMode = () => {
  if (isDropdownVisible.value) return;
  isEditing.value = true;
  pathInput.value = fileStore.path;
  nextTick(() => {
    pathInputRef.value?.focus();
  });
};
const goToPath = (path: string) => {
  fileStore.loadFiles(path);
};
const handleSubmit = () => {
  const finalPath = pathInput.value.startsWith("/")
    ? pathInput.value
    : `/${pathInput.value}`;
  goToPath(finalPath);
  isEditing.value = false;
};
type CommandAction =
  | "enter"
  | "download"
  | "share"
  | "rename"
  | "copy"
  | "link"
  | "tags"
  | "organize"
  | "more"
  | "info"
  | "delete";
interface CommandPayload {
  action: CommandAction;
  segment: { name: string; path: string };
}
const handleCommand = (command: CommandPayload) => {
  const { action, segment } = command;
  ElMessage.info(`你点击了 [${segment.name}] 的 [${action}] 操作`);
  switch (action) {
    case "enter":
      goToPath(segment.path);
      break;
    case "delete":
      ElMessageBox.confirm(
        `确定要删除文件夹 "${segment.name}" 吗？此操作不可恢复。`,
        "警告",
        {
          confirmButtonText: "确定删除",
          cancelButtonText: "取消",
          type: "warning"
        }
      )
        .then(() => {
          ElMessage.success(`文件夹 "${segment.name}" 已删除`);
        })
        .catch(() => {
          ElMessage.info("已取消删除");
        });
      break;
    default:
      break;
  }
};
</script>

<style scoped lang="scss">
.dropdown-icon {
  margin-right: 8px;
}

:root {
  --style-border: 1px solid #e0e0e0;
}
.file-breadcrumb-wrapper {
  padding: 0 24px;
  background-color: #fff;
  border: var(--style-border);
  border-radius: 12px;
  overflow: hidden;
  min-height: 52px;
  display: flex;
  align-items: center;
  cursor: text;
}
.file-breadcrumb {
  display: flex;
  align-items: center;
  width: 100%;
}
.home-icon {
  cursor: pointer;
  margin-right: 12px;
  font-size: 16px;
  color: #606266;
}
.home-icon:hover {
  color: var(--el-color-primary);
}
.is-link {
  font-weight: normal;
  cursor: pointer;
  height: 35px;
  line-height: 2;
  padding: 4px;
  display: flex;
}
.is-link:hover {
  color: var(--el-color-primary);
}
.el-breadcrumb__item:first-child .is-link {
  color: #303133;
  font-weight: 600;
}
.el-dropdown-link {
  cursor: pointer;
  color: #303133;
  font-weight: 600;
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
  height: 35px;
  line-height: 2;
  padding: 4px;
  display: flex;
}
.el-breadcrumb__item:hover :deep(.el-breadcrumb__inner) {
  background-color: #f5f7fa;
  color: var(--el-color-primary);
  border-radius: 6px;
  overflow: hidden;
}
.el-dropdown-link .el-icon--right {
  margin-left: 5px;
  // 为在线图标设置一个合适的尺寸
  font-size: 12px;
  display: inline-flex;
  align-items: center;
}
.danger-item {
  color: var(--el-color-error);
}
.danger-item:hover {
  color: #fff !important;
  background-color: var(--el-color-error) !important;
}
.danger-item .dropdown-icon {
  color: var(--el-color-error);
}
.danger-item:hover .dropdown-icon {
  color: #fff !important;
}

.el-dropdown-link:hover {
  background-color: #f5f7fa !important;
}
.input-mode {
  width: 100%;
  display: flex;
  align-items: center;
  :deep(.el-input__wrapper) {
    box-shadow: none !important;
    padding: 4px !important;
    &:hover {
      box-shadow: none !important;
    }
  }
}
:deep(.el-breadcrumb__item) {
  height: 35px;
}
</style>
