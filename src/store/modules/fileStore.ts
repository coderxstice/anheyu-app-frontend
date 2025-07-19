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
    /**
     * @description 仅负责将当前 store 的视图配置同步到后端。不执行任何其他操作。
     */
    async _syncViewConfigToBackend() {
      console.log(
        "%c[Sync View Config] Triggered!",
        "color: blue; font-weight: bold;"
      );
      console.trace("Call stack for _syncViewConfigToBackend");

      if (!this.currentFolderId) {
        console.warn("无法更新视图配置：currentFolderId 为空。");
        return;
      }
      try {
        const [order, order_direction] = parseSortKey(this.sortKey);
        const plainColumns = JSON.parse(JSON.stringify(this.columns));
        const newViewConfig: FolderViewConfig & { columns: ColumnConfig[] } = {
          view: this.viewMode,
          order,
          page_size: this.pageSize,
          order_direction,
          columns: plainColumns
        };

        // +++ 新增调试日志 +++
        console.log(
          "%c[Sync View Config] Sending Request Body:",
          "color: green;",
          newViewConfig
        );
        // +++++++++++++++++++++

        await updateFolderViewApi(this.currentFolderId, newViewConfig);
      } catch (error) {
        console.error("更新文件夹视图配置时发生网络错误:", error);
        ElMessage.error("保存视图设置失败。");
        throw error;
      }
    },
    /**
     * @description 设置分页大小，保存配置，然后刷新列表
     */
    async setPageSize(size: number) {
      if (this.pageSize === size) return;
      this.pageSize = size;
      try {
        await this._syncViewConfigToBackend();
        // 只有改变分页大小需要刷新
        await this.refreshCurrentPath({
          addResumableTaskFromFileItem: async () => {}
        });
      } catch {
        // _syncViewConfigToBackend 内部已处理错误消息
      }
    },

    /**
     * @description 设置排序，保存配置，然后刷新列表
     */
    async setSort(key: SortKey) {
      if (this.sortKey === key) return;
      this.sortKey = key;
      try {
        await this._syncViewConfigToBackend();
        // 只有改变排序需要刷新
        await this.refreshCurrentPath({
          addResumableTaskFromFileItem: async () => {}
        });
      } catch {
        // _syncViewConfigToBackend 内部已处理错误消息
      }
    },

    /**
     * @description 设置视图模式，仅保存配置，不刷新列表
     */
    async setViewMode(mode: "list" | "grid") {
      if (this.viewMode === mode) return;
      this.viewMode = mode;
      await this._syncViewConfigToBackend(); // 调用但不等待，或根据需要等待
    },

    /**
     * @description (重构后) 设置列配置，仅保存配置，不刷新列表
     * @param {ColumnConfig[]} newColumnsConfig - 新的列配置数组
     */
    async setColumns(newColumnsConfig: ColumnConfig[]) {
      if (JSON.stringify(this.columns) === JSON.stringify(newColumnsConfig)) {
        return;
      }

      // 就地修改数组以保持响应性
      this.columns.splice(0, this.columns.length, ...newColumnsConfig);

      try {
        // 只调用同步方法，不刷新列表
        await this._syncViewConfigToBackend();
      } catch {
        // 错误已在 _syncViewConfigToBackend 中处理
      }
    },

    async loadFiles(
      pathToLoad: string,
      uploader: UploaderActions,
      isRefresh: boolean = false
    ) {
      if (isRefresh) {
        this.loading = true;
        this.path = extractLogicalPathFromUri(pathToLoad || "/");
        this.nextToken = null;
        this.files = [];
      }

      if (!isRefresh && (this.isMoreLoading || !this.hasMore)) {
        return;
      }

      if (!isRefresh) {
        this.isMoreLoading = true;
      }

      try {
        const response = await fetchFilesByPathApi(this.path, this.nextToken);

        if (response.code === 200 && response.data) {
          const { files, parent, pagination, props, storage_policy, view } =
            response.data;

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

          // **关键优化**：只在首次加载或强制刷新时，才用后端数据覆盖本地视图状态
          // 这样就避免了因其他操作（如setColumns）触发的刷新覆盖了用户刚刚设置的UI状态
          if (isRefresh && view) {
            this.viewMode = view.view;
            this.pageSize = view.page_size;
            this.sortKey = `${view.order}_${view.order_direction}` as SortKey;
            this.columns = view.columns?.length
              ? view.columns
              : [{ type: 0 }, { type: 1 }, { type: 2 }];
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

    async refreshCurrentPath(uploader: UploaderActions) {
      await this.loadFiles(this.path, uploader, true);
    },

    removeFilesFromState(fileIds: string[]) {
      const idsToRemove = new Set(fileIds);
      this.files = this.files.filter(file => !idsToRemove.has(file.id));
    },

    /**
     * @description 仅在前端更新单个文件的状态，用于重命名等操作。
     * @param {string} fileId 要更新的文件ID
     * @param {Partial<FileItem>} updates 要更新的字段对象 (例如 { name: '新文件名.txt' })
     */
    updateFileInState(fileId: string, updates: Partial<FileItem>) {
      const index = this.files.findIndex(file => file.id === fileId);
      if (index !== -1) {
        // 使用 Object.assign 来合并更新，确保响应性
        this.files[index] = Object.assign(this.files[index], updates);
        console.log(
          `[Optimistic Update] File ${fileId} updated with:`,
          updates
        );
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
