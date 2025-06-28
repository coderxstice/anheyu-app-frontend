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
        <FileBreadcrumb
          :key="currentPath"
          :path="currentPath"
          @navigate="navigateToPath"
        />
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

import FileBreadcrumb from "./FileBreadcrumb.vue";
import FileListView from "./FileListView.vue";
import FileGridView from "./FileGridView.vue";
import { fetchFilesByPathApi, moveFilesApi } from "@/api/sys-file/sys-file";
import { type FileItem, FileType, type ParentInfo } from "@/api/sys-file/type";
import { extractLogicalPathFromUri } from "@/utils/fileUtils";

interface TreeNode {
  id: string;
  name: string;
  path: string;
  isLeaf?: boolean;
  disabled?: boolean;
  children?: TreeNode[];
}

// 定义 el-tree lazy load 需要的类型
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
const viewMode = ref("list");
const currentTargetFolderInfo = ref<
  ParentInfo | { id: string; name: string; path: string } | null
>(null);
const isMoving = ref(false);
const currentNodeKey = ref<string>("");

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

// navigateToPath 现在只负责更新右侧文件列表
const navigateToPath = async (path: string) => {
  const logicalPath = extractLogicalPathFromUri(path);
  if (listLoading.value && currentPath.value === logicalPath) return;

  currentPath.value = logicalPath;
  listLoading.value = true;
  try {
    const res = await fetchFilesByPathApi(logicalPath, "name", "asc", 1, 500);
    if (res.code === 200 && res.data) {
      filesInModal.value = res.data.files;
      const parentInfo =
        logicalPath === "/"
          ? { id: "root", name: "我的文件", path: "/" }
          : res.data.parent;

      if (parentInfo) {
        parentInfo.path = extractLogicalPathFromUri(parentInfo.path);
        currentTargetFolderInfo.value = parentInfo;
        currentNodeKey.value = parentInfo.id;
      }
    }
  } finally {
    listLoading.value = false;
  }
};

// 辅助函数：创建一个延时 Promise
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// el-tree 的 lazy load 方法 (已包含防闪烁处理)
const loadNode = async (node: any, resolve: Resolve) => {
  // 1. 加载根节点
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

  // 2. 如果节点本身是待移动项，则将其视为叶子节点，不可展开
  if (idsToMoveSet.value.has(node.data.id)) {
    return resolve([]);
  }

  // 3. 异步获取当前节点的子文件夹 (防闪烁处理)
  const MIN_LOADING_TIME = 200; // 最小加载时间，单位毫秒

  // 同时开始API请求和计时
  const apiCallPromise = fetchFilesByPathApi(
    extractLogicalPathFromUri(node.data.path),
    "type",
    "desc",
    1,
    9999
  );
  const minDelayPromise = sleep(MIN_LOADING_TIME);

  try {
    // 使用 Promise.all 等待 API 和最小延时都完成
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
    // 即使出错，也最好等待最小延时结束，以保持UI行为一致性
    await minDelayPromise;
    console.error("Failed to load tree node:", error);
    resolve([]);
  }
};

// watch 逻辑简化
watch(localVisible, isVisible => {
  if (isVisible) {
    // 每次打开弹窗时，重置状态
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
  // 点击节点文字时，更新右侧文件列表
  navigateToPath(data.path);
};

// 这两个方法现在用于管理 expandedKeys，以便在重新打开时恢复树的展开状态
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

const activeViewComponent = computed(() =>
  viewMode.value === "list" ? FileListView : FileGridView
);
</script>

<style lang="scss">
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
