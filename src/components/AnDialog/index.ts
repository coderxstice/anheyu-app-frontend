/*
 * @Description: AnDialog 对话框组件
 * @Author: 安知鱼
 * @Date: 2025-10-10 14:17:55
 * @LastEditTime: 2025-11-18 14:21:52
 * @LastEditors: 安知鱼
 */
import AnDialog from "./index.vue";
import DialogContainer from "./DialogContainer.vue";
import {
  openDialog,
  closeDialog,
  closeAllDialogs,
  updateDialog,
  confirmDialog,
  alertDialog,
  infoDialog,
  addDialog,
  dialogStore
} from "./service";

export type {
  AnDialogProps,
  AnDialogOptions,
  AnDialogInstance,
  ArgsType,
  EventType
} from "./type";

export {
  AnDialog,
  DialogContainer,
  dialogStore,
  openDialog,
  closeDialog,
  closeAllDialogs,
  updateDialog,
  confirmDialog,
  alertDialog,
  infoDialog,
  addDialog
};

export default AnDialog;
