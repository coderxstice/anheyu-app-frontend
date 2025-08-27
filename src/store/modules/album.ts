/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-24 00:34:51
 * @LastEditTime: 2025-06-24 00:34:58
 * @LastEditors: 安知鱼
 */
import { defineStore } from "pinia";
import { ref } from "vue";

export const useAlbumStore = defineStore("anheyu-album", () => {
  // State: 定义排序状态，默认值为按排序号
  const sortOrder = ref("display_order_asc");

  // Actions: 定义一个修改排序状态的方法
  function setSortOrder(newOrder: string) {
    if (sortOrder.value !== newOrder) {
      sortOrder.value = newOrder;
    }
  }

  return {
    sortOrder,
    setSortOrder
  };
});
