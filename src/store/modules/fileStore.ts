import { defineStore } from "pinia";
import { ElMessage } from "element-plus";
import { fetchFilesByPathApi, createItemApi } from "@/api/sys-file/sys-file";
import {
  type FileItem,
  type PaginationInfo,
  type ParentInfo,
  type FileProps,
  type StoragePolicy,
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

// State 接口现在变得更加聚焦
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
    pageSize: 50
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
    // sortedFiles getter 仍然保留，因为它直接关系到 store 中文件的展示
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
      const logicalPath = extractLogicalPathFromUri(pathToLoad || "/");
      this.path = logicalPath;
      // 注意：清空选择不再是 store 的职责。
      // 使用选择 Hook 的组件应该自己调用 `clearSelection()`。

      try {
        const sortParts = this.sortKey.split("_");
        let order = sortParts[0];
        let direction = sortParts[sortParts.length - 1];
        if (sortParts.length > 2) {
          order = sortParts.slice(0, -1).join("_");
        }
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

    async _createItem(type: FileType, name: string) {
      try {
        const fullLogicalPath = joinPath(this.path, name);
        const response = await createItemApi(type, fullLogicalPath);
        const itemType = type === FileType.Dir ? "文件夹" : "文件";

        if (response.code === 200) {
          ElMessage.success(`${itemType} ${name} 创建成功`);
          // 重新加载当前路径的文件列表以显示新项目
          this.loadFiles(this.path);
        } else {
          ElMessage.error(response.message || `${itemType} ${name} 创建失败`);
        }
      } catch (error) {
        const itemType = type === FileType.Dir ? "文件夹" : "文件";
        console.error(`创建${itemType}失败:`, error);
        ElMessage.error(`${itemType} ${name} 创建失败，请检查网络连接或权限。`);
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
