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
  type StoragePolicy,
  FileType // 引入 FileType 枚举 (0: File, 1: Dir)
} from "@/api/sys-file/type";

// 为排序规则定义一个类型，增强代码健壮性
export type SortKey =
  | "name_asc"
  | "name_desc"
  | "size_asc"
  | "size_desc"
  | "updated_at_asc"
  | "updated_at_desc"
  | "created_at_asc"
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
  parentInfo: ParentInfo | null;
  currentProps: FileProps | null;
  storagePolicy: StoragePolicy | null; // 新增：存储当前目录的存储策略
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
  if (uri.startsWith("anzhiyu://my")) {
    // 截取 'anzhiyu://my' 之后的部分
    let path = uri.substring("anzhiyu://my".length);
    // 如果路径是空的（对应 anzhiyu://my）或只有一个斜杠，都视为根目录 "/"
    // 否则，如果不是以 / 开头，则补上
    if (path === "" || path === "/") return "/";
    return path.startsWith("/") ? path : `/${path}`;
  }
  console.warn(`尝试从意外的 URI 格式中提取逻辑路径: ${uri}`);
  return uri;
};

export const useFileStore = defineStore("file", {
  // state: 定义所有初始状态
  state: (): FileState => ({
    path: "/", // 初始根路径现在是逻辑路径 "/"
    files: [],
    selectedFiles: new Set(),
    lastSelectedId: null,
    viewMode: "list",
    sortKey: "updated_at_desc", // 默认排序
    loading: false,
    pagination: null,
    parentInfo: null,
    currentProps: null,
    storagePolicy: null, // 初始化存储策略为 null
    uploadQueue: [],
    showUploadProgress: false,
    pageSize: 50
  }),

  // getters: 派生状态（计算属性）
  getters: {
    pathSegments: state => {
      if (state.path === "/") return [{ name: "我的文件", path: "/" }];

      const segments = state.path.split("/").filter(Boolean);
      const result = [{ name: "我的文件", path: "/" }];

      let currentLogicalPath = "";
      for (const segment of segments) {
        currentLogicalPath += `/${segment}`;
        result.push({ name: segment, path: currentLogicalPath });
      }
      return result;
    },

    isAllSelected: state => {
      if (state.files.length === 0) return false;
      return state.selectedFiles.size === state.files.length;
    },

    sortedFiles: (state): FileItem[] => {
      const filesToSort = [...state.files];
      const sortParts = state.sortKey.split("_");
      let orderKey = sortParts[0];
      let direction = sortParts[sortParts.length - 1];

      if (sortParts.length > 2) {
        orderKey = sortParts.slice(0, -1).join("_");
      }

      filesToSort.sort((a, b) => {
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
      this.loadFiles(this.path, 1);
    },
    setSort(key: SortKey) {
      this.sortKey = key;
      this.loadFiles(this.path, 1);
    },
    setViewMode(mode: "list" | "grid") {
      this.viewMode = mode;
    },

    async loadFiles(logicalPath: string | undefined, page = 1) {
      this.loading = true;
      const finalLogicalPath = logicalPath || "/";
      this.path = finalLogicalPath;
      this.clearSelection();

      try {
        const sortParts = this.sortKey.split("_");
        let order = sortParts[0];
        let direction = sortParts[sortParts.length - 1];
        if (sortParts.length > 2) {
          order = sortParts.slice(0, -1).join("_");
        }

        const response = await fetchFilesByPathApi(
          finalLogicalPath,
          order,
          direction,
          page,
          this.pageSize
        );

        if (response.code === 200) {
          const { files, parent, pagination, props, storage_policy } =
            response.data;
          this.files = files;
          this.pagination = pagination;
          this.parentInfo = parent
            ? {
                ...parent,
                path: extractLogicalPathFromUri(parent.path)
              }
            : null;
          this.currentProps = props;
          this.storagePolicy = storage_policy; // **修复**: 保存从后端获取的存储策略
        } else {
          ElMessage.error(response.message || "文件列表加载失败");
          this.files = [];
          this.storagePolicy = null; // 加载失败时清空
        }
      } catch (error) {
        console.error("文件加载失败:", error);
        ElMessage.error("文件加载失败，请检查网络连接。");
        this.files = [];
        this.storagePolicy = null; // 加载失败时清空
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
      this.selectedFiles = new Set(this.files.map(f => f.id));
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

    /**
     * 健壮的路径拼接辅助函数
     * @param basePath 基础逻辑路径 (e.g., '/', '/Documents')
     * @param name 文件或文件夹名 (e.g., 'file.txt')
     * @returns 拼接后的完整逻辑路径 (e.g., '/file.txt', '/Documents/file.txt')
     */
    _joinPath(basePath: string, name: string): string {
      if (basePath === "/") {
        return `/${name}`;
      }
      // 移除 basePath 可能存在的尾部斜杠，然后拼接
      return `${basePath.replace(/\/$/, "")}/${name}`;
    },

    // --- 创建文件和文件夹的 Actions ---
    async createFile(name: string) {
      try {
        // **优化**: 使用辅助函数进行路径拼接
        const fullFileLogicalPath = this._joinPath(this.path, name);

        const response = await createItemApi(
          FileType.File,
          fullFileLogicalPath
        );
        if (response.code === 200) {
          ElMessage.success(`文件 ${name} 创建成功`);
          this.loadFiles(this.path);
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
        // **优化**: 使用辅助函数进行路径拼接
        const fullFolderLogicalPath = this._joinPath(this.path, name);

        const response = await createItemApi(
          FileType.Dir,
          fullFolderLogicalPath
        );
        if (response.code === 200) {
          ElMessage.success(`文件夹 ${name} 创建成功`);
          this.loadFiles(this.path);
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

            // **修复**: 检查存储策略是否存在
            if (!this.storagePolicy?.id) {
              throw new Error("存储策略未加载，无法开始上传。");
            }

            // **优化**: 使用辅助函数拼接上传路径
            const uploadLogicalPath = this._joinPath(this.path, item.name);

            const sessionRes = await createUploadSessionApi(
              uploadLogicalPath,
              item.size,
              this.storagePolicy.id // **修复**: 使用从 state 中获取的动态存储策略 ID
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
          } catch (error: any) {
            item.status = "error";
            item.errorMessage = error.message || `上传文件 ${item.name} 失败`;
            console.error(`上传文件 ${item.name} 失败:`, error);
            if (item.sessionId) {
              // 删除时也使用正确的逻辑路径
              const logicalPath = this._joinPath(this.path, item.name);
              await deleteUploadSessionApi(item.sessionId, logicalPath);
            }
          }
        });

      await Promise.all(uploadTasks);
      // 只有在全部上传任务（无论成功失败）处理完毕后，才刷新一次文件列表
      const hasSuccessUploads = this.uploadQueue.some(
        item => item.status === "success"
      );
      if (hasSuccessUploads) {
        this.loadFiles(this.path);
      }
    },
    removeFromQueue(id: number) {
      this.uploadQueue = this.uploadQueue.filter(item => item.id !== id);
      if (this.uploadQueue.length === 0) {
        this.showUploadProgress = false;
      }
    },
    clearFinishedUploads() {
      this.uploadQueue = this.uploadQueue.filter(
        item => item.status === "pending" || item.status === "uploading"
      );
      if (this.uploadQueue.length === 0) {
        this.showUploadProgress = false;
      }
    }
  }
});
