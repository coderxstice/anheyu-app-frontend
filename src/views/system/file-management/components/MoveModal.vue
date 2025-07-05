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
        <div class="tree-scroll-container">
          <el-tree
            v-if="!isInitializing"
            ref="folderTreeRef"
            :data="treeData"
            :props="{
              label: 'name',
              children: 'children',
              isLeaf: 'isLeaf',
              disabled: 'disabled'
            }"
            node-key="path"
            highlight-current
            :expand-on-click-node="false"
            :default-expanded-keys="defaultExpandedKeys"
            :current-node-key="currentPath"
            @node-click="handleTreeNodeClick"
            @node-expand="handleNodeExpand"
          >
            <template #default="{ node, data }">
              <div
                v-if="data.isLoadMoreNode"
                class="load-more-node"
                @click.stop="handleLoadMoreInTree(node)"
              >
                <span>{{ node.label }}</span>
              </div>
              <span
                v-else
                class="custom-tree-node"
                :class="{ 'is-current-path': node.data.path === currentPath }"
              >
                <el-icon
                  :class="{ 'is-loading': data.isLoading }"
                  class="folder-icon"
                  ><Folder
                /></el-icon>
                <span class="ml-2">{{ node.label }}</span>
              </span>
            </template>
          </el-tree>
        </div>
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
            :columns="activeColumns"
            :has-selection="false"
            :is-simplified="true"
            @refresh="handleModalRefresh"
            @set-view-mode="handleSetModalViewMode"
            @set-sort-key="handleSetModalSortKey"
            @set-page-size="handleSetModalPageSize"
          />
        </div>

        <div
          ref="fileContentAreaRef"
          v-loading="listLoading"
          class="file-content-area"
        >
          <template v-if="!listLoading">
            <FileListView
              v-if="modalViewMode === 'list'"
              :key="currentPath"
              :files="filesInModal"
              :columns="activeColumns"
              :sort-key="modalSortKey"
              :loading="false"
              :selected-file-ids="new Set()"
              :disabled-file-ids="disabledIdsForRightPanel"
              :is-more-loading="isMoreLoading"
              :has-more="hasMore"
              @navigate-to="navigateToPath"
              @scroll-to-load="loadMoreFiles"
            />
            <FileGridView
              v-if="modalViewMode === 'grid'"
              :key="currentPath"
              :files="filesInModal"
              :loading="false"
              :selected-file-ids="new Set()"
              :disabled-file-ids="disabledIdsForRightPanel"
              :is-more-loading="isMoreLoading"
              @navigate-to="navigateToPath"
            />
          </template>
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
import { ref, computed, watch } from "vue";
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
  type FileListResponse,
  type ColumnConfig
} from "@/api/sys-file/type";
import { extractLogicalPathFromUri, getParentPath } from "@/utils/fileUtils";

// --- 类型定义 ---
/**
 * 使用 TypeScript 的高级类型推导出 Element Plus 内部的 Node 类型, 避免直接导入私有类型
 */
type ElTreeNode = NonNullable<
  ReturnType<InstanceType<typeof ElTree>["getNode"]>
>;

type SortKey =
  | "name_asc"
  | "name_desc"
  | "size_asc"
  | "size_desc"
  | "updated_at_asc"
  | "updated_at_desc"
  | "created_at_asc"
  | "created_at_desc";

/**
 * API 返回的文件列表数据的缓存结构
 */
type CachedApiData = FileListResponse["data"] & { hasMore: boolean };

/**
 * 树节点的数据结构定义
 */
interface TreeNodeData {
  id: string; // 原始ID，用于业务逻辑
  name: string; // 显示名称
  path: string; // 逻辑路径，作为 node-key
  children?: TreeNodeData[]; // 子节点
  isLeaf: boolean; // 是否为叶子节点
  disabled: boolean; // 是否禁用
  isLoadMoreNode?: boolean; // 是否为"加载更多"节点
  isLoading?: boolean; // 节点是否正在加载子数据
  isLoaded?: boolean; // 节点是否已成功加载过子数据
}

