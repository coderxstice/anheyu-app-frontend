/*
 * @Description: 文件操作的组合式函数
 * @Author: 安知鱼
 * @Date: 2025-06-25 09:49:46
 * @LastEditTime: 2025-06-25 19:01:36
 * @LastEditors: 安知鱼
 */
import { useFileStore } from "@/store/modules/fileStore";
import { ElMessage, ElMessageBox } from "element-plus";
import { nextTick } from "vue"; // 引入 nextTick

// 这是一个组合式函数，返回一组可复用的文件操作方法
export function useFileActions() {
  const fileStore = useFileStore();

  /**
   * 触发文件选择框进行文件上传
   */
  const handleUploadFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.onchange = e => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        fileStore.addFilesToUpload(Array.from(files));
      }
    };
    input.click();
  };

  /**
   * 触发文件选择框进行目录上传
   */
  const handleUploadDir = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.webkitdirectory = true;
    input.onchange = e => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        fileStore.addFilesToUpload(Array.from(files));
      }
    };
    input.click();
  };

  /**
   * 创建新文件
   * @param ext 文件扩展名，如 'md' 或 'txt'
   */
  const handleCreateFile = (ext: "md" | "txt") => {
    const defaultFileName = `新文件.${ext}`;
    ElMessageBox.prompt("请输入文件名", "创建文件", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputValue: defaultFileName,
      inputPattern: /^[^\s\/\\:*?"<>|]+$/,
      inputErrorMessage: "文件名不能包含特殊字符"
    })
      .then(({ value }) => {
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
          // 如果有扩展名，则只选中文件名部分
          inputElement.setSelectionRange(0, dotIndex);
        } else {
          // 如果没有扩展名，则全选
          inputElement.select();
        }
        inputElement.focus(); // 确保输入框获得焦点
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
      inputPattern: /^[^\s\/\\:*?"<>|]+$/,
      inputErrorMessage: "文件夹名不能包含特殊字符"
    })
      .then(({ value }) => {
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
        inputElement.select(); // 文件夹名直接全选
        inputElement.focus(); // 确保输入框获得焦点
      }
    });
  };

  const handleRename = (file: { name: string; [key: string]: any }) => {
    console.log("重命名文件:", file);
    ElMessageBox.prompt("请输入新名称", `重命名 ${file.name}`, {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputValue: file.name,
      inputPattern: /^[^\s\/\\:*?"<>|]+$/,
      inputErrorMessage: "名称不能包含特殊字符"
    })
      .then(({ value }) => {
        console.log(`将 ${file.name} 重命名为 ${value}`);
        ElMessage.success(`已请求重命名为 ${value}`);
        // 成功后重新加载文件列表（如果需要的话）
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
        if (dotIndex > 0) {
          // 如果有扩展名，则只选中文件名部分
          inputElement.setSelectionRange(0, dotIndex);
        } else {
          // 如果没有扩展名，则全选
          inputElement.select();
        }
        inputElement.focus(); // 确保输入框获得焦点
      }
    });
  };

  const handleDelete = (files: { name: string; [key: string]: any }[]) => {
    console.log("删除文件:", files);
    const names = files.map(f => f.name).join("、");
    ElMessageBox.confirm(
      `确定要删除选中的 ${files.length} 个文件/文件夹吗：${names}？`,
      "删除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
      .then(() => {
        console.log("执行删除操作");
        ElMessage.success("删除请求已发送");
        // 成功后重新加载文件列表（如果需要的话）
        // fileStore.loadFiles(fileStore.path);
      })
      .catch(() => {
        ElMessage.info("已取消删除");
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
