// src/store/modules/fileStore.ts
import { defineStore } from "pinia";
import { ElMessage } from "element-plus";
import {
  fetchFilesByPathApi,
  createItemApi,
  updateFolderViewApi
} from "@/api/sys-file/sys-file";
import {
  type FileItem,
  type ParentInfo,
  type FileProps,
  type StoragePolicy,
  type FolderViewConfig,
  FileType,
  type ColumnConfig
} from "@/api/sys-file/type";
import { joinPath, extractLogicalPathFromUri } from "@/utils/fileUtils";

export type SortKey =
  | "name_asc"
  | "name_desc"
  | "size_asc"
  | "size_desc"
  | "updated_at_asc"
  | "updated_at_desc"
  | "created_at_asc"
  | "created_at_desc";

interface FileState {
  path: string;
  files: FileItem[];
  viewMode: "list" | "grid";
  sortKey: SortKey;
  loading: boolean;
  isMoreLoading: boolean;
  parentInfo: ParentInfo | null;
  currentProps: FileProps | null;
  storagePolicy: StoragePolicy | null;
  pageSize: number;
  currentFolderId: string | null;
  nextToken: string | null;
  hasMore: boolean;
  columns: ColumnConfig[];
}

const parseSortKey = (sortKey: SortKey): [string, "asc" | "desc"] => {
  const parts = sortKey.split("_");
  const direction = parts.pop() as "asc" | "desc";
  const order = parts.join("_");
  return [order, direction];
};

export interface UploaderActions {
  addResumableTaskFromFileItem: (fileItem: FileItem) => Promise<void>;
}

