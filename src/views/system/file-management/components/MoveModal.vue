<template>
  <el-dialog
    v-model="localVisible"
    :title="modalTitle"
    width="60%"
    top="10vh"
    :close-on-click-modal="false"
    class="move-modal"
    @closed="handleModalClosed"
  >
    <div
      v-if="localVisible"
      v-loading="isInitializing"
      class="move-modal-content"
    >
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
          :current-node-key="currentNodeKey"
          @node-click="handleTreeNodeClick"
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
          />
        </div>

        <div
          ref="fileContentAreaRef"
          v-loading="listLoading"
          class="file-content-area"
          @scroll="handleScroll"
        >
          <component
            :is="activeViewComponent"
            :files="filesInModal"
            :loading="false"
            :selected-file-ids="new Set()"
            :disabled-file-ids="idsForActionSet"
            :is-more-loading="isMoreLoading"
            @navigate-to="navigateToPath"
          />
        </div>
      </el-main>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="target-info" :title="targetPathBreadcrumb">
          <template v-if="currentTargetFolderInfo">
            {{ props.mode === "move" ? "移动到:" : "复制到:" }}
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
            :loading="isSubmitting"
            :disabled="!currentTargetFolderInfo || isSubmitting"
            @click="confirmAction"
          >
            {{ confirmButtonText }}
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import type { PropType } from "vue";
import { ElMessage, ElTree } from "element-plus";
import { Folder, Loading } from "@element-plus/icons-vue";

import FileToolbar from "./FileToolbar.vue";
import FileBreadcrumb from "./FileBreadcrumb.vue";
import FileListView from "./FileListView.vue";
import FileGridView from "./FileGridView.vue";
import {
  fetchFilesByPathApi,
  moveFilesApi,
  copyFilesApi
} from "@/api/sys-file/sys-file";
import {
  type FileItem,
  FileType,
  type ParentInfo,
  type Pagination,
  type FileListResponse
} from "@/api/sys-file/type";
import { extractLogicalPathFromUri, getParentPath } from "@/utils/fileUtils";

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
  isLeaf: boolean;
  disabled: boolean;
}
type Resolve = (data: TreeNode[]) => void;
type ApiData = FileListResponse["data"];

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  itemsForAction: { type: Array as PropType<FileItem[]>, default: () => [] },
  mode: { type: String as PropType<"move" | "copy">, required: true }
});

const emit = defineEmits(["update:modelValue", "success"]);

const modalTitle = computed(() =>
  props.mode === "move" ? "移动到" : "复制到"
);
const confirmButtonText = computed(() =>
  props.mode === "move" ? "确定移动" : "确定复制"
);
const localVisible = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});

const folderTreeRef = ref<InstanceType<typeof ElTree> | null>(null);
const fileContentAreaRef = ref<HTMLElement | null>(null);
const isInitializing = ref(false);
const listLoading = ref(false);
const isMoreLoading = ref(false);
const isSubmitting = ref(false);
const currentPath = ref("/");
const currentNodeKey = ref("");
const currentTargetFolderInfo = ref<ParentInfo | null>(null);
const filesInModal = ref<FileItem[]>([]);
const modalViewMode = ref<"list" | "grid">("list");
const modalSortKey = ref<SortKey>("name_asc");
const modalPageSize = ref(50);
const paginationInfo = ref<Pagination>({
  page: 1,
  page_size: 50,
  total: 0,
  total_page: 1
});
const idsForActionSet = computed(
  () => new Set(props.itemsForAction.map(item => item.id))
);
const dataCache = new Map<string, ApiData>();

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const targetPathBreadcrumb = computed(() => {
  if (!currentTargetFolderInfo.value?.path) return "我的文件";
  const path = currentTargetFolderInfo.value.path;
  if (path === "/") return "我的文件";
  const segments = path.split("/").filter(Boolean);
  // 删除数组中的前两个特定元素 "anzhiyu:" 和 "my"
  if (segments.length > 0 && segments[0] === "anzhiyu:") {
    segments.shift();
  }
  if (segments.length > 0 && segments[0] === "my") {
    segments.shift();
  }
  console.log("targetPathBreadcrumb segments:", segments);
  return `我的文件 / ${segments.join(" / ")}`;
});

