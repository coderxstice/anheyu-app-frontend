<template>
  <AnDialog
    v-for="(item, index) in dialogStore"
    :key="index"
    v-model="item.visible"
    :title="item.title"
    :width="item.width"
    :max-width="item.maxWidth"
    :max-height="item.maxHeight"
    :show-close="item.showClose"
    :close-on-click-modal="item.closeOnClickModal"
    :close-on-press-escape="item.closeOnPressEscape"
    :hide-header="item.hideHeader"
    :hide-footer="item.hideFooter"
    :show-footer="item.showFooter"
    :confirm-text="item.confirmText"
    :cancel-text="item.cancelText"
    :close-text="item.closeText"
    :confirm-loading="item.confirmLoading"
    :confirm-disabled="item.confirmDisabled"
    :container-class="item.containerClass"
    :content-class="item.contentClass"
    @open="handleOpen(item, index)"
    @opened="handleOpened(item, index)"
    @close="handleClose(item, index)"
    @closed="handleClosed(item, index)"
    @confirm="handleConfirm(item, index)"
  >
    <template v-if="item.headerRenderer" #header>
      <component :is="item.headerRenderer()" />
    </template>

    <template v-if="item.contentRenderer">
      <component
        v-bind="item.props"
        :is="item.contentRenderer({ options: item, index })"
      />
    </template>
    <div v-else-if="item.content" v-html="item.content" />

    <template v-if="item.footerRenderer" #footer>
      <component :is="item.footerRenderer({ options: item, index })" />
    </template>
  </AnDialog>
</template>

<script setup lang="ts">
import AnDialogComponent from "./index.vue";
import type { AnDialogOptions, ArgsType } from "./type";
import { dialogStore } from ".";

// 使用正确的组件名称
const AnDialog = AnDialogComponent;

const handleOpen = (item: AnDialogOptions, index: number) => {
  item.onOpen?.();
};

const handleOpened = (item: AnDialogOptions, index: number) => {
  item.onOpened?.();
};

const handleClose = (item: AnDialogOptions, index: number) => {
  item.onClose?.();
};

const handleClosed = (item: AnDialogOptions, index: number) => {
  item.onClosed?.();
  const args: ArgsType = { command: "close" };
  item.closeCallBack?.({ options: item, index, args });

  // 从 store 中移除
  setTimeout(() => {
    dialogStore.value.splice(index, 1);
  }, 100);
};

const handleConfirm = async (item: AnDialogOptions, index: number) => {
  try {
    // 如果有 beforeSure 回调，优先使用它
    if (item.beforeSure) {
      // 启用 loading
      if (item.sureBtnLoading) {
        dialogStore.value[index].confirmLoading = true;
      }

      const done = () => {
        item.visible = false;
      };

      const closeLoading = () => {
        if (dialogStore.value[index]) {
          dialogStore.value[index].confirmLoading = false;
        }
      };

      item.beforeSure(done, { options: item, index, closeLoading });
      return;
    }

    // 否则使用 onConfirm
    if (item.onConfirm) {
      // 启用 loading
      if (item.sureBtnLoading) {
        dialogStore.value[index].confirmLoading = true;
      }

      const result = item.onConfirm();
      // 如果返回 Promise，等待执行完成
      if (result instanceof Promise) {
        await result;
      }

      // 关闭 loading
      if (item.sureBtnLoading) {
        dialogStore.value[index].confirmLoading = false;
      }
    }

    const args: ArgsType = { command: "confirm" };
    item.closeCallBack?.({ options: item, index, args });

    // 确认后关闭对话框
    item.visible = false;
  } catch (error) {
    console.error("对话框确认回调执行失败:", error);
    // 出错时关闭 loading
    if (item.sureBtnLoading && dialogStore.value[index]) {
      dialogStore.value[index].confirmLoading = false;
    }
  }
};
</script>
