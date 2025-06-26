import { ref } from "vue";

/**
 * 管理页面级别的交互，如拖拽上传和搜索。
 * @param onDrop - 当文件或目录被拖拽到窗口并释放时触发的回调函数。
 */
export function usePageInteractions(
  // **修复**: 回调函数现在接收完整的 DataTransfer 对象
  onDrop: (dataTransfer: DataTransfer) => void
) {
  const isDragging = ref(false);
  const isSearchVisible = ref(false);
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
      // **修复**: 检查并传递完整的 event.dataTransfer 对象
      if (event.dataTransfer) {
        onDrop(event.dataTransfer);
      }
    }
  };

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
