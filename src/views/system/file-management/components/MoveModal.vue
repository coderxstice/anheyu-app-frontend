<template>
  <el-dialog
    v-model="localVisible"
    title="移动到"
    width="60%"
    top="10vh"
    :close-on-click-modal="false"
    class="move-modal"
    @closed="handleModalClosed"
  >
    <div v-if="localVisible" class="move-modal-content">
      <el-aside width="280px" class="tree-aside">
        <el-tree
          ref="folderTreeRef"
          lazy
          :load="loadNode"
          :props="{
            label: 'name',
            children: 'children',
            isLeaf: 'isLeaf',
            disabled: 'disabled'
          }"
          node-key="id"
          highlight-current
          :expand-on-click-node="false"
          :default-expanded-keys="expandedKeysArray"
          :current-node-key="currentNodeKey"
          @node-click="handleTreeNodeClick"
          @node-expand="handleNodeExpand"
          @node-collapse="handleNodeCollapse"
        >
          <template #default="{ node }">
            <span
              class="custom-tree-node"
              :class="{ 'is-current-path': node.data.path === currentPath }"
            >
              <el-icon><Folder /></el-icon>
              <span class="ml-2">{{ node.label }}</span>
            </span>
          </template>
        </el-tree>
      </el-aside>

      <el-main class="file-browser-main">
        <div class="flex w-full">
          <FileBreadcrumb
            :key="currentPath"
            class="flex-1 mb-2"
            :path="currentPath"
            @navigate="navigateToPath"
          />
          <FileToolbar
            class="mb-2 ml-2"
            :view-mode="modalViewMode"
            :sort-key="modalSortKey"
            :page-size="modalPageSize"
            :has-selection="false"
            :is-simplified="true"
            @refresh="handleModalRefresh"
            @set-view-mode="handleSetModalViewMode"
            @set-page-size="handleSetModalPageSize"
            @set-sort-key="handleSetModalSortKey"
            @select-all="() => {}"
            @clear-selection="() => {}"
            @invert-selection="() => {}"
          />
        </div>

        <div
          v-loading="listLoading"
          class="file-content-area"
          :class="{ 'dim-files': !!currentTargetFolderInfo }"
        >
          <component
            :is="activeViewComponent"
            :files="filesInModal"
            :loading="listLoading"
            :selected-file-ids="new Set()"
            :disabled-file-ids="idsToMoveSet"
            @navigate-to="navigateToPath"
          />
        </div>
      </el-main>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="target-info" :title="targetPathBreadcrumb">
          <template v-if="currentTargetFolderInfo">
            移动到:
            <el-icon class="ml-2 mr-1"><Folder /></el-icon>
            <span class="font-bold target-path-text">{{
              targetPathBreadcrumb
            }}</span>
          </template>
          <template v-else>
            <span class="text-gray-400">请选择一个目标文件夹</span>
          </template>
        </div>
        <div>
          <el-button @click="localVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="isMoving"
            :disabled="!currentTargetFolderInfo || isMoving"
            @click="confirmMove"
          >
            确定移动
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { PropType } from "vue";
import { ElMessage, ElTree } from "element-plus";
import { Folder } from "@element-plus/icons-vue";

// === 新增：导入 FileToolbar ===
import FileToolbar from "./FileToolbar.vue";
import FileBreadcrumb from "./FileBreadcrumb.vue";
import FileListView from "./FileListView.vue";
import FileGridView from "./FileGridView.vue";
import { fetchFilesByPathApi, moveFilesApi } from "@/api/sys-file/sys-file";
import { type FileItem, FileType, type ParentInfo } from "@/api/sys-file/type";
import { extractLogicalPathFromUri } from "@/utils/fileUtils";

// SortKey 类型定义
type SortKey =
  | "name_asc"
  | "name_desc"
  | "size_asc"
  | "size_desc"
  | "updated_at_asc"
  | "updated_at_desc"
  | "created_at_asc"
  | "created_at_desc";

interface TreeNode {
  id: string;
  name: string;
  path: string;
  isLeaf?: boolean;
  disabled?: boolean;
  children?: TreeNode[];
}

interface Tree {
  [key: string]: any;
}
type Resolve = (data: Tree[]) => void;

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  itemsToMove: { type: Array as PropType<FileItem[]>, default: () => [] }
});

