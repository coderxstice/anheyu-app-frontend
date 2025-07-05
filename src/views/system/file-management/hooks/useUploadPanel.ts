import { ref, watch, type Ref } from "vue";
import { ElMessageBox } from "element-plus";
import type { UploadItem } from "@/api/sys-file/type";

interface UseUploadPanelOptions {
  uploadQueue: UploadItem[];
  showUploadProgress: Ref<boolean>;
  getConcurrency: () => number;
  removeItem: (id: string) => void;
  retryAllFailed: () => void;
  clearFinishedUploads: () => void;
  setGlobalOverwriteAndRetry: (value: boolean) => void;
  setConcurrency: (value: number) => void;
  // 修正：将 'total' 改为 'instant' 以匹配 useFileUploader.ts 中的定义
  setSpeedMode: (value: "instant" | "average") => void;
}

export function useUploadPanel({
  uploadQueue,
  showUploadProgress,
  getConcurrency,
  removeItem,
  retryAllFailed,
  clearFinishedUploads,
  setGlobalOverwriteAndRetry,
  setConcurrency,
  setSpeedMode
}: UseUploadPanelOptions) {
  const isPanelVisible = ref(false);
  const isPanelCollapsed = ref(false);

  const handleNewUploadsAdded = (hasAdded: boolean) => {
    if (hasAdded) {
      isPanelVisible.value = true;
      isPanelCollapsed.value = false;
    }
  };

  watch(showUploadProgress, isVisible => {
    if (!isVisible) {
      isPanelVisible.value = false;
    }
  });

  const handlePanelClose = () => {
    if (
      uploadQueue.some(item =>
        ["uploading", "pending", "error", "conflict"].includes(item.status)
      )
    ) {
      ElMessageBox.confirm(
        "关闭面板会取消所有进行中和待处理的上传任务，确定吗？",
        "警告",
        { confirmButtonText: "确定", cancelButtonText: "取消", type: "warning" }
      )
        .then(() => {
          [...uploadQueue].forEach(item => {
            if (item.status !== "success" && item.status !== "canceled") {
              removeItem(item.id);
            }
          });
          isPanelVisible.value = false;
        })
        .catch(() => {});
    } else {
      isPanelVisible.value = false;
    }
  };

  const handleUploadGlobalCommand = (command: string, value: any) => {
    switch (command) {
      case "set-overwrite-all":
        setGlobalOverwriteAndRetry(value);
        break;
      case "retry-all":
        retryAllFailed();
        break;
      case "clear-finished":
        clearFinishedUploads();
        break;
      case "set-concurrency":
        ElMessageBox.prompt("请输入新的并行上传数 (1-10)", "设置并发数", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          inputValue: String(getConcurrency()),
          inputPattern: /^[1-9]$|^10$/,
          inputErrorMessage: "请输入 1 到 10 之间的整数"
        })
          .then(({ value }) => {
            setConcurrency(Number(value));
          })
          .catch(() => {});
        break;
      case "set-speed-mode":
        setSpeedMode(value);
        break;
    }
  };

  return {
    isPanelVisible,
    isPanelCollapsed,
    handlePanelClose,
    handleUploadGlobalCommand,
    handleNewUploadsAdded
  };
}
