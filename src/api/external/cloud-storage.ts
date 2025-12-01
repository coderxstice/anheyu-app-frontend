/*
 * @Description: 云存储客户端直传 API
 *              支持腾讯云 COS、阿里云 OSS、AWS S3 的预签名 URL 上传
 * @Author: 安知鱼
 * @Date: 2025-12-01
 * @LastEditors: 安知鱼
 */

import axios from "axios";

/**
 * 云存储类型
 */
export type CloudStorageType = "tencent_cos" | "aliyun_oss" | "aws_s3";

/**
 * 通用的云存储上传函数
 * 使用预签名 URL 直接 PUT 文件到云存储
 *
 * @param uploadUrl - 后端生成的预签名上传 URL
 * @param file - 要上传的文件（整个文件）
 * @param storageType - 云存储类型，用于设置正确的请求头
 * @param onProgress - 可选的进度回调
 */
export async function uploadToCloudStorage(
  uploadUrl: string,
  file: File | Blob,
  storageType: CloudStorageType,
  onProgress?: (progress: number) => void
): Promise<void> {
  // 根据存储类型设置请求头
  const headers: Record<string, string> = {
    "Content-Type": file.type || "application/octet-stream"
  };

  // 腾讯云 COS 可能需要额外的请求头
  if (storageType === "tencent_cos") {
    // COS 预签名 URL 已包含所有必要的认证信息
    // 不需要额外的请求头
  }

  // 阿里云 OSS
  if (storageType === "aliyun_oss") {
    // OSS 预签名 URL 已包含所有必要的认证信息
  }

  // AWS S3
  if (storageType === "aws_s3") {
    // S3 预签名 URL 已包含所有必要的认证信息
  }

  // 使用原始的 axios 实例发送 PUT 请求
  await axios.put(uploadUrl, file, {
    headers,
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(progress);
      }
    }
  });
}

/**
 * 腾讯云 COS 直传
 * @param uploadUrl - 预签名上传 URL
 * @param file - 要上传的文件
 * @param onProgress - 可选的进度回调
 */
export async function uploadToCOS(
  uploadUrl: string,
  file: File | Blob,
  onProgress?: (progress: number) => void
): Promise<void> {
  return uploadToCloudStorage(uploadUrl, file, "tencent_cos", onProgress);
}

/**
 * 阿里云 OSS 直传
 * @param uploadUrl - 预签名上传 URL
 * @param file - 要上传的文件
 * @param onProgress - 可选的进度回调
 */
export async function uploadToOSS(
  uploadUrl: string,
  file: File | Blob,
  onProgress?: (progress: number) => void
): Promise<void> {
  return uploadToCloudStorage(uploadUrl, file, "aliyun_oss", onProgress);
}

/**
 * AWS S3 直传
 * @param uploadUrl - 预签名上传 URL
 * @param file - 要上传的文件
 * @param onProgress - 可选的进度回调
 */
export async function uploadToS3(
  uploadUrl: string,
  file: File | Blob,
  onProgress?: (progress: number) => void
): Promise<void> {
  return uploadToCloudStorage(uploadUrl, file, "aws_s3", onProgress);
}

