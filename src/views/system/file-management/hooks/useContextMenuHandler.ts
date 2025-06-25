/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-25 14:18:45
 * @LastEditTime: 2025-06-25 14:55:41
 * @LastEditors: 安知鱼
 */
import { ref } from "vue";
import { useFileStore } from "@/store/modules/fileStore";
import { useFileActions } from "./useFileActions";

/**
 * 这是一个专门处理右键菜单所有逻辑的组合式函数 (Hook)
 */
export function useContextMenuHandler() {
  const fileStore = useFileStore();
  const {
    handleUploadFile,
    handleUploadDir,
    handleCreateFile,
    handleCreateFolder
  } = useFileActions();

  // 这是与 ContextMenu 组件交互的唯一状态
  const contextMenuTriggerEvent = ref<MouseEvent | null>(null);

  /**
   * 响应页面上的 @contextmenu 事件
   * @param event 鼠标右键事件
   */
  const handleContextMenuTrigger = (event: MouseEvent) => {
    contextMenuTriggerEvent.value = event;
  };

  /**
   * 响应来自 FileHeard 组件的“新建”按钮点击事件
   * @param event 鼠标左键事件
   */
  const openBlankMenu = (event: MouseEvent) => {
    // 我们的 ContextMenu 组件足够智能，它可以处理任何类型的鼠标事件
    // 我们只需将事件传递给它即可
    contextMenuTriggerEvent.value = event;
  };

  /**
   * 当 ContextMenu 组件通知我们它已关闭时，我们重置触发器
   */
  const handleContextMenuClosed = () => {
    contextMenuTriggerEvent.value = null;
  };

  /**
   * 当一个菜单项被点击时，执行相应的操作
   * @param action 菜单项定义的动作标识符
   * @param context 菜单打开时捕获的上下文信息（如选中的文件ID）
   */
  const onMenuSelect = (action: string, context?: any) => {
    console.log("Menu action:", action, "Context:", context);
    switch (action) {
      case "upload-file":
        handleUploadFile();
        break;
      case "upload-dir":
        handleUploadDir();
        break;
      case "create-folder":
        handleCreateFolder();
        break;
      case "create-md":
        handleCreateFile("md");
        break;
      case "create-txt":
        handleCreateFile("txt");
        break;
      case "info":
        handleCreateFile("txt");
        break;
      case "refresh":
        fileStore.loadFiles(fileStore.path);
        break;
      case "rename":
      case "delete":
        if (context?.selectedIds && context.selectedIds.length > 0) {
          console.log(`执行操作 ${action}，选中文件 ID:`, context.selectedIds);
          // 在这里调用 store action, e.g., fileStore.deleteFiles(context.selectedIds);
        } else {
          console.warn(`执行操作 ${action}，但没有选中文件。`);
        }
        break;
    }
  };

  // 将所有需要暴露给模板的状态和函数返回
  return {
    contextMenuTriggerEvent,
    handleContextMenuTrigger,
    onMenuSelect,
    handleContextMenuClosed,
    openBlankMenu
  };
}
