import { ElMessage, ElMessageBox } from "element-plus";
import { nextTick, type Ref } from "vue";
import type { UploadItem, FileItem } from "@/api/sys-file/type";
import {
  createItemApi,
  deleteFilesApi,
  renameFileApi
} from "@/api/sys-file/sys-file";
import { FileType } from "@/api/sys-file/type";

/**
 * 定义 Hook 所需的回调函数接口
 */
export interface FileActionCallbacks {
  onSuccess: () => void; // 一个通用的成功回调，用于刷新列表等
}

/**
 * 这是一个组合式函数，封装了文件和文件夹的创建、重命名和删除等操作。
 * 它不直接操作状态，而是通过回调通知外部。
 *
 * @param addUploadsToQueue - 一个能将文件添加至上传队列的函数。
 * @param currentPath - 一个包含当前文件浏览器路径的响应式引用 (Ref)。
 * @param callbacks - 包含操作成功后回调函数的对象。
 */
export function useFileActions(
  addUploadsToQueue: (
    uploads: Omit<
      UploadItem,
      | "id"
      | "status"
      | "progress"
      | "uploadedChunks"
      | "abortController"
      | "instantSpeed"
      | "averageSpeed"
      | "uploadedSize"
    >[]
  ) => void,
  currentPath: Ref<string>,
  callbacks: FileActionCallbacks
) {
  /**
   * 触发文件或文件夹上传的内部函数
   * @param isDir - 是否为文件夹上传
   */
  const _triggerUpload = (isDir: boolean) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    if (isDir) {
      input.webkitdirectory = true;
    }
    input.onchange = e => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const newUploads = Array.from(files).map(file => ({
          file: file,
          name: file.webkitRelativePath || file.name,
          size: file.size,
          targetPath: currentPath.value,
          relativePath: file.webkitRelativePath || file.name,
          needsRefresh: true
        }));
        addUploadsToQueue(newUploads as any);
      }
    };
    input.click();
  };

  /**
   * 处理文件上传操作
   */
  const handleUploadFile = () => {
    _triggerUpload(false);
  };

  /**
   * 处理文件夹上传操作
   */
  const handleUploadDir = () => {
    _triggerUpload(true);
  };

  /**
   * 通用的创建逻辑
   */
  const _handleCreate = (
    type: "file" | "folder",
    promptTitle: string,
    defaultName: string
  ) => {
    ElMessageBox.prompt(`请输入${promptTitle}名称`, `创建${promptTitle}`, {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputValue: defaultName,
      inputPattern: /^[^\s\\/:*?"<>|]+$/,
      inputErrorMessage: `${promptTitle}名不能包含特殊字符`
    })
      .then(async ({ value }) => {
        try {
          const itemType = type === "folder" ? FileType.Dir : FileType.File;
          // 使用 API 创建项目
          const response = await createItemApi(
            itemType,
            `${currentPath.value}/${value}`
          );
          if (response.code === 200) {
            ElMessage.success("创建成功");
            callbacks.onSuccess(); // 通知外部刷新
          } else {
            ElMessage.error(response.message || "创建失败");
          }
        } catch (error: any) {
          ElMessage.error(error.message || "创建时发生错误");
        }
      })
      .catch(() => {
        ElMessage.info("已取消创建");
      });

    nextTick(() => {
      const inputElement = document.querySelector(
        ".el-message-box__input input"
      ) as HTMLInputElement;
      if (inputElement) {
        if (type === "file") {
          const dotIndex = defaultName.lastIndexOf(".");
          if (dotIndex > 0) inputElement.setSelectionRange(0, dotIndex);
          else inputElement.select();
        } else {
          inputElement.select();
        }
        inputElement.focus();
      }
    });
  };

  /**
   * 处理创建文件
   * @param ext 文件扩展名
   */
  const handleCreateFile = (ext: "md" | "txt") => {
    _handleCreate("file", "文件", `新文件.${ext}`);
  };

  /**
   * 处理创建文件夹
   */
  const handleCreateFolder = () => {
    _handleCreate("folder", "文件夹", `新建文件夹`);
  };

  /**
   * 处理重命名操作
   * @param item 要重命名的文件项
   */
  const handleRename = (item: FileItem) => {
    ElMessageBox.prompt("请输入新名称", "重命名", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputValue: item.name,
      inputValidator: (val: string) =>
        val && val.length > 0 && !/[\\/:*?"<>|]/.test(val)
          ? true
          : "文件名不能为空且不能包含特殊字符"
    })
      .then(async ({ value }) => {
        if (value === item.name) return;
        try {
          const response = await renameFileApi(item.id, value);
          if (response.code === 200) {
            ElMessage.success("重命名成功");
            callbacks.onSuccess(); // 通知外部刷新
          } else {
            ElMessage.error(response.message || "重命名失败");
          }
        } catch (error: any) {
          ElMessage.error(error.message || "重命名时发生错误");
        }
      })
      .catch(() => {
        ElMessage.info("已取消重命名操作");
      });

    nextTick(() => {
      const inputElement = document.querySelector(
        ".el-message-box__input input"
      ) as HTMLInputElement;
      if (inputElement) {
        const dotIndex = item.name.lastIndexOf(".");
        if (item.type !== FileType.Dir && dotIndex > 0) {
          inputElement.setSelectionRange(0, dotIndex);
        } else {
          inputElement.select();
        }
        inputElement.focus();
      }
    });
  };

  /**
   * 处理删除操作
   * @param files 要删除的文件项数组
   * @returns Promise<boolean> - 返回一个布尔值，表示删除操作是否被用户确认并成功执行。
   */
  const handleDelete = async (files: FileItem[]): Promise<boolean> => {
    if (!files || files.length === 0) {
      ElMessage.warning("请先选择要删除的项目。");
      return false; // 操作未执行
    }

    const names = files.map(f => `'${f.name}'`).join("、");
    const message = `确定要永久删除这 ${files.length} 个项目吗：${names}？此操作不可恢复！`;

    try {
      // ElMessageBox.confirm 在用户点击“确定”时会 resolve，点击“取消”或关闭时会 reject。
      await ElMessageBox.confirm(message, "删除确认", {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning"
      });

      // 如果代码能执行到这里，说明用户点击了“确定删除”
      try {
        const idsToDelete = files.map(f => f.id);
        const response = await deleteFilesApi(idsToDelete);
        if (response.code === 200) {
          ElMessage.success("项目已删除");
          callbacks.onSuccess(); // 通知外部刷新
          return true; // 返回 true，表示操作成功
        } else {
          ElMessage.error(response.message || "删除失败");
          return false; // 返回 false，表示API操作失败
        }
      } catch (error: any) {
        ElMessage.error(error.message || "删除时发生错误");
        return false; // 返回 false，表示API操作失败
      }
    } catch {
      // 用户点击了“取消”或关闭了对话框，Promise 会被 reject，进入 catch 块
      ElMessage.info("已取消删除操作");
      return false; // 返回 false，表示用户取消了操作
    }
  };

  return {
    handleUploadFile,
    handleUploadDir,
    handleCreateFile,
    handleCreateFolder,
    handleRename,
    handleDelete
  };
}
