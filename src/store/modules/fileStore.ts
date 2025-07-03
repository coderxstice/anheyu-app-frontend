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

/**
 * @description [适配游标分页] 更新State接口以适应新的分页模型。
 * - nextToken 用于存储下一页的游标。
 * - hasMore 用于判断是否还有更多数据。
 */
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
}

/**
 * @description 解析排序键，返回排序字段和排序方向。
 * @param {SortKey} sortKey - 组合的排序键，例如 'name_asc'。
 * @returns {[string, "asc" | "desc"]} - 返回一个包含排序字段和方向的元组。
 */
const parseSortKey = (sortKey: SortKey): [string, "asc" | "desc"] => {
  const parts = sortKey.split("_");
  const direction = parts.pop() as "asc" | "desc";
  const order = parts.join("_");
  return [order, direction];
};

/**
 * @description 定义上传器需要暴露给Store的回调函数接口。
 */
export interface UploaderActions {
  addResumableTaskFromFileItem: (fileItem: FileItem) => Promise<void>;
}

export const useFileStore = defineStore("file", {
  /**
   * @description [适配游標分頁] 初始化Store的状态，使用nextToken和hasMore代替旧的pagination对象。
   */
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
    hasMore: true
  }),

  getters: {
    /**
     * @description 计算并返回当前路径的面包屑导航段。
     */
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
    /**
     * @description 根据当前排序规则对文件列表进行前端排序。
     */
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
     * @description 更新文件夹的视图配置。这是改变排序的唯一入口。
     */
    async updateViewConfig() {
      if (!this.currentFolderId) {
        console.warn("无法更新视图配置：currentFolderId 为空。");
        return;
      }
      try {
        const [order, order_direction] = parseSortKey(this.sortKey);
        const newViewConfig: FolderViewConfig = {
          view: this.viewMode,
          order,
          page_size: this.pageSize,
          order_direction
        };
        await updateFolderViewApi(this.currentFolderId, newViewConfig);
      } catch (error) {
        console.error("更新文件夹视图配置时发生网络错误:", error);
        ElMessage.error("保存视图设置失败。");
        throw error;
      }
    },

    /**
     * @description 设置分页大小。先更新后端配置，成功后再强制刷新列表。
     * @param {number} size - 新的页面大小。
     */
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

    /**
     * @description 设置排序规则。先更新后端配置，成功后再强制刷新列表。
     * @param {SortKey} key - 新的排序键。
     */
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

    /**
     * @description 设置视图模式（列表/网格），并更新到后端。
     * @param {'list' | 'grid'} mode - 新的视图模式。
     */
    setViewMode(mode: "list" | "grid") {
      if (this.viewMode === mode) return;
      this.viewMode = mode;
      this.updateViewConfig();
    },

    /**
     * @description 核心函数，适配后端驱动的排序和游标分页。
     * @param {string} pathToLoad - 需要加载的目标路径URI。
     * @param {UploaderActions} uploader - 上传器实例的回调。
     * @param {boolean} [isRefresh=false] - 是否为刷新操作。true表示强制从头加载。
     */
    async loadFiles(
      pathToLoad: string,
      uploader: UploaderActions,
      isRefresh: boolean = false
    ) {
      if (!isRefresh && (this.isMoreLoading || !this.hasMore)) {
        return;
      }
      if (isRefresh) {
        this.loading = true;
        this.path = extractLogicalPathFromUri(pathToLoad || "/");
        this.nextToken = null;
      } else {
        this.isMoreLoading = true;
      }

      try {
        const response = await fetchFilesByPathApi(this.path, this.nextToken);

        if (response.code === 200 && response.data) {
          const { files, parent, pagination, props, storage_policy, view } =
            response.data;

          if (isRefresh) {
            this.files = [];
          }

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

          if (view) {
            this.viewMode = view.view;
            this.pageSize = view.page_size;
            this.sortKey = `${view.order}_${view.order_direction}` as SortKey;
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

    /**
     * @description 刷新当前路径，强制从头开始加载。
     * @param {UploaderActions} uploader - 上传器回调。
     */
    async refreshCurrentPath(uploader: UploaderActions) {
      await this.loadFiles(this.path, uploader, true);
    },

    /**
     * @description 从当前状态中移除指定ID的文件，用于删除操作后的UI更新。
     * @param {string[]} fileIds - 需要被移除的文件ID数组。
     */
    removeFilesFromState(fileIds: string[]) {
      const idsToRemove = new Set(fileIds);
      this.files = this.files.filter(file => !idsToRemove.has(file.id));
    },

    /**
     * @description 更新状态中指定文件的信息，用于重命名等操作后的UI更新。
     * @param {FileItem} updatedFile - 已更新的文件对象。
     */
    updateFileInState(updatedFile: FileItem) {
      const index = this.files.findIndex(file => file.id === updatedFile.id);
      if (index !== -1) {
        this.files[index] = { ...this.files[index], ...updatedFile };
      }
    },

    /**
     * @description 创建文件或文件夹的内部通用方法。
     * @param {FileType} type - 创建类型，文件或文件夹。
     * @param {string} name - 新建项目的名称。
     */
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

    /**
     * @description 创建一个新文件。
     * @param {string} name - 文件名。
     */
    async createFile(name: string) {
      await this._createItem(FileType.File, name);
    },

    /**
     * @description 创建一个新文件夹。
     * @param {string} name - 文件夹名称。
     */
    async createFolder(name: string) {
      await this._createItem(FileType.Dir, name);
    }
  }
});