/**
 * "加载更多"节点的专用类型
 */
type LoadMoreNodeData = Required<
  Pick<TreeNodeData, "id" | "name" | "path" | "isLoadMoreNode">
>;

/**
 * 树中所有节点的联合类型
 */
type UnifiedNodeData = TreeNodeData | LoadMoreNodeData;

// --- Props & Emits ---
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  itemsForAction: { type: Array as PropType<FileItem[]>, default: () => [] },
  mode: { type: String as PropType<"move" | "copy">, required: true }
});
const emit = defineEmits(["update:modelValue", "success"]);

// --- 工具函数 ---
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- 基础状态和计算属性 ---
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
const targetPathBreadcrumb = computed(() => {
  if (!currentTargetFolderInfo.value?.path) return "我的文件";
  const path = extractLogicalPathFromUri(currentTargetFolderInfo.value.path);
  if (path === "/") return "我的文件";
  const segments = path.split("/").filter(Boolean);
  return `我的文件 / ${segments.join(" / ")}`;
});

const defaultColumns: ColumnConfig[] = [
  { type: 0, width: 380 },
  { type: 1, width: 120 },
  { type: 2, width: 180 }
];
const activeColumns = computed<ColumnConfig[]>(() => {
  const data = sharedDataSource.get(currentPath.value);
  const apiColumns = data?.view?.columns;
  return Array.isArray(apiColumns) && apiColumns.length > 0
    ? apiColumns
    : defaultColumns;
});

// --- 用于判断禁用逻辑的计算属性 ---

/**
 * 判断当前操作是否涉及文件夹
 */
const isActionOnFolders = computed(() =>
  props.itemsForAction.some(item => item.type === FileType.Dir)
);

/**
 * 获取所有正在被操作的源文件夹的路径集合
 */
const sourceActionFolderPaths = computed(() => {
  if (!isActionOnFolders.value) return new Set();
  return new Set(
    props.itemsForAction
      .filter(item => item.type === FileType.Dir)
      .map(item => extractLogicalPathFromUri(item.path))
  );
});

/**
 * 计算右侧文件列表中需要被禁用的项的ID集合
 */
const disabledIdsForRightPanel = computed(() => {
  // 禁用所有“文件”类型的列表项，以及那些正在被操作的项
  const fileIdsInView = filesInModal.value
    .filter(item => item.type !== FileType.Dir)
    .map(item => item.id);
  return new Set([...idsForActionSet.value, ...fileIdsInView]);
});

// --- 组件引用 ---
const folderTreeRef = ref<InstanceType<typeof ElTree>>();

// --- 状态管理 ---
const isInitializing = ref(false);
const listLoading = ref(false);
const isMoreLoading = ref(false);
const isSubmitting = ref(false);

// --- 核心数据模型 ---
const sharedDataSource = new Map<string, CachedApiData>();
const currentPath = ref("/");
const filesInModal = ref<FileItem[]>([]);
const hasMore = ref(true);
const currentTargetFolderInfo = ref<ParentInfo | null>(null);
const defaultExpandedKeys = ref<string[]>([]);
const treeData = ref<TreeNodeData[]>([]);

// --- 视图状态 ---
const modalViewMode = ref<"list" | "grid">("list");
const modalSortKey = ref<SortKey>("name_asc");
const modalPageSize = ref(50);

// --- 辅助函数 ---

/**
 * 判断给定的树节点是否应该被禁用
 * @param path 节点的逻辑路径
 * @param id 节点的原始ID
 */
const isTreeNodeDisabled = (path: string, id: string): boolean => {
  // 规则1：如果节点本身就是正在操作的对象之一，则禁用
  if (idsForActionSet.value.has(id)) {
    return true;
  }
  // 规则2：仅当操作涉及文件夹时，才进行路径检查
  if (isActionOnFolders.value) {
    for (const sourcePath of sourceActionFolderPaths.value) {
      // 如果当前节点路径与源文件夹路径相同，或为其子孙目录
      if (path === sourcePath || path.startsWith(sourcePath + "/")) {
        return true;
      }
    }
  }
  return false;
};