const emit = defineEmits(["update:modelValue", "move-success"]);

const localVisible = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});

const folderTreeRef = ref<InstanceType<typeof ElTree> | null>(null);
const filesInModal = ref<FileItem[]>([]);
const listLoading = ref(false);
const currentPath = ref("/");
const currentTargetFolderInfo = ref<
  ParentInfo | { id: string; name: string; path: string } | null
>(null);
const isMoving = ref(false);
const currentNodeKey = ref<string>("");

// === 新增：为弹窗创建独立的视图控制状态 ===
const modalViewMode = ref<"list" | "grid">("list");
const modalSortKey = ref<SortKey>("name_asc");
const modalPageSize = ref(50);

const idsToMoveSet = computed(
  () => new Set(props.itemsToMove.map(item => item.id))
);

const expandedKeys = ref(new Set<string>(["root"]));
const expandedKeysArray = computed(() => Array.from(expandedKeys.value));

const targetPathBreadcrumb = computed(() => {
  if (!currentTargetFolderInfo.value?.path) return "我的文件";
  const path = currentTargetFolderInfo.value.path;
  if (path === "/") return "我的文件";
  const segments = path.split("/").filter(Boolean);
  return `我的文件 / ${segments.join(" / ")}`;
});

// === 修改：navigateToPath 函数现在使用本地的排序和分页状态 ===
const navigateToPath = async (path: string, page = 1) => {
  const logicalPath = extractLogicalPathFromUri(path);
  // 不再检查 currentPath，以允许使用新参数刷新同一路径
  if (listLoading.value) return;

  currentPath.value = logicalPath;
  listLoading.value = true;

  const [orderBy, orderDirection] = modalSortKey.value.split("_");

  try {
    const res = await fetchFilesByPathApi(
      logicalPath,
      orderBy,
      orderDirection,
      page,
      modalPageSize.value // 使用本地分页大小
    );
    if (res.code === 200 && res.data) {
      filesInModal.value = res.data.files;
      const parentInfo = res.data.parent;

      if (parentInfo) {
        // 如果是根目录, API返回的name可能为空, 我们手动修正为"我的文件"用于显示
        if (logicalPath === "/") {
          parentInfo.name = "我的文件";
        }

        parentInfo.path = extractLogicalPathFromUri(parentInfo.path);

        // 这样 currentTargetFolderInfo 中将始终包含真实的ID
        currentTargetFolderInfo.value = parentInfo;
        currentNodeKey.value = parentInfo.id;
      }
    }
  } finally {
    listLoading.value = false;
  }
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const loadNode = async (node: any, resolve: Resolve) => {
  if (node.level === 0) {
    navigateToPath("/");
    return resolve([
      {
        id: "root",
        name: "我的文件",
        path: "/",
        isLeaf: false,
        disabled: false
      }
    ]);
  }

  if (idsToMoveSet.value.has(node.data.id)) {
    return resolve([]);
  }

  const parentPath = extractLogicalPathFromUri(node.data.path);
  const MIN_LOADING_TIME = 200;
  const apiCallPromise = fetchFilesByPathApi(
    parentPath,
    "type",
    "desc",
    1,
    9999
  );
  const minDelayPromise = sleep(MIN_LOADING_TIME);

  try {
    const [res] = await Promise.all([apiCallPromise, minDelayPromise]);
    if (res.code === 200 && res.data?.files) {
      const subFolders = res.data.files
        .filter(item => item.type === FileType.Dir)
        .map(folder => {
          const isDisabled = idsToMoveSet.value.has(folder.id);
          return {
            id: folder.id,
            name: folder.name,
            path: extractLogicalPathFromUri(folder.path),
            isLeaf: isDisabled,
            disabled: isDisabled
          };
        });
      resolve(subFolders);
    } else {
      resolve([]);
    }
  } catch (error) {
    await minDelayPromise;
    console.error("Failed to load tree node:", error);
    resolve([]);
  }
};

watch(localVisible, isVisible => {
  if (isVisible) {
    expandedKeys.value.clear();
    expandedKeys.value.add("root");
  }
});

const handleModalClosed = () => {
  filesInModal.value = [];
};

const handleTreeNodeClick = (data: TreeNode) => {
  if (data.disabled) {
    ElMessage.warning("不能选择正在移动的文件夹作为目标。");
    return;
  }
  navigateToPath(data.path);
};

const handleNodeExpand = (data: TreeNode) => {
  expandedKeys.value.add(data.id);
};

const handleNodeCollapse = (data: TreeNode) => {
  expandedKeys.value.delete(data.id);
};

const confirmMove = async () => {
  if (!currentTargetFolderInfo.value) {
    ElMessage.warning("无法确定目标文件夹，请重试。");
    return;
  }
  const destinationID =
    currentTargetFolderInfo.value.id === "root"
      ? ""
      : currentTargetFolderInfo.value.id;
  const sourceIDs = props.itemsToMove.map(item => item.id);
  if (sourceIDs.includes(destinationID)) {
    ElMessage.error("不能将文件夹移动到其自身。");
    return;
  }
  const movingFolder = props.itemsToMove.find(
    item =>
      item.type === FileType.Dir &&
      currentTargetFolderInfo.value?.path.startsWith(
        item.path + (item.path === "/" ? "" : "/")
      )
  );
  if (
    movingFolder &&
    movingFolder.path !== currentTargetFolderInfo.value?.path
  ) {
    ElMessage.error(`不能将文件夹 "${movingFolder.name}" 移动到其子目录中。`);
    return;
  }

  isMoving.value = true;
  try {
    const res = await moveFilesApi(sourceIDs, destinationID);
    if (res.code === 200) {
      emit("move-success");
      localVisible.value = false;
    } else {
      ElMessage.error(res.message || "移动失败，发生未知错误。");
    }
  } catch (error) {
    console.error("Move request failed:", error);
  } finally {
    isMoving.value = false;
  }
};

// === 新增：处理工具栏事件的函数 ===
const handleModalRefresh = () => {
  navigateToPath(currentPath.value);
};

const handleSetModalViewMode = (mode: "list" | "grid") => {
  modalViewMode.value = mode;
};

const handleSetModalPageSize = (size: number) => {
  modalPageSize.value = size;
  navigateToPath(currentPath.value); // 分页变化，重新获取第一页
};

const handleSetModalSortKey = (key: SortKey) => {
  modalSortKey.value = key;
  navigateToPath(currentPath.value); // 排序变化，重新获取第一页
};

// === 修改：activeViewComponent 现在依赖本地的 modalViewMode ===
const activeViewComponent = computed(() =>
  modalViewMode.value === "list" ? FileListView : FileGridView
);
</script>

<style lang="scss">
/* 样式基本无变化，仅为保持完整性 */
.move-modal {
  .el-dialog__body {
    padding: 10px 20px;
    margin: 0;
  }
  .move-modal-content {
    display: flex;
    height: 60vh;
    border: 1px solid var(--el-border-color-light);
    border-radius: 4px;
  }
  .tree-aside {
    border-right: 1px solid var(--el-border-color-light);
    padding: 10px 5px;
    overflow-y: auto;
    position: relative;
    .el-tree {
      background: transparent;
    }
    .custom-tree-node {
      display: flex;
      align-items: center;
      flex: 1;
      font-size: 14px;
      &.is-current-path {
        color: var(--el-color-primary);
        font-weight: bold;
      }
    }
    .el-tree-node[aria-disabled="true"] > .el-tree-node__content {
      cursor: not-allowed;
      color: #c0c4cc;
      background: transparent !important;
      opacity: 0.7;
    }
  }
  .file-browser-main {
    padding: 10px 15px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    .file-content-area {
      flex: 1;
      overflow-y: auto;
      margin-top: 10px;
      position: relative;
      &.dim-files {
        .file-item[data-type="File"] {
          opacity: 0.35;
          transition: opacity 0.3s ease;
          &:hover {
            opacity: 0.6;
            background-color: #f8fafc;
          }
        }
        .file-item.is-disabled {
          opacity: 0.35;
          cursor: not-allowed;
          color: #a8abb2;
          &:hover {
            background-color: transparent;
          }
          .file-icon {
            color: #c0c4cc;
          }
        }
      }
    }
  }
  .dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    .target-info {
      display: flex;
      align-items: center;
      color: var(--el-text-color-regular);
      font-size: 14px;
      max-width: 70%;
      .target-path-text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
}
</style>
