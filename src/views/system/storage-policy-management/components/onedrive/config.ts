/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-07-15 15:37:29
 * @LastEditTime: 2025-07-16 16:58:46
 * @LastEditors: 安知鱼
 */
import type { FormRules } from "element-plus";

export const oneDriveRules: FormRules = {
  server: [
    {
      required: true,
      message: "Microsoft Graph 端点为必选项",
      trigger: "change"
    }
  ],
  bucket_name: [
    { required: true, message: "应用(客户端) ID 为必填项", trigger: "blur" }
  ],
  secret_key: [
    { required: true, message: "客户端密码为必填项", trigger: "blur" }
  ],
  base_path: [
    { required: true, message: "云端存储根目录不能为空", trigger: "blur" }
  ],
  virtual_path: [
    { required: true, message: "应用内挂载路径不能为空", trigger: "blur" }
  ],
  "settings.drive_id": [
    { required: true, message: "SharePoint Drive ID 不能为空", trigger: "blur" }
  ]
};
