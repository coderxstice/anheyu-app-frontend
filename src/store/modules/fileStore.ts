import { defineStore } from "pinia";
import { ElMessage } from "element-plus";

import {
  fetchFilesByPathApi,
  createUploadSessionApi,
  uploadChunkApi,
  deleteUploadSessionApi,
  createItemApi
} from "@/api/sys-file/sys-file";

import {
  type FileItem,
  type UploadItem,
  type PaginationInfo,
  type ParentInfo,
  type FileProps,
  type StoragePolicy,
  FileType
} from "@/api/sys-file/type";

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
  path: string;
  files: FileItem[];
  selectedFiles: Set<string>;
  lastSelectedId: string | null;
  viewMode: "list" | "grid";
  sortKey: SortKey;
  loading: boolean;
  pagination: PaginationInfo | null;
  parentInfo: ParentInfo | null;
  currentProps: FileProps | null;
  storagePolicy: StoragePolicy | null;
  uploadQueue: UploadItem[];
  showUploadProgress: boolean;
  pageSize: number;
  isProcessingQueue: boolean;
  _loadFilesDebounceTimer: number | null;
}

let uploadId = 0;

const extractLogicalPathFromUri = (uri: string): string => {
  if (uri.startsWith("anzhiyu://my")) {
    let path = uri.substring("anzhiyu://my".length);
    // 确保根目录返回的是 "/"
    if (path === "" || path === "/") return "/";
    // 确保返回的路径以 "/" 开头
    return path.startsWith("/") ? path : `/${path}`;
  }
  // 如果传入的已经是逻辑路径，则直接返回
  return uri;
};

