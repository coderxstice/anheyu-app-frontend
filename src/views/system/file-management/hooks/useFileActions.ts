/*
 * @Description: 文件操作的组合式函数
 * @Author: 安知鱼
 * @Date: 2025-06-25 09:49:46
 * @LastEditTime: 2025-06-26 18:40:34
 * @LastEditors: 安知鱼
 */
import { useFileStore } from "@/store/modules/fileStore";
import { ElMessage, ElMessageBox } from "element-plus";
import { nextTick, type Ref } from "vue"; // 引入 nextTick 和 Ref 类型
import type { UploadItem, FileItem } from "@/api/sys-file/type"; // 引入类型

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
      "id" | "status" | "progress" | "uploadedChunks" | "abortController"
    >[]
  ) => void,
  currentPath: Ref<string>
) {
  const fileStore = useFileStore();

  /**
   * 内部辅助函数，用于创建和触发文件/目录选择框
   * @param isDir - 是否为目录上传
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
          name: file.name,
          size: file.size,
          targetPath: currentPath.value, // 使用传入的响应式路径的当前值
          relativePath: file.webkitRelativePath || file.name,
          needsRefresh: true
        }));
        // 调用从外部传入的上传函数
        addUploadsToQueue(newUploads);
      }
    };
    input.click();
  };

  /**
   * 触发文件选择框进行文件上传
   */
  const handleUploadFile = () => {
    _triggerUpload(false);
  };

  /**
   * 触发文件选择框进行目录上传
   */
  const handleUploadDir = () => {
    _triggerUpload(true);
  };

  /**
   * 创建新文件
   * @param ext - 文件扩展名，如 'md' 或 'txt'
   */
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
        // 调用 store 中的方法来创建文件
        fileStore.createFile(value);
      })
      .catch(() => {
        ElMessage.info("已取消创建");
      });

    // 使用 nextTick 在 DOM 更新后尝试聚焦并选中文件名部分
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

  /**
   * 创建新文件夹
   */
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
        // 调用 store 中的方法来创建文件夹
        fileStore.createFolder(value);
      })
      .catch(() => {
        ElMessage.info("已取消创建");
      });

    // 使用 nextTick 在 DOM 更新后尝试聚焦并全选输入框内容
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

  /**
   * 重命名文件或文件夹
   * @param file - 要重命名的文件对象
   */
  const handleRename = (file: FileItem) => {
    console.log("重命名文件:", file);
    ElMessageBox.prompt("请输入新名称", `重命名 ${file.name}`, {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputValue: file.name,
      inputPattern: /^[^\s\\/:*?"<>|]+$/,
      inputErrorMessage: "名称不能包含特殊字符"
    })
      .then(({ value }) => {
        console.log(`将 ${file.name} 重命名为 ${value}`);
        // 这里应该调用一个 store 中的 action 来处理重命名API调用
        // 例如: fileStore.renameItem(file.id, value);
        ElMessage.success(`已请求重命名为 ${value}`);
        // 成功后重新加载文件列表
        // fileStore.loadFiles(fileStore.path);
      })
      .catch(() => {
        ElMessage.info("已取消重命名");
      });

    nextTick(() => {
      const inputElement = document.querySelector(
        ".el-message-box__input input"
      ) as HTMLInputElement;
      if (inputElement) {
        const fileName = file.name;
        const dotIndex = fileName.lastIndexOf(".");
        // 检查是否为文件且有扩展名
        if (file.type !== 0 && dotIndex > 0) {
          // 假设 0 是文件夹类型
          inputElement.setSelectionRange(0, dotIndex);
        } else {
          inputElement.select();
        }
        inputElement.focus();
      }
    });
  };

  /**
   * 删除一个或多个文件/文件夹
   * @param files - 要删除的文件对象数组
   */
  const handleDelete = (files: FileItem[]) => {
    if (!files || files.length === 0) {
      ElMessage.warning("请先选择要删除的文件。");
      return;
    }
    console.log("删除文件:", files);
    const names = files.map(f => f.name).join("、");
    ElMessageBox.confirm(
      `确定要删除选中的 ${files.length} 个项目吗：${names}？此操作不可恢复！`,
      "删除确认",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(() => {
        console.log("执行删除操作");
        // 这里应该调用一个 store 中的 action 来处理批量删除API调用
        // const idsToDelete = files.map(f => f.id);
        // fileStore.deleteItems(idsToDelete);
        ElMessage.success("删除请求已发送");
        // 成功后重新加载文件列表
        // fileStore.loadFiles(fileStore.path);
      })
      .catch(() => {
        ElMessage.info("已取消删除");
      });
  };

  // 返回所有可供外部调用的操作函数
  return {
    handleUploadFile,
    handleUploadDir,
    handleCreateFile,
    handleCreateFolder,
    handleRename,
    handleDelete
  };
}