export const useFileStore = defineStore("file", {
  state: (): FileState => ({
    path: "/",
    files: [],
    viewMode: "list",
    sortKey: "updated_at_desc",
    loading: false,
    isMoreLoading: false,
    parentInfo: null,
    currentProps: null,
    storagePolicy: null,
    pageSize: 50,
    currentFolderId: null,
    nextToken: null,
    hasMore: true,
    columns: []
  }),

  getters: {
    // ... getters aare unchanged
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
    sortedFiles: (state): FileItem[] => {
      const filesToSort = [...state.files];
      const [orderKey, direction] = parseSortKey(state.sortKey);
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
    async updateViewConfig() {
      if (!this.currentFolderId) {
        console.warn("无法更新视图配置：currentFolderId 为空。");
        return;
      }
      try {
        const [order, order_direction] = parseSortKey(this.sortKey);
        const newViewConfig: FolderViewConfig & { columns: ColumnConfig[] } = {
          view: this.viewMode,
          order,
          page_size: this.pageSize,
          order_direction,
          columns: this.columns
        };
        await updateFolderViewApi(this.currentFolderId, newViewConfig);
      } catch (error) {
        console.error("更新文件夹视图配置时发生网络错误:", error);
        ElMessage.error("保存视图设置失败。");
        throw error;
      }
    },

    setPageSize(size: number) {
      if (this.pageSize === size) return;
      this.pageSize = size;
      this.updateViewConfig()
        .then(() => {
          this.refreshCurrentPath({
            addResumableTaskFromFileItem: async () => {}
          });
        })
        .catch(() => {
          console.error("设置分页大小失败，因为配置未能保存到后端。");
        });
    },

    setSort(key: SortKey) {
      if (this.sortKey === key) return;
      this.sortKey = key;
      this.updateViewConfig()
        .then(() => {
          this.refreshCurrentPath({
            addResumableTaskFromFileItem: async () => {}
          });
        })
        .catch(() => {
          console.error("设置排序失败，因为配置未能保存到后端。");
        });
    },

    setViewMode(mode: "list" | "grid") {
      if (this.viewMode === mode) return;
      this.viewMode = mode;
      this.updateViewConfig();
    },

    /**
     * @description 设置列配置，更新后端，并强制刷新列表
     * @param {ColumnConfig[]} columns - 新的列配置数组
     */
    async setColumns(columns: ColumnConfig[]) {
      // 检查配置是否真的改变，避免不必要的刷新
      // 使用 JSON.stringify 是一个简单有效的深比较方法
      if (JSON.stringify(this.columns) === JSON.stringify(columns)) {
        return;
      }

      this.columns = columns;

      try {
        // 调用 updateViewConfig 将更改持久化
        await this.updateViewConfig();

        // 成功保存后，刷新文件列表以应用新视图
        // refreshCurrentPath 会重置分页游标(nextToken)和文件列表(files)
        await this.refreshCurrentPath({
          addResumableTaskFromFileItem: async () => {}
        });

        ElMessage.success("列配置已更新");
      } catch {
        // updateViewConfig 内部已经有错误处理和 ElMessage
        console.error("设置列配置失败，因为配置未能保存到后端。");
        // 这里可以选择是否将 this.columns 还原回旧值，但目前保持与 setSort 等一致，不作还原
      }
    },

    async loadFiles(
      pathToLoad: string,
      uploader: UploaderActions,
      isRefresh: boolean = false
    ) {
      // isRefresh 为 true 时，会重置 loading, path, nextToken
      if (isRefresh) {
        this.loading = true;
        this.path = extractLogicalPathFromUri(pathToLoad || "/");
        this.nextToken = null; // 关键：刷新时重置游标
        // 关键：刷新时清空现有文件
        this.files = [];
      }

      // 如果不是刷新，并且正在加载或没有更多数据，则返回
      if (!isRefresh && (this.isMoreLoading || !this.hasMore)) {
        return;
      }

      // 如果不是刷新，则认为是加载更多
      if (!isRefresh) {
        this.isMoreLoading = true;
      }

      try {
        const response = await fetchFilesByPathApi(this.path, this.nextToken);

        if (response.code === 200 && response.data) {
          const { files, parent, pagination, props, storage_policy, view } =
            response.data;

          // isRefresh 为 true 时，this.files 已经在前面被清空
          // 所以这里直接 push 即可，无需再判断
          const existingIds = new Set(this.files.map(f => f.id));
          const uniqueNewFiles = files.filter(f => !existingIds.has(f.id));
          this.files.push(...uniqueNewFiles);

          if (pagination && pagination.next_token) {
            this.nextToken = pagination.next_token;
            this.hasMore = true;
          } else {
            this.nextToken = null;
            this.hasMore = false;
          }

          // 不论是否刷新，都应该更新视图配置，因为可能是从另一个文件夹导航过来的
          if (view) {
            this.viewMode = view.view;
            this.pageSize = view.page_size;
            this.sortKey = `${view.order}_${view.order_direction}` as SortKey;
            this.columns = view.columns?.length
              ? view.columns
              : [
                  { type: 0 }, // 文件名
                  { type: 1 }, // 大小
                  { type: 2 } // 修改时间
                ];
          }

          if (isRefresh) {
            this.parentInfo = parent
              ? { ...parent, path: extractLogicalPathFromUri(parent.path) }
              : null;
            this.currentProps = props;
            this.storagePolicy = storage_policy;
            this.currentFolderId = this.parentInfo?.id || null;
          }
        } else {
          ElMessage.error(response.message || "文件列表加载失败");
        }
      } catch (error) {
        console.error("文件加载失败:", error);
        ElMessage.error("文件加载失败，请检查网络连接。");
      } finally {
        this.loading = false;
        this.isMoreLoading = false;
      }
    },

    // ... 其他 actions 不变 ...
    async refreshCurrentPath(uploader: UploaderActions) {
      // 调用 loadFiles 并将 isRefresh 标志设为 true
      await this.loadFiles(this.path, uploader, true);
    },

    removeFilesFromState(fileIds: string[]) {
      const idsToRemove = new Set(fileIds);
      this.files = this.files.filter(file => !idsToRemove.has(file.id));
    },

    updateFileInState(updatedFile: FileItem) {
      const index = this.files.findIndex(file => file.id === updatedFile.id);
      if (index !== -1) {
        this.files[index] = { ...this.files[index], ...updatedFile };
      }
    },

    async _createItem(type: FileType, name: string) {
      try {
        const fullLogicalPath = joinPath(this.path, name);
        await createItemApi(type, fullLogicalPath);
        const itemType = type === FileType.Dir ? "文件夹" : "文件";
        ElMessage.success(`${itemType} '${name}' 创建成功`);
        this.refreshCurrentPath({
          addResumableTaskFromFileItem: async () => {}
        });
      } catch (error: any) {
        const itemType = type === FileType.Dir ? "文件夹" : "文件";
        console.error(`创建${itemType}失败:`, error);
        ElMessage.error(error.message || `${itemType} '${name}' 创建失败`);
      }
    },

    async createFile(name: string) {
      await this._createItem(FileType.File, name);
    },

    async createFolder(name: string) {
      await this._createItem(FileType.Dir, name);
    }
  }
});
