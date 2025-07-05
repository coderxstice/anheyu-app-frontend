/*
 * @Description: 管理与文件操作相关的弹窗（移动、复制、详情）的状态和逻辑
 * @Author: 安知鱼
 * @Date: 2025-06-28 16:53:31
 * @LastEditTime: 2025-07-05 12:21:33
 * @LastEditors: 安知鱼
 */
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { getFileDetailsApi } from "@/api/sys-file/sys-file";
import type { FileItem } from "@/api/sys-file/type";

/**
 * useFileModals Hook 的构造选项
 */
interface UseFileModalsOptions {
  /** 一个返回当前选中文件项数组的函数 */
  getSelectedItems: () => FileItem[];
  /** 刷新文件列表的回调 */
  refresh: () => void;
  /** 清空选择的回调 */
  clearSelection: () => void;
}

/**
 * @description 管理文件操作相关弹窗的组合式函数
 * @param {UseFileModalsOptions} options - 包含所有依赖项和回调函数的选项对象
 */
export function useFileModals({
  getSelectedItems,
  refresh,
  clearSelection
}: UseFileModalsOptions) {
  // --- “移动/复制到”弹窗的状态 ---
  const isDestinationModalVisible = ref(false);
  const itemsForAction = ref<FileItem[]>([]);
  const destinationModalMode = ref<"move" | "copy">("move");

  // --- 详情侧边栏的状态 ---
  const detailsPanelFile = ref<FileItem | null>(null);

  /**
   * @description 触发“移动”操作，打开目标选择弹窗
   */
  const onActionMove = () => {
    const selectedItems = getSelectedItems();
    if (selectedItems.length === 0) {
      ElMessage.warning("请至少选择一个要移动的项目。");
      return;
    }
    itemsForAction.value = selectedItems;
    destinationModalMode.value = "move";
    isDestinationModalVisible.value = true;
  };

  /**
   * @description 触发“复制”操作，打开目标选择弹窗
   */
  const onActionCopy = () => {
    const selectedItems = getSelectedItems();
    if (selectedItems.length === 0) {
      ElMessage.warning("请至少选择一个要复制的项目。");
      return;
    }
    itemsForAction.value = selectedItems;
    destinationModalMode.value = "copy";
    isDestinationModalVisible.value = true;
  };

  /**
   * @description 当移动或复制成功时的回调处理
   * @param payload - 包含操作模式的对象
   */
  const handleActionSuccess = (payload: { mode: "move" | "copy" }) => {
    isDestinationModalVisible.value = false;
    refresh();
    clearSelection();
    const message = payload.mode === "move" ? "移动成功" : "复制成功";
    ElMessage.success(message);
  };

  /**
   * @description 根据文件ID获取详情并打开侧边栏
   * @param id - 文件ID
   */
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

  /**
   * @description 关闭详情侧边栏
   */
  const closeDetailsPanel = () => {
    detailsPanelFile.value = null;
  };

  return {
    isDestinationModalVisible,
    itemsForAction,
    destinationModalMode,
    onActionMove,
    onActionCopy,
    handleActionSuccess,

    detailsPanelFile,
    handleShowDetailsForId,
    closeDetailsPanel
  };
}
