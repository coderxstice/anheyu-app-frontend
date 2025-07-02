/*
 * @Description: 管理页面级别的交互，如拖拽上传的UI状态和搜索的触发。
 * @Author: 安知鱼
 * @Date: 2025-06-25 14:26:59
 * @LastEditTime: 2025-07-02 14:43:57
 * @LastEditors: 安知鱼
 */
import { ref } from "vue";

/**
 * @description: 管理页面级别的交互状态，如拖拽上传和搜索。
 * @param {(event: DragEvent) => void} onDrop - 当文件或目录被拖拽到窗口并释放时触发的回调函数。
 * 回调函数现在接收完整的 DragEvent 对象，将数据提取的责任交给调用方。
 */
export function usePageInteractions(onDrop: (event: DragEvent) => void) {
  /**
   * @description: 一个响应式引用，指示当前是否有文件或目录正在被拖拽到窗口上方。
   * @type {import('vue').Ref<boolean>}
   */
  const isDragging = ref(false);

  /**
   * @description: 一个响应式引用，控制搜索浮层是否可见。
   * @type {import('vue').Ref<boolean>}
   */
  const isSearchVisible = ref(false);

  /**
   * @description: 一个响应式引用，存储触发搜索浮层时的鼠标坐标，用于定位浮层。
   * @type {import('vue').Ref<{ x: number; y: number }>}
   */
  const searchOrigin = ref({ x: 0, y: 0 });

  // 拖拽计数器，用于正确处理嵌套元素的 dragenter 和 dragleave 事件。
  let dragCounter = 0;

  /**
   * @description: 包含所有拖拽事件处理器的对象，可以直接在模板中使用 `v-on` 或 `@` 进行绑定。
   */
  const dragHandlers = {
    /**
     * @description: 处理 dragenter 事件。增加计数器并设置 isDragging 状态。
     * @param {DragEvent} event - DOM 拖拽事件对象。
     */
    onDragEnter: (event: DragEvent) => {
      event.preventDefault();
      dragCounter++;
      // 仅当拖拽内容包含文件时，才显示拖拽覆盖层
      if (event.dataTransfer?.types.includes("Files")) {
        isDragging.value = true;
      }
    },
    /**
     * @description: 处理 dragover 事件。必须阻止默认行为才能使 drop 事件生效。
     * @param {DragEvent} event - DOM 拖拽事件对象。
     */
    onDragOver: (event: DragEvent) => {
      event.preventDefault();
    },
    /**
     * @description: 处理 dragleave 事件。减少计数器，并在计数器归零时重置 isDragging 状态。
     * @param {DragEvent} event - DOM 拖拽事件对象。
     */
    onDragLeave: (event: DragEvent) => {
      event.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        isDragging.value = false;
      }
    },
    /**
     * @description: 处理 drop 事件。重置状态，并调用传入的 onDrop 回调来处理拖放内容。
     * @param {DragEvent} event - DOM 拖拽事件对象。
     */
    onDrop: (event: DragEvent) => {
      event.preventDefault();
      isDragging.value = false;
      dragCounter = 0;
      // 将完整的 DragEvent 对象传递给外部回调，由外部决定如何处理
      onDrop(event);
    }
  };

  /**
   * @description: 从一个鼠标事件中获取坐标，并打开搜索浮层。
   * @param {MouseEvent} event - DOM 鼠标事件对象。
   */
  const openSearchFromElement = (event: MouseEvent) => {
    searchOrigin.value = {
      x: event.clientX,
      y: event.clientY
    };
    isSearchVisible.value = true;
  };

  return {
    isDragging,
    dragHandlers,
    isSearchVisible,
    searchOrigin,
    openSearchFromElement
  };
}
