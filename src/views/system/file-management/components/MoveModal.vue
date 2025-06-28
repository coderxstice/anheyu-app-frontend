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
      element-loading-text="正在初始化..."
      class="move-modal-content"
    >
      <el-aside width="280px" class="tree-aside">
        <el-tree
          v-if="!isInitializing"
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
          :default-expanded-keys="defaultExpandedKeys"
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
import { Folder } from "@element-plus/icons-vue";

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

// --- 基本计算属性和响应式引用 ---
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
const idsForActionSet = computed(
  () => new Set(props.itemsForAction.map(item => item.id))
);

// --- 组件引用 ---
const folderTreeRef = ref<InstanceType<typeof ElTree> | null>(null);
const fileContentAreaRef = ref<HTMLElement | null>(null);

// --- 状态管理 ---
const isInitializing = ref(false);
const listLoading = ref(false);
const isMoreLoading = ref(false);
const isSubmitting = ref(false);

// --- 数据模型 ---
const currentPath = ref("/");
const currentNodeKey = ref("");
const defaultExpandedKeys = ref<string[]>([]);
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

// --- 核心数据缓存 ---
const dataCache = new Map<string, ApiData>();

// --- 类型兼容的占位数据工厂 ---
const createPlaceholderFileItem = (
  id: string,
  name: string,
  path: string
): FileItem => ({
  id,
  name,
  path,
  type: FileType.Dir,
  size: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  owned: true,
  shared: false,
  permission: null,
  capability: "",
  primary_entity_public_id: ""
});

const createPlaceholderApiData = (childFileItem: FileItem): ApiData => ({
  files: [childFileItem],
  parent: null,
  pagination: { page: 1, page_size: 1, total: 1, total_page: 1 },
  props: {
    order_by_options: ["name", "size", "updated_at", "created_at"],
    order_direction_options: ["asc", "desc"]
  },
  context_hint: "",
  storage_policy: { id: "", name: "", type: "", max_size: 0 },
  view: { view: "list", order: "name", page_size: 50, order_direction: "asc" }
});

// --- 工具函数 ---
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const targetPathBreadcrumb = computed(() => {
  if (!currentTargetFolderInfo.value?.path) return "我的文件";
  const path = extractLogicalPathFromUri(currentTargetFolderInfo.value.path);
  if (path === "/") return "我的文件";
  const segments = path.split("/").filter(Boolean);
  return `我的文件 / ${segments.join(" / ")}`;
});

// --- 初始化逻辑 ---
watch(localVisible, isVisible => {
  if (isVisible) {
    initializeComponent();
  }
});

const initializeComponent = async () => {
  isInitializing.value = true;
  resetState();

  const itemToLocate = props.itemsForAction[0];
  const initialPath = extractLogicalPathFromUri(
    itemToLocate ? getParentPath(itemToLocate.path) : "/"
  );

  // 修正: 在初始化开始时，立即同步 currentPath，确保顶部面包屑正确显示
  currentPath.value = initialPath;

  try {
    const [orderBy, orderDirection] = modalSortKey.value.split("_");
    const res = await fetchFilesByPathApi(
      initialPath,
      orderBy,
      orderDirection,
      1,
      modalPageSize.value
    );

    if (res.code !== 200 || !res.data) {
      ElMessage.error("初始化失败，无法加载目标位置。");
      isInitializing.value = false;
      return;
    }

    const targetData = res.data;
    dataCache.set(initialPath, targetData);

    primeAncestorCaches(targetData);
    processApiResponse(targetData, 1);
    defaultExpandedKeys.value = generatePathKeys(initialPath);
  } catch (error) {
    console.error("Initialization failed:", error);
    ElMessage.error("初始化加载失败！");
  } finally {
    await nextTick();
    isInitializing.value = false;
  }
};

const primeAncestorCaches = (targetData: ApiData) => {
  let childInfo: FileItem | ParentInfo | null = targetData.parent;

  if (!childInfo) return;
  const childLogicalPath = extractLogicalPathFromUri(childInfo.path);
  if (childLogicalPath === "/") return;

  let currentLogicalPathToPrime = getParentPath(childLogicalPath);
  let correctedChildInfo: FileItem = {
    ...childInfo,
    path: childLogicalPath
  } as FileItem;

  while (true) {
    if (!correctedChildInfo) break;

    const placeholderData = createPlaceholderApiData(correctedChildInfo);
    dataCache.set(currentLogicalPathToPrime, placeholderData);

    if (currentLogicalPathToPrime === "/") break;

    const parentLogicalPath = getParentPath(currentLogicalPathToPrime);
    correctedChildInfo = createPlaceholderFileItem(
      currentLogicalPathToPrime,
      currentLogicalPathToPrime.split("/").pop() || "",
      currentLogicalPathToPrime
    );

    currentLogicalPathToPrime = parentLogicalPath;
  }
};

const generatePathKeys = (path: string): string[] => {
  const keys = ["root"];
  const segments = path.split("/").filter(Boolean);
  let currentPath = "";
  for (const segment of segments) {
    currentPath += `/${segment}`;
    keys.push(currentPath);
  }

  if (currentTargetFolderInfo.value?.id) {
    keys.push(currentTargetFolderInfo.value.id);
  }
  return [...new Set(keys)];
};

// --- Tree 和导航逻辑 ---
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

  const path =
    node.data.id === "root" ? "/" : extractLogicalPathFromUri(node.data.path);

  if (dataCache.has(path)) {
    const cachedData = dataCache.get(path)!;
    const subFolders = cachedData.files
      .filter(item => item.type === FileType.Dir)
      .map(folder => ({
        id: folder.id || extractLogicalPathFromUri(folder.path),
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
  if ((page > 1 && isMoreLoading.value) || (page === 1 && listLoading.value)) {
    return;
  }

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
      if (!isInitializing.value) {
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
    if (extractLogicalPathFromUri(parentInfo.path) === "/") {
      parentInfo.name = "我的文件";
    }
    currentTargetFolderInfo.value = parentInfo;
    currentNodeKey.value = parentInfo.id || "root";
  }
};

// --- 事件处理 ---
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
  if (destinationID && sourceIDs.includes(destinationID)) {
    ElMessage.error(
      `不能将项目${props.mode === "move" ? "移动" : "复制"}到其自身。`
    );
    return;
  }

  const movingFolder = props.itemsForAction.find(item => {
    if (item.type !== FileType.Dir || !currentTargetFolderInfo.value)
      return false;
    const targetPath = extractLogicalPathFromUri(
      currentTargetFolderInfo.value.path
    );
    const sourcePath = extractLogicalPathFromUri(item.path);
    return targetPath.startsWith(sourcePath + (sourcePath === "/" ? "" : "/"));
  });

  if (
    movingFolder &&
    extractLogicalPathFromUri(movingFolder.path) !==
      extractLogicalPathFromUri(currentTargetFolderInfo.value.path)
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

const resetState = () => {
  dataCache.clear();
  filesInModal.value = [];
  currentPath.value = "/";
  paginationInfo.value = { page: 1, page_size: 50, total: 0, total_page: 1 };
  currentNodeKey.value = "";
  defaultExpandedKeys.value = [];
  currentTargetFolderInfo.value = null;
};

const handleModalClosed = () => {
  resetState();
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
  dataCache.clear();
  navigateToPath(currentPath.value, 1);
};

const handleSetModalSortKey = (key: SortKey) => {
  modalSortKey.value = key;
  dataCache.clear();
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
