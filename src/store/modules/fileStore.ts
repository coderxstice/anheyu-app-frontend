import { defineStore } from "pinia";
import { ElMessage } from "element-plus";

import {
  fetchFilesByPathApi,
  createUploadSessionApi,
  uploadChunkApi,
  deleteUploadSessionApi,
  createItemApi
} from "@/api/sys-file/sys-file";

// 引入更新后的类型定义
import {
  type FileItem,
  type UploadItem,
  type PaginationInfo,
  type ParentInfo,
  type FileProps,
  FileType // 引入 FileType 枚举 (0: File, 1: Dir)
} from "@/api/sys-file/type";

// 为排序规则定义一个类型，增强代码健壮性
export type SortKey =
  | "name_asc"
  | "name_desc"
  | "size_asc"
  | "size_desc"
  | "updated_at"
  | "updated_at_desc"
  | "created_at"
  | "created_at_desc";

// 定义 Store 的状态接口
interface FileState {
  path: string; // 存储当前目录的逻辑路径，例如 "/" 或 "/Documents"
  files: FileItem[];
  selectedFiles: Set<string>;
  lastSelectedId: string | null;
  viewMode: "list" | "grid";
  sortKey: SortKey;
  loading: boolean;
  pagination: PaginationInfo | null;
  parentInfo: ParentInfo | null; // parentInfo 的 path 字段在 FileItem 类型中是完整的 URI
  currentProps: FileProps | null;
  uploadQueue: UploadItem[];
  showUploadProgress: boolean;
  pageSize: number;
}

// 用于上传队列中项目的唯一 ID (仅前端渲染使用)
let uploadId = 0;

/**
 * 辅助函数：从完整的后端 URI (e.g., "anzhiyu://my/Documents") 中提取逻辑路径 (e.g., "/Documents")
 */
const extractLogicalPathFromUri = (uri: string): string => {
  // 假设所有后端返回的 path 都是以 'anzhiyu://my' 开头的完整 URI
  if (uri.startsWith("anzhiyu://my")) {
    let path = uri.substring("anzhiyu://my".length);
    // 如果是 'anzhiyu://my' 后面没有斜杠或只有斜杠，都视为根目录 '/'
    return path === "" || path === "/" ? "/" : path;
  }
  // 如果不是期望的格式，原样返回（可能需要进一步的错误处理或默认值）
  console.warn(
    `Attempted to extract logical path from unexpected URI format: ${uri}`
  );
  return uri;
};

