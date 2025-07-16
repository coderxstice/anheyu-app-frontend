/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-07-16 18:07:45
 * @LastEditTime: 2025-07-16 18:07:50
 * @LastEditors: 安知鱼
 */
// src/api/external/onedrive.ts

import axios from "axios";

/**
 * 客户端直传分片函数 (OneDrive)
 * 将单个分片直接 PUT 到 OneDrive 提供的 uploadUrl。
 * @param uploadUrl - OneDrive 提供的上传地址
 * @param chunkBlob - 分片数据
 * @param start - 分片起始字节
 * @param end - 分片结束字节
 * @param totalSize - 文件总大小
 */
export async function uploadChunkToOneDriveApi(
  uploadUrl: string,
  chunkBlob: Blob,
  start: number,
  end: number,
  totalSize: number
): Promise<void> {
  // 根据微软 Graph API 文档构建请求头
  const headers = {
    "Content-Length": chunkBlob.size.toString(),
    // HTTP Range 头部是包含的，所以是 end - 1
    "Content-Range": `bytes ${start}-${end - 1}/${totalSize}`
  };

  // 使用原始的 axios 实例发送 PUT 请求，不带任何认证头
  await axios.put(uploadUrl, chunkBlob, { headers });

  // 如果请求失败 (非 2xx 状态码)，axios 会自动抛出错误。
}
