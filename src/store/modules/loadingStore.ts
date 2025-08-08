/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-07 18:19:50
 * @LastEditTime: 2025-08-07 18:19:54
 * @LastEditors: 安知鱼
 */
import { defineStore } from "pinia";

export const useLoadingStore = defineStore("loading", {
  state: () => ({
    isLoading: false
  }),
  actions: {
    /**
     * 开始加载
     */
    startLoading() {
      this.isLoading = true;
    },
    /**
     * 停止加载
     */
    stopLoading() {
      this.isLoading = false;
    }
  }
});
