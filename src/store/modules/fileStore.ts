import { defineStore } from "pinia";
import type { FileItem, UploadItem } from "@/api/sys-file/type";
import { fetchFilesByPath, uploadFile } from "@/api/sys-file/sys-file";
import { ElMessage } from "element-plus";

// 定义 Store 的状态接口
interface FileState {
  path: string;
  files: FileItem[];
  selectedFiles: Set<string>;
  lastSelectedId: string | null; // 用于 Shift 范围选择的锚点
  viewMode: "list" | "grid";
  loading: boolean;
  uploadQueue: UploadItem[];
  showUploadProgress: boolean;
}

// 用于上传队列中项目的唯一 ID
let uploadId = 0;

export const useFileStore = defineStore("file", {
  // state: 定义所有初始状态
  state: (): FileState => ({
    path: "/",
    files: [],
    selectedFiles: new Set(),
    lastSelectedId: null,
    viewMode: "list",
    loading: false,
    uploadQueue: [],
    showUploadProgress: false
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
    }
  },

  // actions: 定义修改状态的方法
  actions: {
    // 从 API 加载文件列表
    async loadFiles(newPath: string) {
      this.loading = true;
      this.path = newPath;
      this.clearSelection(); // 加载新路径前清空之前的选择
      try {
        this.files = await fetchFilesByPath(newPath);
      } catch (error) {
        console.error("文件加载失败:", error);
        ElMessage.error("文件加载失败");
        this.files = [];
      } finally {
        this.loading = false;
      }
    },

    // 切换视图模式
    setViewMode(mode: "list" | "grid") {
      this.viewMode = mode;
    },

    // --- 选择相关的 Actions ---

    // 只选中单个文件（用于普通单击）
    selectSingle(fileId: string) {
      this.selectedFiles.clear();
      this.selectedFiles.add(fileId);
      this.lastSelectedId = fileId; // 更新范围选择的锚点
    },

    // 切换单个文件的选中状态（用于 Cmd/Ctrl + 单击）
    toggleSelection(fileId: string) {
      if (this.selectedFiles.has(fileId)) {
        this.selectedFiles.delete(fileId);
        this.lastSelectedId = null; // 取消选择时清除锚点
      } else {
        this.selectedFiles.add(fileId);
        this.lastSelectedId = fileId; // 选中时更新锚点
      }
    },

    // 选中一个范围（用于 Shift + 单击）
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

    // 全选
    selectAll() {
      const allIds = this.files.map(f => f.id);
      this.selectedFiles = new Set(allIds); // 通过创建新 Set 确保响应式
    },

    // 清空选择
    clearSelection() {
      this.selectedFiles = new Set(); // 通过创建新 Set 确保响应式
      this.lastSelectedId = null;
    },

    // 反选
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

    // --- 上传相关的 Actions ---

    // 添加文件到上传队列
    addFilesToUpload(files: File[]) {
      if (files.length === 0) return;

      this.showUploadProgress = true;
      const newUploads: UploadItem[] = Array.from(files).map(file => ({
        id: uploadId++,
        name: file.name,
        size: file.size,
        status: "uploading",
        progress: 0,
        file: file
      }));
      this.uploadQueue.push(...newUploads);
      this.processUploadQueue();
    },

    // 处理上传队列
    processUploadQueue() {
      this.uploadQueue.forEach(item => {
        if (item.status === "uploading" && item.progress === 0) {
          const interval = setInterval(() => {
            if (item.progress < 99) item.progress += 1;
          }, 15);

          uploadFile(item.file, this.path)
            .then(newFile => {
              clearInterval(interval);
              item.progress = 100;
              item.status = "success";
              if (newFile.path === this.path) {
                this.files.push(newFile);
              }
            })
            .catch(() => {
              clearInterval(interval);
              item.status = "error";
            });
        }
      });
    },

    // 从队列中移除项
    removeFromQueue(id: number) {
      this.uploadQueue = this.uploadQueue.filter(item => item.id !== id);
      if (this.uploadQueue.length === 0) {
        this.showUploadProgress = false;
      }
    },

    // 清空已完成的上传项
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
