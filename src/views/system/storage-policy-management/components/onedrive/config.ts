import type { FormRules } from "element-plus";
export const oneDriveRules: FormRules = {
  "settings.endpoint": [
    { required: true, message: "Graph 端点为必选项", trigger: "change" }
  ],
  "settings.client_id": [
    { required: true, message: "应用(客户端) ID 为必填项", trigger: "blur" }
  ],
  "settings.client_secret": [
    { required: true, message: "客户端密码为必填项", trigger: "blur" }
  ]
};
