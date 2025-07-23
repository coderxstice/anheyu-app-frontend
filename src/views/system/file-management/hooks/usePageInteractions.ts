/*
 * @Description: 管理页面级别的交互，如拖拽上传的UI状态、搜索和点击空白区域。
 * @Author: 安知鱼
 * @Date: 2025-06-25 14:26:59
 * @LastEditTime: 2025-07-23 10:59:56
 * @LastEditors: 安知鱼
 */
import { ref, type Ref } from "vue";
import type { FileInfoResponse } from "@/api/sys-file/type";

/**
 * 定义 usePageInteractions hook 的选项参数类型
 */
interface UsePageInteractionsOptions {
  onDrop: (event: DragEvent) => void;
  detailsPanelFile: Ref<FileInfoResponse | null>;
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
  // Refs
  const isDragging = ref(false);
  const isSearchVisible = ref(false);
  const searchOrigin = ref({ x: 0, y: 0 });

  const containerRef = ref<HTMLElement | null>(null);

  // 拖拽上传逻辑
  let dragCounter = 0;

  const dragHandlers = {
    onDragEnter: (event: DragEvent) => {
      event.preventDefault();
      // 只有当拖拽内容包含文件时才响应
      if (event.dataTransfer?.types.includes("Files")) {
        dragCounter++;
        if (dragCounter > 0) {
          isDragging.value = true;
        }
      }
    },
    onDragOver: (event: DragEvent) => {
      event.preventDefault(); // 必须阻止默认行为，才能触发 onDrop
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }
    },
    onDragLeave: (event: DragEvent) => {
      event.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        isDragging.value = false;
        dragCounter = 0;
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
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    searchOrigin.value = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
    isSearchVisible.value = true;
  };

  /**
   * @description: 处理在容器内的点击事件，用于实现“点击空白处清空选择”。
   * @param {MouseEvent} event - DOM 鼠标事件对象。
   */
  const handleContainerClick = (event: MouseEvent) => {
    // 如果有文件详情面板打开，则不执行清空操作
    if (detailsPanelFile.value) return;
    if (!hasSelection.value) return;

    const target = event.target as HTMLElement;

    // 定义一个需要忽略点击的元素选择器列表
    const ignoredSelectors = [
      ".file-item",
      ".grid-item",
      ".el-button",
      ".el-dropdown",
      ".context-menu",
      ".search-overlay-container",
      ".upload-progress-panel",
      // 任何有 role 属性的交互元素
      "[role='button']",
      "[role='menu']",
      "[role='listbox']",
      // 表单元素
      "input",
      "button",
      "textarea"
    ];

    // 如果点击的目标或其任何父元素匹配了忽略列表，则不执行清空操作
    if (ignoredSelectors.some(selector => target.closest(selector))) {
      return;
    }

    clearSelection();
  };

  return {
    containerRef, // 导出 ref，以便主组件可以绑定
    isDragging,
    dragHandlers,
    isSearchVisible,
    searchOrigin,
    openSearchFromElement,
    handleContainerClick
  };
}
