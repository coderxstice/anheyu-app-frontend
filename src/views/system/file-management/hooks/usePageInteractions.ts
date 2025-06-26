import { ref } from "vue";

/**
 * 管理页面级别的交互，如拖拽上传和搜索。
 * @param onFilesDropped - 当文件被拖拽到窗口并释放时触发的回调函数。
 */
export function usePageInteractions(onFilesDropped: (files: FileList) => void) {
  const isDragging = ref(false);
  const isSearchVisible = ref(false);

  // **修复**: 将 origin 的类型修改为 { x: number, y: number } 以匹配 SearchOverlay 组件的 prop 定义
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
    },
    onDragLeave: (event: DragEvent) => {
      event.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        isDragging.value = false;
      }
    },
    onDrop: (event: DragEvent) => {
      event.preventDefault();
      isDragging.value = false;
      dragCounter = 0;
      if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
        onFilesDropped(event.dataTransfer.files);
      }
    }
  };

  /**
   * **修复**: 将函数签名修改为接收 MouseEvent，并从事件中直接获取坐标
   * @param event - 从 FileHeard 组件的 @trigger-search 事件中发出的 MouseEvent
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
