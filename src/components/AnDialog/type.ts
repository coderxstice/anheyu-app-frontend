import type { VNode, Component, CSSProperties } from "vue";

/** 对话框按钮类型 */
export type ButtonType = "primary" | "success" | "warning" | "danger" | "info";

/** 对话框事件类型 */
export type EventType = "open" | "opened" | "close" | "closed" | "confirm";

/** 对话框命令参数 */
export interface ArgsType {
  /** `confirm` 点击确定按钮、`cancel` 点击取消按钮、`close` 点击关闭按钮或按下了 ESC 键 */
  command: "confirm" | "cancel" | "close";
}

/** 对话框基础属性 */
export interface AnDialogProps {
  /** 对话框标题 */
  title?: string;
  /** 对话框宽度，默认 `580px` */
  width?: string | number;
  /** 对话框最大宽度，默认 `95vw` */
  maxWidth?: string | number;
  /** 对话框最大高度，默认 `85vh` */
  maxHeight?: string | number;
  /** 是否显示关闭按钮，默认 `true` */
  showClose?: boolean;
  /** 是否可以通过点击遮罩层关闭，默认 `true` */
  closeOnClickModal?: boolean;
  /** 是否可以通过按下 ESC 关闭，默认 `true` */
  closeOnPressEscape?: boolean;
  /** 是否隐藏头部，默认 `false` */
  hideHeader?: boolean;
  /** 是否隐藏底部，默认 `false` */
  hideFooter?: boolean;
  /** 是否显示底部，默认 `false` */
  showFooter?: boolean;
  /** 确定按钮文字，默认 `确定` */
  confirmText?: string;
  /** 取消按钮文字，默认 `取消` */
  cancelText?: string;
  /** 关闭按钮提示文字，默认 `关闭` */
  closeText?: string;
  /** 确定按钮是否加载中，默认 `false` */
  confirmLoading?: boolean;
  /** 确定按钮是否禁用，默认 `false` */
  confirmDisabled?: boolean;
  /** 对话框容器自定义类名 */
  containerClass?: string | string[] | Record<string, boolean>;
  /** 对话框内容自定义类名 */
  contentClass?: string | string[] | Record<string, boolean>;
  /** 对话框自定义样式 */
  style?: CSSProperties;
  /** 对话框打开的延时时间，单位毫秒，默认 `0` */
  openDelay?: number;
  /** 对话框关闭的延时时间，单位毫秒，默认 `0` */
  closeDelay?: number;
}

/** 函数式调用对话框选项 */
export interface AnDialogOptions extends AnDialogProps {
  /** 对话框是否可见 */
  visible?: boolean;
  /** 内容区组件的 props，可通过 defineProps 接收 */
  props?: any;
  /** 对话框内容（字符串或 HTML） */
  content?: string;
  /** 对话框内容（VNode） */
  contentRenderer?: ({
    options,
    index
  }: {
    options: AnDialogOptions;
    index: number;
  }) => VNode | Component;
  /** 自定义头部渲染器 */
  headerRenderer?: () => VNode | Component;
  /** 自定义底部渲染器 */
  footerRenderer?: ({
    options,
    index
  }: {
    options: AnDialogOptions;
    index: number;
  }) => VNode | Component;
  /** 对话框打开时的回调 */
  onOpen?: () => void;
  /** 对话框打开动画完成后的回调 */
  onOpened?: () => void;
  /** 对话框关闭时的回调 */
  onClose?: () => void;
  /** 对话框关闭动画完成后的回调 */
  onClosed?: () => void;
  /** 点击确定按钮的回调 */
  onConfirm?: () => void | Promise<void>;
  /** 点击取消按钮的回调 */
  onCancel?: () => void;
  /** 关闭对话框的回调（包含关闭原因） */
  closeCallBack?: ({
    options,
    index,
    args
  }: {
    options: AnDialogOptions;
    index: number;
    args?: ArgsType;
  }) => void;
  /** 点击确定按钮前的回调，可以控制关闭和 loading 状态 */
  beforeSure?: (
    done: Function,
    context: {
      options: AnDialogOptions;
      index: number;
      /** 关闭确定按钮的 loading 加载动画 */
      closeLoading: () => void;
    }
  ) => void;
  /** 点击取消按钮前的回调 */
  beforeCancel?: (
    done: Function,
    context: {
      options: AnDialogOptions;
      index: number;
    }
  ) => void;
  /** 点击确定按钮后是否开启 loading 加载动画 */
  sureBtnLoading?: boolean;
  /** Dialog CSS 中的 margin-top 值 */
  top?: string;
  /** 是否可拖拽（兼容 ReDialog，暂不实现） */
  draggable?: boolean;
  /** 是否全屏显示（兼容 ReDialog，暂不实现） */
  fullscreen?: boolean;
  /** 是否显示全屏图标（兼容 ReDialog，暂不实现） */
  fullscreenIcon?: boolean;
}

/** 对话框实例方法 */
export interface AnDialogInstance {
  /** 关闭对话框 */
  close: () => void;
  /** 更新对话框属性 */
  update: (options: Partial<AnDialogOptions>) => void;
}