watch(localVisible, async isVisible => {
  if (isVisible) {
    isInitializing.value = true;
    dataCache.clear();
    await nextTick();
    const itemToLocate = props.itemsForAction[0];
    const initialPath = extractLogicalPathFromUri(
      itemToLocate ? getParentPath(itemToLocate.path) : "/"
    );
    await expandTreeToPath(initialPath);
    await navigateToPath(initialPath);
    isInitializing.value = false;
  }
});

const expandTreeToPath = async (path: string) => {
  const treeInstance = folderTreeRef.value;
  if (!treeInstance || !path || path === "/") {
    const rootNode = treeInstance?.getNode("root");
    if (rootNode) rootNode.expand();
    treeInstance?.setCurrentKey("root");
    return;
  }
  const pathSegments = path.split("/").filter(Boolean);
  let currentNode: any | null = treeInstance.getNode("root");
  if (currentNode) currentNode.expand();

  for (const segment of pathSegments) {
    if (!currentNode) break;
    if (!currentNode.loaded) await currentNode.loadData();
    currentNode.expand();
    const childNode = currentNode.childNodes.find(
      (node: any) => node.data.name === segment
    );
    currentNode = childNode || null;
  }
  if (currentNode) {
    treeInstance.setCurrentKey(currentNode.data.id);
  }
};

