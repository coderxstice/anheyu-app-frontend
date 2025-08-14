// src/composables/useSnackbar.ts

import Snackbar from "node-snackbar";
import "node-snackbar/dist/snackbar.min.css";

// 1. 在接口中也加入 showAction 属性（可选，但更规范）
interface SnackbarOptions {
  text: string;
  duration: number;
  pos:
    | "bottom-center"
    | "bottom-left"
    | "bottom-right"
    | "top-center"
    | "top-left"
    | "top-right";
  showAction?: boolean; // 【新增】
  actionText?: string;
  onActionClick?: (element: HTMLElement) => void;
  backgroundColor?: string;
}

/**
 * 封装 node-snackbar 的 Vue Composable
 */
export function useSnackbar() {
  /**
   * 显示 Snackbar 提示
   * @param text - 要显示的文本信息
   * @param onActionClick - 点击操作按钮时触发的回调函数。如果不是函数，则不显示操作按钮。
   * @param duration - Snackbar 显示的持续时间（毫秒）。
   * @param actionText - 操作按钮上显示的文本。
   */
  const show = (
    text: string,
    onActionClick: (() => void) | boolean = false,
    duration: number = 2000,
    actionText: string | boolean = false
  ) => {
    const bg =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "#425AEF"
        : "#1f1f1f";

    const options: SnackbarOptions = {
      text: text,
      duration: duration,
      pos: "top-center",
      backgroundColor: bg,
      showAction: false
    };

    document.documentElement.style.setProperty(
      "--anzhiyu-snackbar-time",
      `${duration}ms`
    );

    if (
      typeof onActionClick === "function" &&
      typeof actionText === "string" &&
      actionText.length > 0
    ) {
      options.showAction = true;
      options.actionText = actionText;
      options.onActionClick = () => {
        onActionClick();
      };
    }

    console.log(duration);

    Snackbar.show(options);
  };

  return {
    showSnackbar: show
  };
}
