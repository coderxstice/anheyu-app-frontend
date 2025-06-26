/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-26 18:32:20
 * @LastEditTime: 2025-06-26 18:33:19
 * @LastEditors: 安知鱼
 */
import { ref, computed, type Ref } from "vue";
import type { FileItem } from "@/api/sys-file/type";

// 这个 Composable 管理一个项目列表的选择状态。
// 它接收一个响应式的文件列表作为其主要依赖。
export function useFileSelection(files: Ref<FileItem[]>) {
  const selectedFiles = ref(new Set<string>());
  const lastSelectedId = ref<string | null>(null);

  const isAllSelected = computed(() => {
    if (files.value.length === 0) return false;
    return selectedFiles.value.size === files.value.length;
  });

  const selectSingle = (fileId: string) => {
    selectedFiles.value.clear();
    selectedFiles.value.add(fileId);
    lastSelectedId.value = fileId;
  };

  const toggleSelection = (fileId: string) => {
    if (selectedFiles.value.has(fileId)) {
      selectedFiles.value.delete(fileId);
      lastSelectedId.value = null; // 或者设为最后一个仍被选中的项
    } else {
      selectedFiles.value.add(fileId);
      lastSelectedId.value = fileId;
    }
  };

  const selectRange = (endId: string) => {
    const anchorId = lastSelectedId.value;
    if (anchorId === null) {
      selectSingle(endId);
      return;
    }

    const allFiles = files.value;
    const anchorIndex = allFiles.findIndex(f => f.id === anchorId);
    const endIndex = allFiles.findIndex(f => f.id === endId);

    if (anchorIndex === -1 || endIndex === -1) return;

    const start = Math.min(anchorIndex, endIndex);
    const end = Math.max(anchorIndex, endIndex);

    for (let i = start; i <= end; i++) {
      selectedFiles.value.add(allFiles[i].id);
    }
  };

  const selectAll = () => {
    selectedFiles.value = new Set(files.value.map(f => f.id));
  };

  const clearSelection = () => {
    selectedFiles.value.clear();
    lastSelectedId.value = null;
  };

  const invertSelection = () => {
    const allIds = new Set(files.value.map(f => f.id));
    const currentSelected = new Set(selectedFiles.value);
    const newSelected = new Set<string>();

    allIds.forEach(id => {
      if (!currentSelected.has(id)) {
        newSelected.add(id);
      }
    });
    selectedFiles.value = newSelected;
  };

  return {
    selectedFiles,
    lastSelectedId,
    isAllSelected,
    selectSingle,
    toggleSelection,
    selectRange,
    selectAll,
    clearSelection,
    invertSelection
  };
}
