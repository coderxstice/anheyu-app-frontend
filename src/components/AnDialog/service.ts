import { ref } from "vue";
import type { AnDialogOptions, AnDialogInstance } from "./type";

/** 对话框存储 */
export const dialogStore = ref<Array<AnDialogOptions>>([]);

/**
 * 打开对话框
 * @param options 对话框配置选项
 * @returns 对话框实例
 */
export const openDialog = (options: AnDialogOptions): AnDialogInstance => {
  const index = dialogStore.value.length;

  const dialogOptions: AnDialogOptions = {
    visible: false,
    showClose: true,
    closeOnClickModal: true,
    closeOnPressEscape: true,
    hideHeader: false,
    hideFooter: false,
    showFooter: true,
    confirmText: "确定",
    cancelText: "取消",
    closeText: "关闭",
    confirmLoading: false,
    confirmDisabled: false,
    width: "580px",
    maxWidth: "95vw",
    maxHeight: "85vh",
    openDelay: 0,
    closeDelay: 0,
    ...options
  };

  // 添加到存储
  dialogStore.value.push(dialogOptions);

  // 延迟打开
  const openDelay = dialogOptions.openDelay || 0;
  setTimeout(() => {
    dialogStore.value[index].visible = true;
  }, openDelay);

  // 返回实例方法
  return {
    close: () => {
      if (dialogStore.value[index]) {
        dialogStore.value[index].visible = false;
      }
    },
    update: (newOptions: Partial<AnDialogOptions>) => {
      if (dialogStore.value[index]) {
        Object.assign(dialogStore.value[index], newOptions);
      }
    }
  };
};

/**
 * 关闭指定索引的对话框
 * @param index 对话框索引
 */
export const closeDialog = (index: number) => {
  if (dialogStore.value[index]) {
    dialogStore.value[index].visible = false;
  }
};

/**
 * 关闭所有对话框
 */
export const closeAllDialogs = () => {
  dialogStore.value.forEach(dialog => {
    dialog.visible = false;
  });

  // 等待动画完成后清空
  setTimeout(() => {
    dialogStore.value = [];
  }, 300);
};

/**
 * 更新对话框属性
 * @param index 对话框索引
 * @param key 属性键
 * @param value 属性值
 */
export const updateDialog = (
  index: number,
  key: keyof AnDialogOptions,
  value: any
) => {
  if (dialogStore.value[index]) {
    (dialogStore.value[index] as any)[key] = value;
  }
};

/**
 * 便捷方法：确认对话框
 * @param options 对话框配置
 */
export const confirmDialog = (
  options: Omit<AnDialogOptions, "showFooter">
): Promise<void> => {
  return new Promise((resolve, reject) => {
    openDialog({
      ...options,
      showFooter: true,
      onConfirm: async () => {
        try {
          if (options.onConfirm) {
            await options.onConfirm();
          }
          resolve();
        } catch (error) {
          reject(error);
        }
      },
      closeCallBack: ({ args }) => {
        if (args?.command === "cancel" || args?.command === "close") {
          reject(new Error("cancelled"));
        }
        options.closeCallBack?.({ options, index: 0, args });
      }
    });
  });
};

/**
 * 便捷方法：警告对话框
 * @param options 对话框配置
 */
export const alertDialog = (
  options: Omit<AnDialogOptions, "showFooter" | "hideFooter">
): Promise<void> => {
  return new Promise(resolve => {
    openDialog({
      ...options,
      hideFooter: false,
      showFooter: true,
      cancelText: "",
      onConfirm: async () => {
        if (options.onConfirm) {
          await options.onConfirm();
        }
        resolve();
      }
    });
  });
};

/**
 * 便捷方法：信息对话框（只有内容，无按钮）
 * @param options 对话框配置
 */
export const infoDialog = (options: AnDialogOptions): AnDialogInstance => {
  return openDialog({
    ...options,
    hideFooter: true
  });
};

/**
 * 兼容 ReDialog 的 addDialog 方法
 * 用于无缝替换项目中的 addDialog 调用
 * @param options 对话框配置（与 ReDialog 兼容）
 */
export const addDialog = (options: AnDialogOptions): AnDialogInstance => {
  // 转换配置，确保与 ReDialog 行为一致
  const dialogOptions: AnDialogOptions = {
    ...options,
    showFooter: options.hideFooter ? false : true,
    // 如果没有指定 hideFooter，默认显示底部
    hideFooter: options.hideFooter ?? false
  };

  return openDialog(dialogOptions);
};
