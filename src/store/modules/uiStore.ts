/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-09-02 13:30:17
 * @LastEditTime: 2025-09-02 13:33:49
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

  return {
    isCommentBarrageVisible,
    toggleCommentBarrage
  };
});
