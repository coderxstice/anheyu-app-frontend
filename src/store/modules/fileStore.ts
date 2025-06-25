import { defineStore } from "pinia";
import { ElMessage } from "element-plus";

// 引入真实的 API 调用函数
import {
  fetchFilesByPathApi,
  createUploadSessionApi,
  uploadChunkApi,
  deleteUploadSessionApi,
  createFileApi,
  createFolderApi
} from "@/api/sys-file/sys-file";

// 引入更新后的类型定义
import type {
  FileItem,
  UploadItem,
  PaginationInfo,
  ParentInfo,
  FileProps
} from "@/api/sys-file/type";

// 为排序规则定义一个类型，增强代码健壮性
export type SortKey =
  | "name_asc"
  | "name_desc"
  | "size_asc"
  | "size_desc"
  | "modified_asc"
  | "modified_desc"
  | "uploaded_asc"
  | "uploaded_desc";

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
  uploadQueue: UploadItem[];
  showUploadProgress: boolean;
  pageSize: number;
}

// 用于上传队列中项目的唯一 ID (仅前端渲染使用)
let uploadId = 0;

export const useFileStore = defineStore("file", {
  // state: 定义所有初始状态
  state: (): FileState => ({
    path: "/",
    files: [],
    selectedFiles: new Set(),
    lastSelectedId: null,
    viewMode: "list",
    sortKey: "modified_desc",
    loading: false,
    pagination: null,
    parentInfo: null,
    currentProps: null,
    uploadQueue: [],
    showUploadProgress: false,
    pageSize: 50
  }),

  // getters: 派生状态（计算属性）
  getters: {
    // 根据当前路径生成面包屑导航片段
    pathSegments: state => {
      if (state.path === "/") return [{ name: "我的文件", path: "/" }];
      const segments = state.path.split("/").filter(Boolean);
      const result = [{ name: "我的文件", path: "/" }];
      let currentPath = "";
      for (const segment of segments) {
        currentPath += `/${segment}`;
        result.push({ name: segment, path: currentPath });
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
      const [key, order] = state.sortKey.split("_");

      filesToSort.sort((a, b) => {
        if (a.type === "dir" && b.type !== "dir") return -1;
        if (a.type !== "dir" && b.type === "dir") return 1;

        let comparison = 0;
        switch (key) {
          case "name":
            comparison = a.name.localeCompare(b.name, "zh-Hans-CN");
            break;
          case "size":
            comparison = (a.size ?? 0) - (b.size ?? 0);
            break;
          case "modified":
            comparison =
              new Date(a.modified).getTime() - new Date(b.modified).getTime();
            break;
          case "uploaded":
            comparison =
              new Date(a.uploaded).getTime() - new Date(b.uploaded).getTime();
            break;
        }
        return order === "asc" ? comparison : -comparison;
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
    async loadFiles(newPath: string, page = 1) {
      this.loading = true;
      this.path = newPath;
      this.clearSelection();

      try {
        const response = await fetchFilesByPathApi(
          newPath,
          this.sortKey,
          page,
          this.pageSize
        );

        if (response.code === 200) {
          const { files, parent, pagination, props } = response.data;

          // 无论是第几页，都直接替换当前的文件列表
          this.files = files;
          this.pagination = pagination;
          this.parentInfo = parent;
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

    // --- 文件操作 Actions ---
    async createFile(name: string) {
      try {
        await createFileApi(this.path, name);
        ElMessage.success(`文件 ${name} 创建成功`);
        this.loadFiles(this.path);
      } catch (error) {
        console.error(`创建文件失败:`, error);

        ElMessage.error(`文件创建失败`);
      }
    },
    async createFolder(name: string) {
      try {
        await createFolderApi(this.path, name);
        ElMessage.success(`文件夹 ${name} 创建成功`);
        this.loadFiles(this.path);
      } catch (error) {
        console.error(`创建文件夹失败:`, error);
        ElMessage.error(`文件夹创建失败`);
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
            const sessionRes = await createUploadSessionApi(
              `${this.path === "/" ? "" : this.path}/${item.name}`,
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
                `${this.path === "/" ? "" : this.path}/${item.name}`
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
