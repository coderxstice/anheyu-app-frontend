import { ref } from "vue";
import { ElMessage } from "element-plus";
import { getFileDetailsApi } from "@/api/sys-file/sys-file";
import type { FileItem } from "@/api/sys-file/type";

interface UseFileModalsOptions {
  getSelectedItems: () => FileItem[];
  refresh: () => void;
  clearSelection: () => void;
}

export function useFileModals({
  getSelectedItems,
  refresh,
  clearSelection
}: UseFileModalsOptions) {
  const isDestinationModalVisible = ref(false);
  const itemsForAction = ref<FileItem[]>([]);
  const destinationModalMode = ref<"move" | "copy">("move");
  const detailsPanelFile = ref<FileItem | null>(null);

  const onActionMove = () => {
    const selectedItems = getSelectedItems();
    if (selectedItems.length === 0)
      return ElMessage.warning("请至少选择一个要移动的项目。");
    itemsForAction.value = selectedItems;
    destinationModalMode.value = "move";
    isDestinationModalVisible.value = true;
  };

  const onActionCopy = () => {
    const selectedItems = getSelectedItems();
    if (selectedItems.length === 0)
      return ElMessage.warning("请至少选择一个要复制的项目。");
    itemsForAction.value = selectedItems;
    destinationModalMode.value = "copy";
    isDestinationModalVisible.value = true;
  };

  const handleActionSuccess = (payload: { mode: "move" | "copy" }) => {
    isDestinationModalVisible.value = false;
    refresh();
    clearSelection();
    ElMessage.success(payload.mode === "move" ? "移动成功" : "复制成功");
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
