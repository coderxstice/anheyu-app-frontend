/*
 * @Description: 处理右键菜单所有逻辑的组合式函数 (Hook)
 * @Author: 安知鱼
 * @Date: 2025-06-25 14:18:45
 * @LastEditTime: 2025-06-26 18:52:28
 * @LastEditors: 安知鱼
 */
import { ref } from "vue";
import { ElMessage } from "element-plus";

/**
 * 定义 useContextMenuHandler 所需的所有操作函数。
 * 这是一个清晰的接口，描述了此 Hook 的依赖。
 */
export interface ContextMenuActions {
  onUploadFile: () => void;
  onUploadDir: () => void;
  onCreateFolder: () => void;
  onCreateMd: () => void;
  onCreateTxt: () => void;
  onRefresh: () => void;
  onRename: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onCopy: () => void;
  onMove: () => void;
  onShare: () => void;
  onInfo: () => void;
}

/**
 * 这是一个专门处理右键菜单所有逻辑的组合式函数 (Hook)。
 * 它接收一个包含所有菜单操作实现的对象作为参数。
 *
 * @param actions - 包含所有菜单项对应操作函数的对象。
 */
export function useContextMenuHandler(actions: Partial<ContextMenuActions>) {
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
    contextMenuTriggerEvent.value = event;
  };

  /**
   * 当 ContextMenu 组件通知我们它已关闭时，我们重置触发器
   */
  const handleContextMenuClosed = () => {
    contextMenuTriggerEvent.value = null;
  };

  /**
   * 当一个菜单项被点击时，分发到注入的相应操作函数
   * @param action 菜单项定义的动作标识符
   * @param context 菜单打开时捕获的上下文信息（如选中的文件ID）
   */
  const onMenuSelect = (action: string, context?: any) => {
    console.log("Menu action received:", action, "Context:", context);

    // 使用一个映射来代替庞大的 switch-case，更清晰
    const actionMap: Record<string, (() => void) | undefined> = {
      "upload-file": actions.onUploadFile,
      "upload-dir": actions.onUploadDir,
      "create-folder": actions.onCreateFolder,
      "create-md": actions.onCreateMd,
      "create-txt": actions.onCreateTxt,
      refresh: actions.onRefresh,
      rename: actions.onRename,
      delete: actions.onDelete,
      download: actions.onDownload,
      copy: actions.onCopy,
      move: actions.onMove,
      share: actions.onShare,
      info: actions.onInfo
    };

    const handler = actionMap[action];

    if (handler) {
      handler();
    } else {
      console.warn(`No handler found for menu action: "${action}"`);
      ElMessage.warning(`功能 "${action}" 尚未实现`);
    }
  };

  // 将所有需要暴露给外部的状态和函数返回
  return {
    contextMenuTriggerEvent,
    handleContextMenuTrigger,
    onMenuSelect,
    handleContextMenuClosed,
    openBlankMenu
  };
}
