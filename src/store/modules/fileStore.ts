import { defineStore } from "pinia";
import { ElMessage } from "element-plus";
import {
  fetchFilesByPathApi,
  createItemApi,
  updateFolderViewApi
} from "@/api/sys-file/sys-file";
import {
  type FileItem,
  type PaginationInfo,
  type ParentInfo,
  type FileProps,
  type StoragePolicy,
  type FolderViewConfig,
  FileType
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
  pagination: PaginationInfo | null;
  parentInfo: ParentInfo | null;
  currentProps: FileProps | null;
  storagePolicy: StoragePolicy | null;
  pageSize: number;
  currentFolderId: string | null;
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
    pagination: null,
    parentInfo: null,
    currentProps: null,
    storagePolicy: null,
    pageSize: 50,
    currentFolderId: null
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
    async updateViewConfig() {
      if (!this.currentFolderId) return;
      try {
        const [order, order_direction] = parseSortKey(this.sortKey);
        const newViewConfig: FolderViewConfig = {
          view: this.viewMode,
          order,
          page_size: this.pageSize,
          order_direction
        };
        const response = await updateFolderViewApi(
          this.currentFolderId,
          newViewConfig
        );
        if (response.code !== 200) {
          console.error("后端返回错误，更新视图配置失败:", response.message);
        }
      } catch (error) {
        console.error("更新文件夹视图配置时发生网络错误:", error);
      }
    },

    setPageSize(size: number) {
      if (this.pageSize === size) return;
      this.pageSize = size;
      this.updateViewConfig().then(() => {
        this.loadFiles(this.path, {
          addResumableTaskFromFileItem: async () => {}
        });
      });
    },

    setSort(key: SortKey) {
      if (this.sortKey === key) return;
      this.sortKey = key;
      this.updateViewConfig().then(() => {
        this.loadFiles(this.path, {
          addResumableTaskFromFileItem: async () => {}
        });
      });
    },

    setViewMode(mode: "list" | "grid") {
      if (this.viewMode === mode) return;
      this.viewMode = mode;
      this.updateViewConfig();
    },

    async loadFiles(
      pathToLoad: string | undefined,
      uploader: UploaderActions,
      page = 1
    ) {
      // **核心修复：加载锁**
      if (this.loading) {
        console.warn(
          "[Store] loadFiles is already in progress. Aborting redundant call.",
          { pathToLoad }
        );
        return;
      }

      this.loading = true;
      const logicalPath = extractLogicalPathFromUri(pathToLoad || "/");
      this.path = logicalPath;

      try {
        const [order, direction] = parseSortKey(this.sortKey);
        const response = await fetchFilesByPathApi(
          logicalPath,
          order,
          direction,
          page,
          this.pageSize
        );

        if (response.code === 200) {
          const { files, parent, pagination, props, storage_policy, view } =
            response.data;
          this.files = files;

          for (const fileItem of this.files) {
            if (fileItem.metadata?.["sys:upload_session_id"]) {
              uploader.addResumableTaskFromFileItem(fileItem);
            }
          }

          this.pagination = pagination;
          this.parentInfo = parent
            ? { ...parent, path: extractLogicalPathFromUri(parent.path) }
            : null;
          this.currentProps = props;
          this.storagePolicy = storage_policy;
          this.currentFolderId = this.parentInfo?.id || null;

          if (view) {
            this.viewMode = view.view;
            this.pageSize = view.page_size;
            const backendSortKey =
              `${view.order}_${view.order_direction}` as SortKey;
            if (this.sortKey !== backendSortKey) {
              this.sortKey = backendSortKey;
            }
          }
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

    // 新增一个简单的刷新 action，供 uploader 回调使用
    async refreshCurrentPath(uploader: UploaderActions) {
      await this.loadFiles(this.path, uploader);
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