/**
 * 创建一个"加载更多"节点
 * @param parentNodeData 父节点的数据
 */
const createLoadMoreNode = (
  parentNodeData: TreeNodeData
): LoadMoreNodeData => ({
  id: `load-more-${parentNodeData.path}`,
  name: "加载更多...",
  path: `load-more-${parentNodeData.path}`,
  isLoadMoreNode: true
});

/**
 * 将API返回的文件夹项目转换为树节点数据结构
 * @param folder 从API获取的文件夹对象
 */
const fileItemToTreeNode = (folder: FileItem): TreeNodeData => {
  const folderPath = extractLogicalPathFromUri(folder.path);
  return {
    id: folder.id,
    name: folder.name,
    path: folderPath,
    children: [], // 始终创建一个空的 children 数组，以显示展开箭头
    isLeaf: false,
    disabled: isTreeNodeDisabled(folderPath, folder.id),
    isLoaded: false
  };
};

// --- 初始化与数据预置 ---

/**
 * 监听弹窗可见性，显示时执行初始化
 */
watch(localVisible, isVisible => {
  if (isVisible) initializeComponent();
});

/**
 * 组件初始化函数
 */
const initializeComponent = async () => {
  console.log("[Init] 🚀 开始初始化移动/复制组件...");
  isInitializing.value = true;
  resetState();

  const itemToLocate = props.itemsForAction[0];
  const initialPath = extractLogicalPathFromUri(
    itemToLocate ? getParentPath(itemToLocate.path) : "/"
  );
  console.log(`[Init] 初始目标路径为: ${initialPath}`);

  // 核心：仅请求一次初始路径的数据
  const data = await getDirectoryContents(initialPath, true);
  if (!data) {
    isInitializing.value = false;
    ElMessage.error("初始化文件夹数据失败！");
    return;
  }

  console.log("[Init] 初始数据获取成功，开始构建UI状态...");
  // 1. 更新右侧文件列表
  processApiResponse(data, initialPath);

  // 2. 手动构建左侧树的初始状态
  const pathSegments = initialPath.split("/").filter(Boolean);
  const rootNode: TreeNodeData = {
    id: "/",
    path: "/",
    name: "我的文件",
    children: [],
    isLeaf: false,
    isLoaded: initialPath === "/",
    disabled: isTreeNodeDisabled("/", "/")
  };

  let currentNode = rootNode;
  const expandedKeys = ["/"];

  pathSegments.forEach(segment => {
    const parentPath = currentNode.path;
    const newPath =
      parentPath === "/" ? `/${segment}` : `${parentPath}/${segment}`;
    expandedKeys.push(newPath);
    const newNode: TreeNodeData = {
      id: newPath,
      path: newPath,
      name: segment,
      children: [],
      isLeaf: false,
      isLoaded: false,
      disabled: isTreeNodeDisabled(newPath, newPath)
    };
    currentNode.children!.push(newNode);
    currentNode = newNode;
  });

  console.log(`[Init] 手动构建树路径完成，当前节点路径: ${currentNode.path}`);

  // 3. 将API返回的文件夹数据挂载到当前树节点
  updateTreeNodeChildren(currentNode, data);
  currentNode.isLoaded = true; // 标记当前节点已加载

  // 4. 设置树的最终数据和展开状态
  treeData.value = [rootNode];
  defaultExpandedKeys.value = expandedKeys;
  console.log("[Init] 树结构和展开状态设置完毕:", {
    treeData: treeData.value,
    defaultExpandedKeys: defaultExpandedKeys.value
  });

  isInitializing.value = false;
  console.log("[Init] ✅ 初始化完成！");
};

// --- 数据获取与处理 ---

/**
 * 根据路径获取目录内容，优先从缓存读取
 * @param path 目标逻辑路径
 * @param forceRefresh 是否强制从API刷新，忽略缓存
 */
