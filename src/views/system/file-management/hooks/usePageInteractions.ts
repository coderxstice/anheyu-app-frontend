import { ref, onMounted, onUnmounted } from "vue";
import { useFileStore } from "@/store/modules/fileStore";

/**
 * 封装页面级别的所有交互逻辑，包括：
 * - 拖拽上传
 * - 全局键盘快捷键
 * - 全屏搜索状态
 * - 点击外部取消选择
 */
export function usePageInteractions() {
  const fileStore = useFileStore();

  // --- 拖拽上传状态和逻辑 ---
  const isDragging = ref(false);
  let dragCounter = 0;

  const onDragEnter = (e: DragEvent) => {
    e.preventDefault();
    dragCounter++;
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      isDragging.value = true;
    }
  };
  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
  };
  const onDragLeave = (e: DragEvent) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) {
      isDragging.value = false;
    }
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    isDragging.value = false;
    dragCounter = 0;
    if (e.dataTransfer?.files) {
      fileStore.addFilesToUpload(Array.from(e.dataTransfer.files));
    }
  };
  // 将拖拽事件处理器打包成一个对象，方便在模板中用 v-on 绑定
  const dragHandlers = { onDragEnter, onDragOver, onDragLeave, onDrop };

  // --- 全屏搜索状态和逻辑 ---
  const isSearchVisible = ref(false);
  const searchOrigin = ref({ x: 0, y: 0 });

  const openSearchFromElement = (event: MouseEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    searchOrigin.value = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
    isSearchVisible.value = true;
  };

  // --- 全局事件监听 ---
  const handleDocumentMouseDown = (event: MouseEvent) => {
    if (!(event.target as HTMLElement).closest(".deselect-safe-zone")) {
      fileStore.clearSelection();
    }
  };

  const handleDocumentKeyDown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    if (["INPUT", "TEXTAREA"].includes(target.tagName)) {
      if (event.key === "Escape") isSearchVisible.value = false;
      return;
    }

    // Cmd/Ctrl + A 全选
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a") {
      event.preventDefault();
      fileStore.selectAll();
    }

    // 空格键打开/关闭搜索
    if (event.key === " ") {
      event.preventDefault();
      if (isSearchVisible.value) {
        isSearchVisible.value = false;
      } else {
        searchOrigin.value = {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2
        };
        isSearchVisible.value = true;
      }
    }
  };

  // --- 生命周期管理 ---
  onMounted(() => {
    document.addEventListener("mousedown", handleDocumentMouseDown);
    window.addEventListener("keydown", handleDocumentKeyDown);
  });

  onUnmounted(() => {
    document.removeEventListener("mousedown", handleDocumentMouseDown);
    window.removeEventListener("keydown", handleDocumentKeyDown);
  });

  // --- 返回所有需要暴露给组件的状态和方法 ---
  return {
    isDragging,
    dragHandlers,
    isSearchVisible,
    searchOrigin,
    openSearchFromElement
  };
}
