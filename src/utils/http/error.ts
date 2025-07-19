/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-20 17:40:18
 * @LastEditTime: 2025-07-19 09:59:47
 * @LastEditors: 安知鱼
 */
import type { AnHttpError } from "./types.d";

// 导入您项目中使用的UI消息提示组件
// 这里以 Element-Plus 为例，请替换为您自己的UI库
import { ElMessage } from "element-plus";

/**
 * 处理后端返回的业务错误
 * @param error AnHttpError
 */
export function handleBackendError(error: AnHttpError): void {
  // 打印错误信息，方便调试
  console.error("Axios Error Interceptor:", error);

  let message: string = "服务器发生未知错误，请稍后重试！";

  // response 存在，说明服务器有响应，只是状态码是错误的
  if (error.response) {
    const { data } = error.response as any; // 使用 any 类型以兼容不同的后端返回格式
    // 优先使用后端返回的 data.message
    if (data && data.message) {
      message = data.message;
    } else {
      // 其次，可以根据状态码给出一个通用的提示
      // 您可以根据需要扩展这里的 case
      switch (error.response.status) {
        case 400:
          message = "请求参数错误";
          break;
        case 403:
          message = "没有权限访问";
          break;
        case 404:
          message = "请求的资源不存在";
          break;
        case 409:
          message = "资源冲突或重复"; // 比如，用户名已存在
          break;
        case 500:
          message = "服务器内部错误";
          break;
        default:
          message = `连接错误 (${error.response.status})!`;
      }
    }
  } else if (error.request) {
    // 请求已发出，但没有收到响应（例如，网络断开或服务器无响应）
    message = "网络连接超时，请检查您的网络！";
  } else {
    // 在设置请求时触发了错误
    message = "请求失败，请检查配置！";
  }

  // 调用UI库的弹窗组件
  // 请确保您已经安装并配置了相应的UI库
  ElMessage({
    message: message,
    type: "error",
    duration: 5000 // 持续5秒
  });
}
