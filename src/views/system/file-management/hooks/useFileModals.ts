/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-28 16:53:31
 * @LastEditTime: 2025-06-28 16:53:49
 * @LastEditors: 安知鱼
 */
// src/views/system/file-management/hooks/useFileModals.ts

import { ref } from "vue";
import { ElMessage } from "element-plus";
import { getFileDetailsApi } from "@/api/sys-file/sys-file";
import type { FileItem } from "@/api/sys-file/type";

// 这个 Hook 依赖于主组件提供的刷新和清空选择的方法
interface ModalActions {
  refresh: () => void;
  clearSelection: () => void;
}

export function useFileModals(actions: ModalActions) {
  // 移动模态框的状态
  const isMoveModalVisible = ref(false);
  const itemsToMove = ref<FileItem[]>([]);

  // 详情面板的状态
  const detailsPanelFile = ref<FileItem | null>(null);

  const onActionMove = (getSelectedFileItems: () => FileItem[]) => {
    const selectedItems = getSelectedFileItems();
    if (selectedItems.length === 0) return;
    itemsToMove.value = selectedItems;
    isMoveModalVisible.value = true;
  };

  const handleMoveSuccess = () => {
    isMoveModalVisible.value = false;
    actions.refresh();
    actions.clearSelection();
    ElMessage.success("移动成功");
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
    // 移动模态框
    isMoveModalVisible,
    itemsToMove,
    onActionMove,
    handleMoveSuccess,
    // 详情面板
    detailsPanelFile,
    handleShowDetailsForId,
    closeDetailsPanel
  };
}