const getDirectoryContents = async (
  path: string,
  forceRefresh = false
): Promise<CachedApiData | null> => {
  const logicalPath = extractLogicalPathFromUri(path);
  if (!forceRefresh && sharedDataSource.has(logicalPath)) {
    console.log(`[Cache] 命中缓存: ${logicalPath}`);
    return sharedDataSource.get(logicalPath)!;
  }

  console.log(
    `[API] 🚀 请求数据 for path: ${logicalPath}, 是否强制刷新: ${forceRefresh}`
  );
  const apiCallPromise = fetchFilesByPathApi(logicalPath);
  const minDelayPromise = sleep(200); // 防闪烁
  try {
    const [res] = await Promise.all([apiCallPromise, minDelayPromise]);

    if (res.code !== 200 || !res.data) {
      ElMessage.error(res.message || "获取文件列表失败");
      return null;
    }
    console.log(`[API] ✅ 请求成功 for path: ${logicalPath}`);

    const dataToCache: CachedApiData = {
      ...res.data,
      hasMore: !!res.data.pagination?.next_token
    };
    sharedDataSource.set(logicalPath, dataToCache);
    return dataToCache;
  } catch (error) {
    console.error(`[API] ❌ 请求失败 for path: ${logicalPath}`, error);
    return null;
  }
};

/**
 * 处理API返回数据，更新UI状态
 * @param data 从缓存或API获取到的目录数据
 * @param path 当前的逻辑路径
 */
const processApiResponse = (data: CachedApiData, path: string) => {
  console.log(`[State] 更新右侧视图和当前目标文件夹信息 for path: ${path}`);
  filesInModal.value = data.files;
  hasMore.value = data.hasMore;
  currentPath.value = path;

  const parentInfo = data.parent;
  if (parentInfo) {
    parentInfo.name =
      extractLogicalPathFromUri(parentInfo.path) === "/"
        ? "我的文件"
        : parentInfo.name;
    currentTargetFolderInfo.value = parentInfo;
  }
};

// --- Tree 交互逻辑 ---

/**
 * 根据获取到的数据，更新指定树节点的子节点列表
 * @param node 要更新的父节点
 * @param data 包含子文件/文件夹列表的数据
 */
const updateTreeNodeChildren = (node: TreeNodeData, data: CachedApiData) => {
  console.log(`[Tree Update] 更新节点 ${node.path} 的子节点...`);
  const subFolders = data.files
    .filter(item => item.type === FileType.Dir)
    .map(fileItemToTreeNode);

  let finalChildren: UnifiedNodeData[] = subFolders;

  const allItemsInResponseAreFolders =
    data.files.length > 0 && data.files.every(f => f.type === FileType.Dir);

  if (data.hasMore && allItemsInResponseAreFolders) {
    console.log(
      `[Tree Update] 节点 ${node.path} 满足“加载更多”条件，添加加载按钮。`
    );
    finalChildren.push(createLoadMoreNode(node));
  }

  node.children = finalChildren as TreeNodeData[];

  // 判断是否应该将当前节点设置为叶子节点
  const allFoldersAreLoaded = !data.hasMore || !allItemsInResponseAreFolders;
  if (allFoldersAreLoaded && subFolders.length === 0) {
    console.log(
      `[Tree Update] 节点 ${node.path} 已确认无子文件夹，标记为叶子节点。`
    );
    node.isLeaf = true;
  }
};

/**
 * 处理树节点展开事件（用户点击展开箭头时触发）
 * @param data 节点的数据
 */
const handleNodeExpand = async (data: TreeNodeData) => {
  console.log(`[Tree Expand] 用户展开节点: ${data.path}`);
  if (data.isLoaded || data.isLoading) {
    console.log(`[Tree Expand] 节点 ${data.path} 已加载或正在加载，跳过。`);
    return;
  }

  data.isLoading = true;
  const apiData = await getDirectoryContents(data.path);
  if (apiData) {
    updateTreeNodeChildren(data, apiData);
    data.isLoaded = true;
  }
  data.isLoading = false;
};

