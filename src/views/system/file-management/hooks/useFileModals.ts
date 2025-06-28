// src/views/system/file-management/hooks/useFileModals.ts

import { ref } from "vue";
import { ElMessage } from "element-plus";
import { getFileDetailsApi } from "@/api/sys-file/sys-file";
import type { FileItem } from "@/api/sys-file/type";

interface ModalActions {
  refresh: () => void;
  clearSelection: () => void;
}

export function useFileModals(actions: ModalActions) {
  // --- 改造: 状态更名，并增加 mode 状态 ---
  const isDestinationModalVisible = ref(false);
  const itemsForAction = ref<FileItem[]>([]);
  const destinationModalMode = ref<"move" | "copy">("move");

  // 详情面板的状态 (无变化)
  const detailsPanelFile = ref<FileItem | null>(null);

  const onActionMove = (getSelectedFileItems: () => FileItem[]) => {
    const selectedItems = getSelectedFileItems();
    if (selectedItems.length === 0) return;
    itemsForAction.value = selectedItems;
    destinationModalMode.value = "move"; // 设置为移动模式
    isDestinationModalVisible.value = true;
  };

  // --- 新增: onActionCopy 函数 ---
  const onActionCopy = (getSelectedFileItems: () => FileItem[]) => {
    const selectedItems = getSelectedFileItems();
    if (selectedItems.length === 0) return;
    itemsForAction.value = selectedItems;
    destinationModalMode.value = "copy"; // 设置为复制模式
    isDestinationModalVisible.value = true;
  };

  // --- 改造: handleMoveSuccess 更名为 handleActionSuccess ---
  const handleActionSuccess = (payload: { mode: "move" | "copy" }) => {
    isDestinationModalVisible.value = false;
    actions.refresh();
    actions.clearSelection();
    const message = payload.mode === "move" ? "移动成功" : "复制成功";
    ElMessage.success(message);
  };

  const handleShowDetailsForId = async (id: string) => {
    try {
      const response = await getFileDetailsApi(id);
      if (response.code === 200 && response.data) {
        detailsPanelFile.value = response.data;
      } else {
        ElMessage.error(response.message || "获取文件详情失败");
      }
    } catch (error: any) {
      ElMessage.error(error.message || "请求文件详情时发生错误");
    }
  };

  const closeDetailsPanel = () => {
    detailsPanelFile.value = null;
  };

  return {
    // --- 改造: 导出的属性和方法名更新 ---
    isDestinationModalVisible,
    itemsForAction,
    destinationModalMode,
    onActionMove,
    onActionCopy, // 新增导出
    handleActionSuccess,
    // 详情面板
    detailsPanelFile,
    handleShowDetailsForId,
    closeDetailsPanel
  };
}
