/*
 * @Description: 封装文件和文件夹的创建、重命名和删除等操作
 * @Author: 安知鱼
 * @Date: 2025-06-25 14:26:59
 * @LastEditTime: 2025-07-02 14:41:06
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

/**
 * @description: useFileActions 的回调函数接口
 */
export interface FileActionCallbacks {
  /**
   * @description: 当操作（如创建、重命名、删除）成功后触发，通常用于刷新列表
   */
  onSuccess: () => void;
  /**
   * @description: 当添加新上传任务后触发
   * @param {boolean} hasAdded - 指示是否至少有一个新任务被成功添加到队列中
   */
  onNewUploads: (hasAdded: boolean) => void;
}

/**
 * @description: 封装文件和文件夹相关操作的 Hook
 * @param addUploadsToQueue - 一个能将文件添加至上传队列的函数，现在应返回 Promise<boolean>
 * @param currentPath - 一个包含当前文件浏览器路径的响应式引用 (Ref)
 * @param callbacks - 包含各种操作回调函数的对象
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
  ) => Promise<boolean>, // 确认函数签名返回 Promise<boolean>
  currentPath: Ref<string>,
  callbacks: FileActionCallbacks
) {
  /**
   * @description: 内部函数，通过创建隐藏的 input[type=file] 元素来触发文件/文件夹选择
   * @param {boolean} isDir - 如果为 true，则启用文件夹选择模式 (webkitdirectory)
   */
  const _triggerUpload = (isDir: boolean) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    if (isDir) {
      input.webkitdirectory = true;
    }
    // 将 onchange 事件处理器改为 async 以便使用 await
    input.onchange = async e => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const newUploads = Array.from(files).map(file => {
          console.log(`[Upload Debug] 正在处理文件 (按钮点击):`, {
            name: file.name,
            webkitRelativePath: file.webkitRelativePath,
            size: file.size
          });

          const fileName = file.name;
          const relativePath = file.webkitRelativePath || fileName;

          return {
            file: file,
            name: fileName,
            size: file.size,
            targetPath: currentPath.value,
            relativePath: relativePath,
            needsRefresh: true
          };
        });

        // 等待 addUploadsToQueue 完成，并获取是否成功添加了任务的结果
        const hasAdded = await addUploadsToQueue(newUploads as any);
        // 调用新的回调函数，通知父组件处理 UI 变化（如显示上传面板）
        callbacks.onNewUploads(hasAdded);
      }
    };
    input.click();
  };

  /**
   * @description: 触发上传文件对话框
   */
  const handleUploadFile = () => _triggerUpload(false);

  /**
   * @description: 触发上传文件夹对话框
   */
  const handleUploadDir = () => _triggerUpload(true);

  /**
   * @description: 内部函数，处理创建文件或文件夹的通用逻辑
   * @param {"file" | "folder"} type - 创建类型
   * @param {string} promptTitle - ElMessageBox 提示框的标题
   * @param {string} defaultName - 输入框中的默认名称
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

  /**
   * @description: 触发创建文件对话框
   * @param {"md" | "txt"} ext - 文件扩展名
   */
  const handleCreateFile = (ext: "md" | "txt") =>
    _handleCreate("file", "文件", `新文件.${ext}`);

  /**
   * @description: 触发创建文件夹对话框
   */
  const handleCreateFolder = () =>
    _handleCreate("folder", "文件夹", `新建文件夹`);

  /**
   * @description: 处理重命名操作
   * @param {FileItem} item - 要重命名的文件项
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

  /**
   * @description: 处理删除操作
   * @param {FileItem[]} files - 要删除的文件项数组
   * @returns {Promise<boolean>} - 操作是否成功
   */
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
