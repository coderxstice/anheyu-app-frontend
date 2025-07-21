/*
 * @Description: 处理右键菜单所有逻辑的组合式函数 (Hook)
 * @Author: 安知鱼
 * @Date: 2025-06-25 14:18:45
 * @LastEditTime: 2025-07-21 15:39:53
 * @LastEditors: 安知鱼
 */
import { ref, type Ref } from "vue";
import { ElMessage } from "element-plus";
import type { FileItem } from "@/api/sys-file/type";

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
  onGetLink: () => void;
  onRegenerateThumbnail: () => void;
}

/**
 * 定义 Hook 的完整参数类型
 */
interface UseContextMenuHandlerOptions extends Partial<ContextMenuActions> {
  hasSelection: Ref<boolean>;
  clearSelection: () => void;
}

/**
 * 定义触发器对象类型，它封装了右键菜单所需的所有上下文。
 */
export interface ContextMenuTrigger {
  event: MouseEvent;
  file?: FileItem; // 可选的文件对象，当在文件项上右键时存在
}

/**
 * 这是一个专门处理右键菜单所有逻辑的组合式函数 (Hook)。
 * 它接收一个包含所有菜单操作实现和所需状态的对象作为参数。
 *
 * @param options - 包含所有菜单项对应操作函数及所需状态的对象。
 */
export function useContextMenuHandler(options: UseContextMenuHandlerOptions) {
  // 从 options 中解构出所需的状态和 action 函数
  const { hasSelection, clearSelection, ...actions } = options;

  // 这是与 ContextMenu 组件交互的唯一状态，现在是一个包含事件和文件上下文的对象
  const contextMenuTrigger = ref<ContextMenuTrigger | null>(null);

  /**
   * 响应页面上的 @contextmenu 事件
   * @param event 鼠标右键事件
   * @param file (可选) 被右键点击的文件项
   */
  const handleContextMenuTrigger = (event: MouseEvent, file?: FileItem) => {
    // 整合逻辑：如果在非文件/文件夹项上右键（即 file 不存在），并且当前有选中项，则清空选择
    if (!file && hasSelection.value) {
      clearSelection();
    }
    contextMenuTrigger.value = { event, file };
  };

  /**
   * 响应来自 FileHeard 组件的“新建”按钮点击事件
   * @param event 鼠标左键事件
   */
  const openBlankMenu = (event: MouseEvent) => {
    // 保持数据结构一致，file 为 undefined
    contextMenuTrigger.value = { event };
  };

  /**
   * 当 ContextMenu 组件通知我们它已关闭时，我们重置触发器
   */
  const handleContextMenuClosed = () => {
    contextMenuTrigger.value = null;
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
      "get-link": actions.onGetLink,
      refresh: actions.onRefresh,
      rename: actions.onRename,
      delete: actions.onDelete,
      download: actions.onDownload,
      copy: actions.onCopy,
      move: actions.onMove,
      share: actions.onShare,
      info: actions.onInfo,
      "regenerate-thumbnail": actions.onRegenerateThumbnail // 新增：处理重新生成缩略图的动作
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
    contextMenuTrigger,
    handleContextMenuTrigger,
    onMenuSelect,
    handleContextMenuClosed,
    openBlankMenu
  };
}