const loadNode = async (node: any, resolve: Resolve) => {
  if (node.level === 0) {
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
  const path = extractLogicalPathFromUri(node.data.path);

  if (dataCache.has(path)) {
    const cachedData = dataCache.get(path)!;
    const subFolders = cachedData.files
      .filter(item => item.type === FileType.Dir)
      .map(folder => ({
        id: folder.id,
        name: folder.name,
        path: extractLogicalPathFromUri(folder.path),
        isLeaf: idsForActionSet.value.has(folder.id),
        disabled: idsForActionSet.value.has(folder.id)
      }));
    return resolve(subFolders);
  }

  const minLoadingTime = 200;
  const apiCallPromise = fetchFilesByPathApi(path, "type", "desc", 1, 9999);
  const minDelayPromise = sleep(minLoadingTime);

  try {
    const [res] = await Promise.all([apiCallPromise, minDelayPromise]);
    if (res.code === 200 && res.data) {
      dataCache.set(path, res.data);
      const subFolders = res.data.files
        .filter(item => item.type === FileType.Dir)
        .map(folder => ({
          id: folder.id,
          name: folder.name,
          path: extractLogicalPathFromUri(folder.path),
          isLeaf: idsForActionSet.value.has(folder.id),
          disabled: idsForActionSet.value.has(folder.id)
        }));
      resolve(subFolders);
    } else {
      resolve([]);
    }
  } catch (error) {
    await minDelayPromise;
    console.error("Failed to lazy load tree node:", error);
    resolve([]);
  }
};

const navigateToPath = async (path: string, page = 1) => {
  const logicalPath = extractLogicalPathFromUri(path);
  if (page > 1 && isMoreLoading.value) return;
  if (page === 1 && listLoading.value) return;

  if (page > 1) isMoreLoading.value = true;
  else listLoading.value = true;

  if (page === 1) currentPath.value = logicalPath;

  try {
    const [orderBy, orderDirection] = modalSortKey.value.split("_");
    const res = await fetchFilesByPathApi(
      logicalPath,
      orderBy,
      orderDirection,
      page,
      modalPageSize.value
    );

    if (res.code === 200 && res.data) {
      if (page === 1) {
        dataCache.set(logicalPath, res.data);
      }
      processApiResponse(res.data, page);
    }
  } catch (error) {
    console.error("Navigation failed:", error);
    ElMessage.error("加载文件列表失败");
  } finally {
    if (page > 1) isMoreLoading.value = false;
    else listLoading.value = false;
  }
};

const processApiResponse = (data: ApiData, page: number) => {
  if (page === 1) filesInModal.value = data.files;
  else filesInModal.value.push(...data.files);

  if (data.pagination) paginationInfo.value = data.pagination;

  const parentInfo = data.parent;
  if (parentInfo) {
    if (extractLogicalPathFromUri(parentInfo.path) === "/")
      parentInfo.name = "我的文件";
    currentTargetFolderInfo.value = parentInfo;
    currentNodeKey.value = parentInfo.id || "root";
  }
};

let throttleTimer: number | null = null;
const handleScroll = () => {
  if (throttleTimer) return;
  throttleTimer = window.setTimeout(() => {
    const el = fileContentAreaRef.value;
    if (!el) return;
    const canLoadMore =
      paginationInfo.value.page < paginationInfo.value.total_page;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    if (
      isAtBottom &&
      canLoadMore &&
      !isMoreLoading.value &&
      !listLoading.value
    ) {
      navigateToPath(currentPath.value, paginationInfo.value.page + 1);
    }
    throttleTimer = null;
  }, 200);
};

const handleTreeNodeClick = (data: TreeNode) => {
  if (data.disabled) return;
  navigateToPath(data.path, 1);
};

const confirmAction = async () => {
  if (!currentTargetFolderInfo.value) {
    ElMessage.warning("无法确定目标文件夹，请重试。");
    return;
  }
  const destinationID = currentTargetFolderInfo.value.id;
  const sourceIDs = props.itemsForAction.map(item => item.id);
  if (sourceIDs.includes(destinationID)) {
    ElMessage.error(
      `不能将项目${props.mode === "move" ? "移动" : "复制"}到其自身。`
    );
    return;
  }
  const movingFolder = props.itemsForAction.find(
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
    const actionText = props.mode === "move" ? "移动" : "复制";
    ElMessage.error(
      `不能将文件夹 "${movingFolder.name}" ${actionText}到其子目录中。`
    );
    return;
  }
  isSubmitting.value = true;
  try {
    const apiToCall = props.mode === "move" ? moveFilesApi : copyFilesApi;
    const res = await apiToCall(sourceIDs, destinationID);
    if (res.code === 200) {
      emit("success", { mode: props.mode });
      localVisible.value = false;
    } else {
      ElMessage.error(res.message || `${modalTitle.value}失败`);
    }
  } catch (error) {
    console.error(`${modalTitle.value} request failed:`, error);
  } finally {
    isSubmitting.value = false;
  }
};

const handleModalClosed = () => {
  filesInModal.value = [];
  currentPath.value = "/";
  paginationInfo.value = { page: 1, page_size: 50, total: 0, total_page: 1 };
};

const handleModalRefresh = () => {
  dataCache.delete(currentPath.value);
  navigateToPath(currentPath.value, 1);
};

const handleSetModalViewMode = (mode: "list" | "grid") => {
  modalViewMode.value = mode;
};

const handleSetModalPageSize = (size: number) => {
  modalPageSize.value = size;
  dataCache.clear(); // 页面大小变化，缓存失效
  navigateToPath(currentPath.value, 1);
};

const handleSetModalSortKey = (key: SortKey) => {
  modalSortKey.value = key;
  dataCache.clear(); // 排序变化，缓存失效
  navigateToPath(currentPath.value, 1);
};

const activeViewComponent = computed(() =>
  modalViewMode.value === "list" ? FileListView : FileGridView
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
      position: relative;
      margin-top: 10px;
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
.load-more-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 15px 0;
  color: #909399;
  font-size: 14px;
  .el-icon {
    margin-right: 8px;
  }
}
</style>
