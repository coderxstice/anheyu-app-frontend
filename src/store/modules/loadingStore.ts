/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-07 18:19:50
 * @LastEditTime: 2025-10-30 14:18:41
 * @LastEditors: 安知鱼
 */
import { defineStore } from "pinia";

// 定时器变量（模块级别，不放在 state 中避免响应式处理）
let loadingTimer: number | null = null;
let minShowTimer: number | null = null;
let loadingStartTime: number = 0;

// 最小显示时间（毫秒），避免 loading 一闪而过
const MIN_LOADING_DURATION = 400;

export const useLoadingStore = defineStore("loading", {
  state: () => ({
    isLoading: false,
    // 是否需要等待最小显示时间
    _waitingMinDuration: false
  }),
  actions: {
    /**
     * 开始加载（延迟 300ms 显示加载动画）
     * 如果在 300ms 内路由加载完成，则不显示加载动画，避免闪烁
     */
    startLoading() {
      // 清除之前可能存在的定时器
      this._clearTimers();

      // 延迟 300ms 显示加载动画
      loadingTimer = window.setTimeout(() => {
        this.isLoading = true;
        loadingStartTime = Date.now();
        loadingTimer = null;
      }, 300);
    },

    /**
     * 立即开始加载（用于后台页面切换等需要即时反馈的场景）
     * 会有最小显示时间，避免一闪而过
     */
    startLoadingImmediate() {
      // 清除之前可能存在的定时器
      this._clearTimers();

      this.isLoading = true;
      this._waitingMinDuration = true;
      loadingStartTime = Date.now();
    },

    /**
     * 停止加载
     */
    stopLoading() {
      // 清除延迟显示定时器
      if (loadingTimer !== null) {
        clearTimeout(loadingTimer);
        loadingTimer = null;
      }

      // 如果需要等待最小显示时间
      if (this._waitingMinDuration && this.isLoading) {
        const elapsed = Date.now() - loadingStartTime;
        const remaining = MIN_LOADING_DURATION - elapsed;

        if (remaining > 0) {
          // 等待剩余时间后再关闭
          minShowTimer = window.setTimeout(() => {
            this.isLoading = false;
            this._waitingMinDuration = false;
            minShowTimer = null;
          }, remaining);
          return;
        }
      }

      // 立即隐藏加载动画
      this.isLoading = false;
      this._waitingMinDuration = false;
    },

    /**
     * 清除所有定时器
     */
    _clearTimers() {
      if (loadingTimer !== null) {
        clearTimeout(loadingTimer);
        loadingTimer = null;
      }
      if (minShowTimer !== null) {
        clearTimeout(minShowTimer);
        minShowTimer = null;
      }
    }
  }
});
