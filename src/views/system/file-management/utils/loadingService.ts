// src/utils/loadingService.ts (新内容)

import { ElLoading } from "element-plus";
import type { LoadingInstance } from "element-plus/es/components/loading/src/loading";

/**
 * 创建一个全屏加载蒙层服务。
 * @param text 加载时显示的文本
 * @returns {LoadingInstance} 一个包含 close 方法的加载实例
 */
export function createFullScreenLoading(text: string): LoadingInstance {
  const loadingInstance = ElLoading.service({
    lock: true,
    text: text,
    background: "rgba(0, 0, 0, 0.7)" // 自定义背景色
  });
  return loadingInstance;
}
