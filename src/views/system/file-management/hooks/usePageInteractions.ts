/*
 * @Description: 管理页面级别的交互，如拖拽上传的UI状态、搜索和点击空白区域。
 * @Author: 安知鱼
 * @Date: 2025-06-25 14:26:59
 * @LastEditTime: 2025-07-21 15:35:15
 * @LastEditors: 安知鱼
 */
import { ref, type Ref } from "vue";
import type { FileItem } from "@/api/sys-file/type";

/**
 * 定义 usePageInteractions hook 的选项参数类型
 */
interface UsePageInteractionsOptions {
  onDrop: (event: DragEvent) => void;
  detailsPanelFile: Ref<FileItem | null>;
  hasSelection: Ref<boolean>;
  clearSelection: () => void;
}

/**
 * @description: 管理页面级别的交互状态，如拖拽上传、搜索和点击空白区域。
 * @param {UsePageInteractionsOptions} options - 包含所有依赖项和回调函数的选项对象。
 */
export function usePageInteractions({
  onDrop,
  detailsPanelFile,
  hasSelection,
  clearSelection
}: UsePageInteractionsOptions) {
  const isDragging = ref(false);
  const isSearchVisible = ref(false);

  // 关键修复：将 searchOrigin 的类型改回坐标对象
  const searchOrigin = ref({ x: 0, y: 0 });

  let dragCounter = 0;

  const dragHandlers = {
    onDragEnter: (event: DragEvent) => {
      event.preventDefault();
      dragCounter++;
      if (event.dataTransfer?.types.includes("Files")) {
        isDragging.value = true;
      }
    },
    onDragOver: (event: DragEvent) => {
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }
    },
    onDragLeave: (event: DragEvent) => {
      event.preventDefault();
      if (
        !(event.currentTarget as HTMLElement).contains(
          event.relatedTarget as Node
        )
      ) {
        dragCounter = 0;
        isDragging.value = false;
      } else {
        dragCounter--;
        if (dragCounter <= 0) {
          isDragging.value = false;
        }
      }
    },
    onDrop: (event: DragEvent) => {
      event.preventDefault();
      isDragging.value = false;
      dragCounter = 0;
      onDrop(event);
    }
  };

  /**
   * @description: 从一个鼠标事件中获取坐标，并打开搜索浮层。
   * @param {MouseEvent} event - DOM 鼠标事件对象。
   */
  const openSearchFromElement = (event: MouseEvent) => {
    // 存储事件的 clientX/Y 坐标，而不是 DOM 元素
    searchOrigin.value = {
      x: event.clientX,
      y: event.clientY
    };
    isSearchVisible.value = true;
  };

  const handleContainerClick = (event: MouseEvent) => {
    if (
      detailsPanelFile.value &&
      (event.target as HTMLElement).closest(".details-panel-drawer")
    ) {
      return;
    }
    if (!hasSelection.value) return;

    const ignoredSelectors = [
      ".file-item",
      ".grid-item",
      "[role=button]",
      "[role=menu]",
      "[role=listbox]",
      "input",
      "button",
      ".el-button",
      ".el-popper",
      ".el-overlay",
      ".upload-progress-panel",
      ".context-menu",
      ".search-overlay-container"
    ];

    if (
      ignoredSelectors.some(selector =>
        (event.target as HTMLElement).closest(selector)
      )
    ) {
      return;
    }

    clearSelection();
  };

  return {
    isDragging,
    dragHandlers,
    isSearchVisible,
    searchOrigin,
    openSearchFromElement,
    handleContainerClick
  };
}