/**
 * 处理树节点点击事件
 * @param data 节点的数据
 */
const handleTreeNodeClick = (data: TreeNodeData) => {
  console.log(`[Tree Click] 用户点击节点: ${data.path}`);
  if (data.disabled || (data as any).isLoadMoreNode) return;
  navigateToPath(data.path);
};

/**
 * 处理树中"加载更多"节点的点击事件
 * @param node "加载更多"节点实例
 */
const handleLoadMoreInTree = async (node: ElTreeNode) => {
  const parentNode = node.parent;
  const parentData = parentNode.data as TreeNodeData;
  console.log(`[Tree Load More] 点击“加载更多”，父节点: ${parentData.path}`);

  const existingData = sharedDataSource.get(parentData.path);
  if (!existingData || !existingData.hasMore) return;

  const res = await fetchFilesByPathApi(
    parentData.path,
    existingData.pagination.next_token
  );

  if (res.code === 200 && res.data) {
    // 合并数据
    const existingIds = new Set(existingData.files.map(f => f.id));
    const uniqueNewFiles = res.data.files.filter(f => !existingIds.has(f.id));
    existingData.files.push(...uniqueNewFiles);
    existingData.pagination = res.data.pagination;
    existingData.hasMore = !!res.data.pagination?.next_token;
    sharedDataSource.set(parentData.path, existingData);

    updateTreeNodeChildren(parentData, existingData);

    if (currentPath.value === parentData.path) {
      processApiResponse(existingData, parentData.path);
    }
  }
};

// --- 主视图交互逻辑 ---

/**
 * 导航到指定路径（由面包屑、右侧列表等触发）
 * @param path 目标逻辑路径
 */
const navigateToPath = async (path: string) => {
  const logicalPath = extractLogicalPathFromUri(path);
  console.log(`[Navigate] 导航到路径: ${logicalPath}`);
  if (listLoading.value || currentPath.value === logicalPath) {
    console.log("[Navigate] 导航被阻止（正在加载或路径相同）。");
    return;
  }
  listLoading.value = true;
  const data = await getDirectoryContents(logicalPath, false);

  if (data) {
    processApiResponse(data, logicalPath);

    const nodeData = folderTreeRef.value?.getNode(logicalPath)
      ?.data as TreeNodeData;
    if (nodeData) {
      console.log(
        `[Navigate] 找到了路径'${logicalPath}'对应的树节点，准备使用新获取的数据更新其子节点。`
      );
      updateTreeNodeChildren(nodeData, data);
      nodeData.isLoaded = true;
      const nodeInstance = folderTreeRef.value?.getNode(logicalPath);
      if (nodeInstance && !nodeInstance.expanded) {
        nodeInstance.expand();
      }
    } else {
      console.warn(
        `[Navigate] 警告: 未能在树中找到路径为 '${logicalPath}' 的节点。`
      );
    }
  }
  listLoading.value = false;
};

/**
 * 处理右侧文件列表的滚动加载更多事件
 */
const loadMoreFiles = async () => {
  if (isMoreLoading.value || !hasMore.value) return;

  console.log(
    `[Right Panel Load More] 滚动加载更多 for path: ${currentPath.value}`
  );
  isMoreLoading.value = true;
  const existingData = sharedDataSource.get(currentPath.value);
  if (!existingData || !existingData.pagination?.next_token) {
    isMoreLoading.value = false;
    return;
  }

  const res = await fetchFilesByPathApi(
    currentPath.value,
    existingData.pagination.next_token
  );
  if (res.code === 200 && res.data) {
    const existingIds = new Set(existingData.files.map(f => f.id));
    const uniqueNewFiles = res.data.files.filter(f => !existingIds.has(f.id));
    existingData.files.push(...uniqueNewFiles);
    existingData.pagination = res.data.pagination;
    existingData.hasMore = !!res.data.pagination?.next_token;
    sharedDataSource.set(currentPath.value, existingData);

    processApiResponse(existingData, currentPath.value);

    // 同步更新左侧树
    const treeNode = folderTreeRef.value?.getNode(currentPath.value)
      ?.data as TreeNodeData;
    if (treeNode) {
      updateTreeNodeChildren(treeNode, existingData);
    }
  }
  isMoreLoading.value = false;
};

