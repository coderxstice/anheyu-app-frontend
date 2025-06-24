import { defineStore } from "pinia";
import type { FileItem, UploadItem } from "../types";
import { fetchFilesByPath, uploadFile } from "@/api/sys-file";
import { ElMessage } from "element-plus";

interface FileState {
  path: string;
  files: FileItem[];
  selectedFiles: Set<string>;
  viewMode: "list" | "grid";
  loading: boolean;
  uploadQueue: UploadItem[];
  showUploadProgress: boolean;
}

let uploadId = 0;

export const useFileStore = defineStore("file", {
  state: (): FileState => ({
    path: "/",
    files: [],
    selectedFiles: new Set(),
    viewMode: "list",
    loading: false,
    uploadQueue: [],
    showUploadProgress: false
  }),

  getters: {
    // 面包屑路径片段
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
    // 是否全选
    isAllSelected: state => {
      if (state.files.length === 0) return false;
      return state.selectedFiles.size === state.files.length;
    }
  },

  actions: {
    // 加载文件
    async loadFiles(newPath: string) {
      this.loading = true;
      this.path = newPath;
      this.clearSelection();
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

    // 切换视图
    setViewMode(mode: "list" | "grid") {
      this.viewMode = mode;
    },

    // 选中/取消选中一个文件
    toggleSelection(fileId: string) {
      if (this.selectedFiles.has(fileId)) {
        this.selectedFiles.delete(fileId);
      } else {
        this.selectedFiles.add(fileId);
      }
    },

    // 全选
    selectAll() {
      this.files.forEach(f => this.selectedFiles.add(f.id));
    },

    // 取消选择
    clearSelection() {
      this.selectedFiles.clear();
    },

    // 反选
    invertSelection() {
      const allIds = new Set(this.files.map(f => f.id));
      const currentSelection = new Set(this.selectedFiles);
      this.selectedFiles.clear();
      allIds.forEach(id => {
        if (!currentSelection.has(id)) {
          this.selectedFiles.add(id);
        }
      });
    },

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

    // 处理上传
    processUploadQueue() {
      this.uploadQueue.forEach(item => {
        if (item.status === "uploading" && item.progress === 0) {
          // 模拟进度
          const interval = setInterval(() => {
            if (item.progress < 99) {
              item.progress += 1;
            }
          }, 15);

          uploadFile(item.file, this.path)
            .then(newFile => {
              clearInterval(interval);
              item.progress = 100;
              item.status = "success";
              // 如果上传到了当前目录，则添加到列表中
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

    // 从队列中移除一个项（通常是上传完成或失败后）
    removeFromQueue(id: number) {
      this.uploadQueue = this.uploadQueue.filter(item => item.id !== id);
      if (this.uploadQueue.length === 0) {
        this.showUploadProgress = false;
      }
    },

    // 清空已完成/失败的上传项
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
