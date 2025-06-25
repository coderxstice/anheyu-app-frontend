/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-25 09:49:46
 * @LastEditTime: 2025-06-25 09:49:51
 * @LastEditors: 安知鱼
 */
import { useFileStore } from "@/store/modules/fileStore";
import { ElMessage, ElMessageBox } from "element-plus";

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
    ElMessageBox.prompt("请输入文件名", "创建文件", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputValue: `新文件.${ext}`,
      inputPattern: /^[^\s\/\\:*?"<>|]+$/,
      inputErrorMessage: "文件名不能包含特殊字符"
    })
      .then(({ value }) => {
        // 在这里可以调用 store action 来实际创建文件
        fileStore.createFile(value);
        ElMessage.success(`文件 ${value} 创建成功`);
      })
      .catch(() => {
        ElMessage.info("已取消创建");
      });
  };

  /**
   * 创建新文件夹
   */
  const handleCreateFolder = () => {
    ElMessageBox.prompt("请输入文件夹名称", "创建文件夹", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputValue: `新建文件夹`,
      inputPattern: /^[^\s\/\\:*?"<>|]+$/,
      inputErrorMessage: "文件夹名不能包含特殊字符"
    })
      .then(({ value }) => {
        fileStore.createFolder(value);
        ElMessage.success(`文件夹 ${value} 创建成功`);
      })
      .catch(() => {
        ElMessage.info("已取消创建");
      });
  };

  // ... 未来可以添加更多操作，如重命名、删除等
  const handleRename = file => {
    console.log("重命名文件:", file);
  };
  const handleDelete = files => {
    console.log("删除文件:", files);
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