// --- 其他函数 ---

/**
 * 处理手动刷新事件
 */
const handleModalRefresh = async () => {
  console.log(`[Refresh] 用户点击刷新，当前路径: ${currentPath.value}`);
  listLoading.value = true;
  const data = await getDirectoryContents(currentPath.value, true);
  if (data) {
    processApiResponse(data, currentPath.value);
    const treeNode = folderTreeRef.value?.getNode(currentPath.value)
      ?.data as TreeNodeData;
    if (treeNode) {
      updateTreeNodeChildren(treeNode, data);
    }
  }
  listLoading.value = false;
};

/**
 * 重置所有组件状态
 */
const resetState = () => {
  console.log("[State] 重置所有状态。");
  sharedDataSource.clear();
  filesInModal.value = [];
  currentPath.value = "/";
  hasMore.value = true;
  defaultExpandedKeys.value = [];
  currentTargetFolderInfo.value = null;
  treeData.value = [];
};

/**
 * 处理弹窗关闭事件
 */
const handleModalClosed = () => resetState();
const handleSetModalViewMode = (mode: "list" | "grid") => {
  modalViewMode.value = mode;
};
const handleSetModalSortKey = (key: SortKey) => {
  modalSortKey.value = key;
};
const handleSetModalPageSize = (size: number) => {
  modalPageSize.value = size;
};

/**
 * 最终确认移动/复制操作
 */
const confirmAction = async () => {
  if (!currentTargetFolderInfo.value) {
    ElMessage.warning("无法确定目标文件夹，请重试。");
    return;
  }

  const destination = currentTargetFolderInfo.value;
  const itemsToMove = props.itemsForAction;

  if (itemsToMove.some(item => item.id === destination.id)) {
    ElMessage.error(`操作无效：不能将项目移动或复制到其自身。`);
    return;
  }

  const movingFolders = itemsToMove.filter(item => item.type === FileType.Dir);
  const destinationPath = extractLogicalPathFromUri(destination.path);

  for (const folder of movingFolders) {
    const sourcePath = extractLogicalPathFromUri(folder.path);
    if (
      destinationPath === sourcePath ||
      destinationPath.startsWith(sourcePath + "/")
    ) {
      ElMessage.error(
        `操作无效：不能将文件夹 "${folder.name}" 移动或复制到其子目录中。`
      );
      return;
    }
  }

  isSubmitting.value = true;
  try {
    const sourceIDs = itemsToMove.map(item => item.id);
    const apiToCall = props.mode === "move" ? moveFilesApi : copyFilesApi;
    const res = await apiToCall(sourceIDs, destination.id);
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
    padding-top: 10px;
    position: relative;
    width: 280px;

    .tree-scroll-container {
      height: 100%;
      overflow-y: auto;
      padding-left: 5px;
      padding-right: 5px;
    }
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
    .load-more-node {
      color: var(--el-color-primary);
      cursor: pointer;
      padding: 4px 8px;
      margin: 4px auto 8px auto;
      width: fit-content;
      text-align: center;
      font-size: 13px;
      border-radius: 12px;
      background-color: var(--el-color-primary-light-9);
      transition: background-color 0.2s ease;

      &:hover {
        background-color: var(--el-color-primary-light-8);
        font-weight: 500;
      }
    }
    .el-tree-node[aria-disabled="true"] > .el-tree-node__content {
      cursor: not-allowed;
      color: #c0c4cc;
      background: transparent !important;
      opacity: 0.7;
    }

    .folder-icon.is-loading {
      animation: rotating 1.5s linear infinite;
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
@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
