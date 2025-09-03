/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-09-02 13:30:17
 * @LastEditTime: 2025-09-03 16:33:32
 * @LastEditors: 安知鱼
 */
import { ref, watch } from "vue";
import { defineStore } from "pinia";
import Storage from "responsive-storage";
import { responsiveStorageNameSpace } from "@/config/base";

export const useUiStore = defineStore("ui", () => {
  const nameSpace = responsiveStorageNameSpace();

  // 控制热评弹幕是否可见的状态，从存储中读取或默认为 true (可见)
  const isCommentBarrageVisible = ref(
    Storage.getData("isCommentBarrageVisible", nameSpace) ?? true
  );

  // 切换状态的 action
  function toggleCommentBarrage(value?: boolean) {
    if (typeof value === "boolean") {
      isCommentBarrageVisible.value = value;
    } else {
      isCommentBarrageVisible.value = !isCommentBarrageVisible.value;
    }
  }

  // 监听状态变化，自动保存到存储
  watch(
    isCommentBarrageVisible,
    newValue => {
      Storage.set("isCommentBarrageVisible", JSON.stringify(newValue));
    },
    { immediate: false }
  );

  // 控制快捷键功能是否启用的状态，默认为 true (启用)
  const isShortcutsEnabled = ref(
    Storage.getData("isShortcutsEnabled", nameSpace) ?? true
  );

  // 切换快捷键启用状态的 action
  function toggleShortcuts(value?: boolean) {
    if (typeof value === "boolean") {
      isShortcutsEnabled.value = value;
    } else {
      isShortcutsEnabled.value = !isShortcutsEnabled.value;
    }
  }

  // 监听状态变化，自动保存到存储
  watch(
    isShortcutsEnabled,
    newValue => {
      Storage.set("isShortcutsEnabled", JSON.stringify(newValue));
    },
    { immediate: false }
  );

  // 控制右键菜单模式的状态，默认为 true (使用本站菜单)
  const useCustomContextMenu = ref(
    Storage.getData("useCustomContextMenu", nameSpace) ?? true
  );

  // 切换右键菜单模式的 action
  function toggleContextMenuMode(value?: boolean) {
    if (typeof value === "boolean") {
      useCustomContextMenu.value = value;
    } else {
      useCustomContextMenu.value = !useCustomContextMenu.value;
    }
  }

  // 监听状态变化，自动保存到存储
  watch(
    useCustomContextMenu,
    newValue => {
      Storage.set("useCustomContextMenu", JSON.stringify(newValue));
    },
    { immediate: false }
  );

  return {
    isCommentBarrageVisible,
    toggleCommentBarrage,
    isShortcutsEnabled,
    toggleShortcuts,
    useCustomContextMenu,
    toggleContextMenuMode
  };
});
