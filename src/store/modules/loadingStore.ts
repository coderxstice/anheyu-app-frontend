/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-07 18:19:50
 * @LastEditTime: 2025-08-07 18:19:54
 * @LastEditors: 安知鱼
 */
import { defineStore } from "pinia";

// 定时器变量（模块级别，不放在 state 中避免响应式处理）
let loadingTimer: number | null = null;

export const useLoadingStore = defineStore("loading", {
  state: () => ({
    isLoading: false
  }),
  actions: {
    /**
     * 开始加载（延迟 200ms 显示加载动画）
     * 如果在 200ms 内路由加载完成，则不显示加载动画，避免闪烁
     */
    startLoading() {
      // 清除之前可能存在的定时器
      if (loadingTimer !== null) {
        clearTimeout(loadingTimer);
        loadingTimer = null;
      }

      // 延迟 200ms 显示加载动画
      loadingTimer = window.setTimeout(() => {
        this.isLoading = true;
        loadingTimer = null;
      }, 200);
    },
    /**
     * 停止加载
     */
    stopLoading() {
      // 清除定时器，防止延迟显示
      if (loadingTimer !== null) {
        clearTimeout(loadingTimer);
        loadingTimer = null;
      }

      // 隐藏加载动画
      this.isLoading = false;
    }
  }
});