export const useFileStore = defineStore("file", {
  // state: 定义所有初始状态
  state: (): FileState => ({
    path: "/", //  初始根路径现在是逻辑路径 "/"
    files: [],
    selectedFiles: new Set(),
    lastSelectedId: null,
    viewMode: "list",
    sortKey: "updated_at_desc", // 默认排序键更新为后端提供的 updated_at
    loading: false,
    pagination: null,
    parentInfo: null, // parentInfo 的 path 是完整 URI，需要通过 extractLogicalPathFromUri 处理
    currentProps: null,
    uploadQueue: [],
    showUploadProgress: false,
    pageSize: 50
  }),

  // getters: 派生状态（计算属性）
  getters: {
    // 根据当前逻辑路径生成面包屑导航片段
    pathSegments: state => {
      // 这里的 state.path 已经是逻辑路径 (例如 "/", "/Documents")
      // 面包屑的根显示为 "我的文件"，其 path 也是逻辑根路径 "/"
      if (state.path === "/") return [{ name: "我的文件", path: "/" }];

      const segments = state.path.split("/").filter(Boolean); // 过滤掉空字符串，防止连续斜杠
      const result = [{ name: "我的文件", path: "/" }]; // 根面包屑始终是逻辑根路径 "/"

      let currentLogicalPath = "";
      for (const segment of segments) {
        currentLogicalPath += `/${segment}`;
        // 面包屑项的 path 也是逻辑路径
        result.push({ name: segment, path: currentLogicalPath });
      }
      return result;
    },

    // 判断当前文件是否已全选
    isAllSelected: state => {
      if (state.files.length === 0) return false;
      return state.selectedFiles.size === state.files.length;
    },

    // 经过排序的文件列表
    sortedFiles: (state): FileItem[] => {
      const filesToSort = [...state.files];
      const sortParts = state.sortKey.split("_");
      let orderKey = sortParts[0];
      let direction = sortParts[sortParts.length - 1];

      // 特殊处理 'updated_at' 和 'created_at' 这种多部分 key
      if (sortParts.length > 2) {
        orderKey = sortParts.slice(0, -1).join("_"); // 重新组合 key，例如 "updated_at"
      }

      filesToSort.sort((a, b) => {
        // 根据后端返回的 type 字段进行目录优先排序 (使用 FileType 枚举)
        if (a.type === FileType.Dir && b.type !== FileType.Dir) return -1;
        if (a.type !== FileType.Dir && b.type === FileType.Dir) return 1;

        let comparison = 0;
        switch (orderKey) {
          case "name":
            comparison = a.name.localeCompare(b.name, "zh-Hans-CN");
            break;
          case "size":
            comparison = (a.size ?? 0) - (b.size ?? 0);
            break;
          case "updated_at":
            comparison =
              new Date(a.updated_at).getTime() -
              new Date(b.updated_at).getTime();
            break;
          case "created_at":
            comparison =
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime();
            break;
        }
        return direction === "asc" ? comparison : -comparison;
      });

      return filesToSort;
    }
  },

  // actions: 定义修改状态的方法
  actions: {
    setPageSize(size: number) {
      this.pageSize = size;
      // 修改分页大小后，应重新从第一页加载
      this.loadFiles(this.path, 1);
    },
    // 设置排序规则
    setSort(key: SortKey) {
      this.sortKey = key;
      this.loadFiles(this.path, 1);
    },

    // 切换视图模式
    setViewMode(mode: "list" | "grid") {
      this.viewMode = mode;
    },

    // 从 API 加载文件列表
    async loadFiles(logicalPath: string | undefined, page = 1) {
      // 接收逻辑路径
      this.loading = true;
      // 校验并处理 logicalPath，默认为根逻辑路径 "/"
      const finalLogicalPath =
        typeof logicalPath === "string" && logicalPath.length > 0
          ? logicalPath
          : "/";
      this.path = finalLogicalPath; // 更新 store 中的路径为逻辑路径

      this.clearSelection();

      try {
        const sortParts = this.sortKey.split("_");
        let order = sortParts[0];
        let direction = sortParts[sortParts.length - 1];
        if (sortParts.length > 2) {
          order = sortParts.slice(0, sortParts.length - 1).join("_");
        }

        const response = await fetchFilesByPathApi(
          finalLogicalPath, // 传入逻辑路径给 API
          order,
          direction,
          page,
          this.pageSize
        );

        if (response.code === 200) {
          const { files, parent, pagination, props } = response.data;

          // 无论是第几页，都直接替换当前的文件列表
          this.files = files;
          this.pagination = pagination;
          // parent.path 是后端返回的完整 URI，需要转换为逻辑路径存储
          this.parentInfo = {
            ...parent,
            path: extractLogicalPathFromUri(parent.path) // 转换 parent path 为逻辑路径
          };
          this.currentProps = props;
        } else {
          ElMessage.error(response.message || "文件列表加载失败");
          this.files = [];
        }
      } catch (error) {
        console.error("文件加载失败:", error);
        ElMessage.error("文件加载失败，请检查网络连接。");
        this.files = [];
      } finally {
        this.loading = false;
      }
    },

    // --- 选择相关的 Actions ---
    selectSingle(fileId: string) {
      this.selectedFiles.clear();
      this.selectedFiles.add(fileId);
      this.lastSelectedId = fileId;
    },
    toggleSelection(fileId: string) {
      if (this.selectedFiles.has(fileId)) {
        this.selectedFiles.delete(fileId);
        this.lastSelectedId = null;
      } else {
        this.selectedFiles.add(fileId);
        this.lastSelectedId = fileId;
      }
    },
    selectRange(endId: string) {
      const anchorId = this.lastSelectedId;
      if (anchorId === null) {
        this.selectSingle(endId);
        return;
      }
      const anchorIndex = this.files.findIndex(f => f.id === anchorId);
      const endIndex = this.files.findIndex(f => f.id === endId);
      if (anchorIndex === -1 || endIndex === -1) return;
      const start = Math.min(anchorIndex, endIndex);
      const end = Math.max(anchorIndex, endIndex);
      for (let i = start; i <= end; i++) {
        this.selectedFiles.add(this.files[i].id);
      }
    },
    selectAll() {
      const allIds = this.files.map(f => f.id);
      this.selectedFiles = new Set(allIds);
    },
    clearSelection() {
      this.selectedFiles = new Set();
      this.lastSelectedId = null;
    },
    invertSelection() {
      const allIds = this.files.map(f => f.id);
      const newSelectedFiles = new Set<string>();
      allIds.forEach(id => {
        if (!this.selectedFiles.has(id)) {
          newSelectedFiles.add(id);
        }
      });
      this.selectedFiles = newSelectedFiles;
    },

    // --- 创建文件和文件夹的 Actions ---
    async createFile(name: string) {
      try {
        // 构建要创建的文件完整逻辑路径
        const fullFileLogicalPath =
          this.path.endsWith("/") && this.path !== "/"
            ? `${this.path.slice(0, -1)}/${name}` // 非根目录且带斜杠，移除斜杠
            : `${this.path}${name}`; // 根目录直接拼接

        // 调用 createItemApi，传入 FileType.File (0) 和完整逻辑路径
        const response = await createItemApi(
          FileType.File,
          fullFileLogicalPath
        );
        if (response.code === 200) {
          ElMessage.success(`文件 ${name} 创建成功`);
          this.loadFiles(this.path); // 重新加载当前目录的文件列表
        } else {
          ElMessage.error(response.message || `文件 ${name} 创建失败`);
        }
      } catch (error) {
        console.error(`创建文件失败:`, error);
        ElMessage.error(`文件 ${name} 创建失败，请检查网络连接或权限。`);
      }
    },
    async createFolder(name: string) {
      try {
        // 构建要创建的文件夹完整逻辑路径
        const fullFolderLogicalPath =
          this.path.endsWith("/") && this.path !== "/"
            ? `${this.path.slice(0, -1)}/${name}` // 非根目录且带斜杠，移除斜杠
            : `${this.path}${name}`; // 根目录直接拼接

        // 调用 createItemApi，传入 FileType.Dir (1) 和完整逻辑路径
        const response = await createItemApi(
          FileType.Dir,
          fullFolderLogicalPath
        );
        if (response.code === 200) {
          ElMessage.success(`文件夹 ${name} 创建成功`);
          this.loadFiles(this.path); // 重新加载当前目录的文件列表
        } else {
          ElMessage.error(response.message || `文件夹 ${name} 创建失败`);
        }
      } catch (error) {
        console.error(`创建文件夹失败:`, error);
        ElMessage.error(`文件夹 ${name} 创建失败，请检查网络连接或权限。`);
      }
    },

    // --- 上传相关的 Actions ---
    addFilesToUpload(files: File[]) {
      if (files.length === 0) return;
      this.showUploadProgress = true;
      const newUploads: UploadItem[] = Array.from(files).map(file => ({
        id: uploadId++,
        name: file.name,
        size: file.size,
        status: "pending",
        progress: 0,
        file: file,
        uploadedChunks: new Set()
      }));
      this.uploadQueue.push(...newUploads);
      this.processUploadQueue();
    },
    async processUploadQueue() {
      const uploadTasks = this.uploadQueue
        .filter(item => item.status === "pending")
        .map(async item => {
          try {
            item.status = "uploading";
            // 拼接上传的完整逻辑路径
            const uploadLogicalPath =
              this.path.endsWith("/") && this.path !== "/"
                ? `${this.path.slice(0, -1)}/${item.name}` // 非根目录且带斜杠，移除斜杠
                : `${this.path}${item.name}`; // 根目录直接拼接

            const sessionRes = await createUploadSessionApi(
              uploadLogicalPath, // 传入逻辑路径
              item.size,
              "J7uV"
            );
            if (sessionRes.code !== 200) throw new Error(sessionRes.message);

            const { session_id, chunk_size } = sessionRes.data;
            item.sessionId = session_id;
            const totalChunks = Math.ceil(item.size / chunk_size);
            item.totalChunks = totalChunks;

            const chunkPromises = [];
            for (let i = 0; i < totalChunks; i++) {
              const start = i * chunk_size;
              const end = Math.min(start + chunk_size, item.size);
              const chunk = item.file.slice(start, end);

              const promise = uploadChunkApi(session_id, i, chunk).then(() => {
                item.uploadedChunks.add(i);
                item.progress = Math.round(
                  (item.uploadedChunks.size / totalChunks) * 100
                );
              });
              chunkPromises.push(promise);
            }
            await Promise.all(chunkPromises);
            item.status = "success";
          } catch (error) {
            item.status = "error";
            console.error(`上传文件 ${item.name} 失败:`, error);
            if (item.sessionId) {
              await deleteUploadSessionApi(
                item.sessionId,
                // 删除时也使用逻辑路径
                this.path.endsWith("/") && this.path !== "/"
                  ? `${this.path.slice(0, -1)}/${item.name}`
                  : `${this.path}${item.name}`
              );
            }
          }
        });

      await Promise.all(uploadTasks);
      this.loadFiles(this.path);
    },
    removeFromQueue(id: number) {
      this.uploadQueue = this.uploadQueue.filter(item => item.id !== id);
      if (this.uploadQueue.length === 0) {
        this.showUploadProgress = false;
      }
    },
    clearFinishedUploads() {
      this.uploadQueue = this.uploadQueue.filter(
        item => item.status === "uploading"
      );
      if (this.uploadQueue.length === 0) {
        this.showUploadProgress = false;
      }
    }
  }
});
