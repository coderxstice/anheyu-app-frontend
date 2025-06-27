/*
 * @Description: 文件操作的组合式函数
 * @Author: 安知鱼
 * @Date: 2025-06-25 09:49:46
 * @LastEditTime: 2025-06-28 03:46:41
 * @LastEditors: 安知鱼
 */
import { useFileStore } from "@/store/modules/fileStore";
import { ElMessage, ElMessageBox } from "element-plus";
import { nextTick, type Ref } from "vue";
import type { UploadItem, FileItem } from "@/api/sys-file/type";
import { deleteFilesApi, renameFileApi } from "@/api/sys-file/sys-file"; // 引入新的 API 函数

/**
 * 这是一个组合式函数，返回一组可复用的文件操作方法。
 * 它依赖于外部传入的上传功能和当前路径。
 *
 * @param addUploadsToQueue - 一个能将文件添加至上传队列的函数。
 * @param currentPath - 一个包含当前文件浏览器路径的响应式引用 (Ref)。
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
  currentPath: Ref<string>
) {
  console.log(
    "%c[Check-1A useFileActions] Hook Initialized. Current Path:",
    "color: blue; font-weight: bold;",
    currentPath.value
  );
  const fileStore = useFileStore();

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
          // **核心修复**: 使用 webkitRelativePath 作为 UI 显示名称，以保持目录结构可见。
          // 这与 useDirectoryUpload.ts (拖拽上传) 的逻辑保持了一致。
          name: file.webkitRelativePath || file.name,
          size: file.size,
          targetPath: currentPath.value,
          // `relativePath` 用于后端重建目录，此字段已正确。
          relativePath: file.webkitRelativePath || file.name,
          needsRefresh: true
        }));
        addUploadsToQueue(newUploads as any);
      }
    };
    input.click();
  };

  const handleUploadFile = () => {
    _triggerUpload(false);
  };

  const handleUploadDir = () => {
    _triggerUpload(true);
  };

  const handleCreateFile = (ext: "md" | "txt") => {
    const defaultFileName = `新文件.${ext}`;
    ElMessageBox.prompt("请输入文件名", "创建文件", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputValue: defaultFileName,
      inputPattern: /^[^\s\\/:*?"<>|]+$/,
      inputErrorMessage: "文件名不能包含特殊字符"
    })
      .then(({ value }) => {
        fileStore.createFile(value);
      })
      .catch(() => {
        ElMessage.info("已取消创建");
      });

    nextTick(() => {
      const inputElement = document.querySelector(
        ".el-message-box__input input"
      ) as HTMLInputElement;
      if (inputElement) {
        const dotIndex = defaultFileName.lastIndexOf(".");
        if (dotIndex > 0) {
          inputElement.setSelectionRange(0, dotIndex);
        } else {
          inputElement.select();
        }
        inputElement.focus();
      }
    });
  };

  const handleCreateFolder = () => {
    const defaultFolderName = `新建文件夹`;
    ElMessageBox.prompt("请输入文件夹名称", "创建文件夹", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputValue: defaultFolderName,
      inputPattern: /^[^\s\\/:*?"<>|]+$/,
      inputErrorMessage: "文件夹名不能包含特殊字符"
    })
      .then(({ value }) => {
        fileStore.createFolder(value);
      })
      .catch(() => {
        ElMessage.info("已取消创建");
      });

    nextTick(() => {
      const inputElement = document.querySelector(
        ".el-message-box__input input"
      ) as HTMLInputElement;
      if (inputElement) {
        inputElement.select();
        inputElement.focus();
      }
    });
  };

  const handleRename = (item: FileItem) => {
    ElMessageBox.prompt("请输入新名称", `重命名`, {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputValue: item.name,
      inputValidator: (val: string) =>
        val && val.length > 0 && !val.includes("/")
          ? true
          : '文件名不能为空且不能包含 "/"'
    })
      .then(async ({ value }) => {
        if (value === item.name) return;

        try {
          const response = await renameFileApi(item.id, value);

          if (response.code === 200) {
            ElMessage.success(response.message || "重命名成功");
            // 调用 store action 直接更新 UI
            fileStore.updateFileInState(response.data);
          } else {
            // 处理特定错误，如冲突
            if (response.code === 409) {
              ElMessage.error(`重命名失败：已存在同名文件或文件夹 '${value}'`);
            } else {
              ElMessage.error(response.message || "重命名失败");
            }
          }
        } catch (error: any) {
          console.error("重命名操作失败:", error);
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
        const fileName = item.name;
        const dotIndex = fileName.lastIndexOf(".");
        // 检查是否为文件且有扩展名
        if (item.type !== 2 && dotIndex > 0) {
          inputElement.setSelectionRange(0, dotIndex);
        } else {
          inputElement.select();
        }
        inputElement.focus();
      }
    });
  };

  const handleDelete = (files: FileItem[]) => {
    if (!files || files.length === 0) {
      ElMessage.warning("请先选择要删除的项目。");
      return;
    }
    const names = files.map(f => `'${f.name}'`).join("、");
    const message = `确定要永久删除这 ${files.length} 个项目吗：${names}？此操作不可恢复！`;
    ElMessageBox.confirm(message, "删除确认", {
      confirmButtonText: "确定删除",
      cancelButtonText: "取消",
      type: "warning"
    })
      .then(async () => {
        try {
          const idsToDelete = files.map(f => f.id);
          const response = await deleteFilesApi(idsToDelete);

          if (response.code === 200) {
            ElMessage.success(response.message || "项目已删除");
            // 调用 store action 直接更新 UI
            fileStore.removeFilesFromState(idsToDelete);
          } else {
            ElMessage.error(response.message || "删除失败");
          }
        } catch (error: any) {
          console.error("删除操作失败:", error);
          ElMessage.error(error.message || "删除时发生错误");
        }
      })
      .catch(() => {
        ElMessage.info("已取消删除操作");
      });
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