export const useFileStore = defineStore("file", {
  state: (): FileState => ({
    path: "/",
    files: [],
    selectedFiles: new Set(),
    lastSelectedId: null,
    viewMode: "list",
    sortKey: "updated_at_desc",
    loading: false,
    pagination: null,
    parentInfo: null,
    currentProps: null,
    storagePolicy: null,
    uploadQueue: [],
    showUploadProgress: false,
    pageSize: 50,
    isProcessingQueue: false,
    _loadFilesDebounceTimer: null
  }),
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
    async loadFiles(pathToLoad: string | undefined, page = 1) {
      this.loading = true;

      // **修复**: 无论传入什么路径，都先净化为标准的逻辑路径
      const logicalPath = extractLogicalPathFromUri(pathToLoad || "/");

      this.path = logicalPath; // 将净化后的逻辑路径存入 state
      this.clearSelection();

      try {
        const sortParts = this.sortKey.split("_");
        let order = sortParts[0];
        let direction = sortParts[sortParts.length - 1];
        if (sortParts.length > 2) {
          order = sortParts.slice(0, -1).join("_");
        }
        // **修复**: 将净化后的逻辑路径传递给 API
        const response = await fetchFilesByPathApi(
          logicalPath,
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
            ? { ...parent, path: extractLogicalPathFromUri(parent.path) }
            : null;
          this.currentProps = props;
          this.storagePolicy = storage_policy;
        } else {
          ElMessage.error(response.message || "文件列表加载失败");
          this.files = [];
          this.storagePolicy = null;
        }
      } catch (error) {
        console.error("文件加载失败:", error);
        ElMessage.error("文件加载失败，请检查网络连接。");
        this.files = [];
        this.storagePolicy = null;
      } finally {
        this.loading = false;
      }
    },

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

    _joinPath(basePath: string, name: string): string {
      if (!name) return basePath;
      if (basePath === "/") {
        return `/${name}`;
      }
      return `${basePath.replace(/\/$/, "")}/${name}`;
    },

    async createFile(name: string) {
      try {
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

    addUploadsToQueue(
      uploads: Omit<
        UploadItem,
        "id" | "status" | "progress" | "uploadedChunks" | "abortController"
      >[]
    ) {
      if (uploads.length === 0) return;
      this.showUploadProgress = true;

      const newUploadItems: UploadItem[] = uploads.map(u => ({
        ...u,
        id: uploadId++,
        status: "pending",
        progress: 0,
        uploadedChunks: new Set()
      }));

      this.uploadQueue.push(...newUploadItems);
      console.log(
        `[Queue] 已添加 ${newUploadItems.length} 个新项目到上传队列。`
      );
      this.processUploadQueue();
    },

    async processUploadQueue() {
      if (this.isProcessingQueue) {
        return;
      }

      this.isProcessingQueue = true;

      try {
        while (true) {
          const currentItem = this.uploadQueue.find(
            item => item.status === "pending"
          );

          if (!currentItem) {
            break;
          }

          try {
            await this._uploadFile(currentItem);
          } catch (error: any) {
            if (error.name !== "AbortError") {
              console.error(
                `[Processor] 处理文件 ${currentItem.name} 时发生致命错误:`,
                error
              );
              currentItem.status = "error";
              currentItem.errorMessage = error.message || "未知上传错误";
            }
          }
        }
      } finally {
        this.isProcessingQueue = false;
      }
    },

    async _uploadFile(item: UploadItem) {
      const controller = new AbortController();
      item.abortController = controller;
      item.status = "uploading";

      try {
        if (!this.storagePolicy?.id) {
          throw new Error("存储策略未加载，无法开始上传。");
        }

        const uploadLogicalPath = this._joinPath(
          item.targetPath,
          item.relativePath
        );
        const sessionRes = await createUploadSessionApi(
          uploadLogicalPath,
          item.size,
          this.storagePolicy.id
        );

        if (sessionRes.code !== 200) {
          throw new Error(sessionRes.message || "创建上传会话失败");
        }

        const { session_id, chunk_size } = sessionRes.data;
        item.sessionId = session_id;
        const totalChunks = Math.ceil(item.size / chunk_size);
        item.totalChunks = totalChunks;

        const CONCURRENT_CHUNKS = 4;
        const chunkIndexes = Array.from({ length: totalChunks }, (_, i) => i);
        const promises: Promise<void>[] = [];

        const worker = async () => {
          while (true) {
            if (controller.signal.aborted)
              throw new DOMException("Aborted", "AbortError");
            const chunkIndex = chunkIndexes.shift();
            if (chunkIndex === undefined) break;

            try {
              const start = chunkIndex * chunk_size;
              const end = Math.min(start + chunk_size, item.size);
              const chunk = item.file.slice(start, end);
              await uploadChunkApi(session_id, chunkIndex, chunk);
              item.uploadedChunks.add(chunkIndex);
              item.progress = Math.round(
                (item.uploadedChunks.size / totalChunks) * 100
              );
            } catch (err) {
              chunkIndexes.push(chunkIndex);
              throw err;
            }
          }
        };

        for (let i = 0; i < CONCURRENT_CHUNKS; i++) {
          promises.push(worker());
        }
        await Promise.all(promises);

        item.progress = 100;
        item.status = "success";

        if (this.path === item.targetPath) {
          this._debounceLoadFiles();
        }
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error(`上传文件 ${item.name} 失败:`, error);
        }
        throw error;
      } finally {
        delete item.abortController;
      }
    },

    _debounceLoadFiles() {
      if (this._loadFilesDebounceTimer) {
        clearTimeout(this._loadFilesDebounceTimer);
      }
      this._loadFilesDebounceTimer = window.setTimeout(() => {
        if (this.path) {
          this.loadFiles(this.path);
        }
      }, 500);
    },

    async cancelUpload(itemId: number) {
      const itemIndex = this.uploadQueue.findIndex(item => item.id === itemId);
      if (itemIndex === -1) return;

      const itemToCancel = this.uploadQueue[itemIndex];

      if (itemToCancel.status === "uploading" && itemToCancel.abortController) {
        itemToCancel.abortController.abort();
      }

      if (itemToCancel.sessionId) {
        try {
          await deleteUploadSessionApi(
            itemToCancel.sessionId,
            this._joinPath(itemToCancel.targetPath, itemToCancel.relativePath)
          );
        } catch (error) {
          console.error(
            `删除后端上传会话 ${itemToCancel.sessionId} 失败:`,
            error
          );
        }
      }

      this.uploadQueue.splice(itemIndex, 1);

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
