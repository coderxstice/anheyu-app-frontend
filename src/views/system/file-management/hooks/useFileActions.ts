/*
 * @Description: 封装文件和文件夹的创建、重命名和删除等操作
 * @Author: 安知鱼
 * @Date: 2025-06-25 14:26:59
 * @LastEditTime: 2025-07-02 10:05:33
 * @LastEditors: 安知鱼
 */
import { ElMessage, ElMessageBox } from "element-plus";
import { nextTick, type Ref } from "vue";
import type { UploadItem, FileItem } from "@/api/sys-file/type";
import {
  createItemApi,
  deleteFilesApi,
  renameFileApi
} from "@/api/sys-file/sys-file";
import { FileType } from "@/api/sys-file/type";

export interface FileActionCallbacks {
  onSuccess: () => void;
}

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
        const newUploads = Array.from(files).map(file => {
          console.log(`[Upload Debug] 正在处理文件 (按钮点击):`, {
            name: file.name,
            webkitRelativePath: file.webkitRelativePath,
            size: file.size
          });

          const fileName = file.name;
          // [统一逻辑] 确保当 webkitRelativePath 为空时，使用文件名作为相对路径
          const relativePath = file.webkitRelativePath || fileName;

          return {
            file: file,
            name: fileName, // UI显示名称
            size: file.size,
            targetPath: currentPath.value,
            relativePath: relativePath, // 后端路径
            needsRefresh: true
          };
        });
        addUploadsToQueue(newUploads as any); // as any 可能是为了绕过类型检查，请注意
      }
    };
    input.click();
  };

  const handleUploadFile = () => _triggerUpload(false);
  const handleUploadDir = () => _triggerUpload(true);

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
          const response = await createItemApi(
            itemType,
            `${currentPath.value}/${value}`
          );
          if (response.code === 200) {
            ElMessage.success("创建成功");
            callbacks.onSuccess();
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
        const dotIndex = defaultName.lastIndexOf(".");
        if (type === "file" && dotIndex > 0)
          inputElement.setSelectionRange(0, dotIndex);
        else inputElement.select();
        inputElement.focus();
      }
    });
  };

  const handleCreateFile = (ext: "md" | "txt") =>
    _handleCreate("file", "文件", `新文件.${ext}`);
  const handleCreateFolder = () =>
    _handleCreate("folder", "文件夹", `新建文件夹`);

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
            callbacks.onSuccess();
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
        if (item.type !== FileType.Dir && dotIndex > 0)
          inputElement.setSelectionRange(0, dotIndex);
        else inputElement.select();
        inputElement.focus();
      }
    });
  };

  const handleDelete = async (files: FileItem[]): Promise<boolean> => {
    if (!files || files.length === 0) {
      ElMessage.warning("请先选择要删除的项目。");
      return false;
    }
    const names = files.map(f => `'${f.name}'`).join("、");
    try {
      await ElMessageBox.confirm(
        `确定要永久删除这 ${files.length} 个项目吗：${names}？此操作不可恢复！`,
        "删除确认",
        {
          type: "warning",
          confirmButtonText: "确定删除",
          cancelButtonText: "取消"
        }
      );
      try {
        const response = await deleteFilesApi(files.map(f => f.id));
        if (response.code === 200) {
          ElMessage.success("项目已删除");
          callbacks.onSuccess();
          return true;
        } else {
          ElMessage.error(response.message || "删除失败");
          return false;
        }
      } catch (error: any) {
        ElMessage.error(error.message || "删除时发生错误");
        return false;
      }
    } catch {
      ElMessage.info("已取消删除操作");
      return false;
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
