/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-07-15 15:36:59
 * @LastEditTime: 2025-07-15 15:42:04
 * @LastEditors: 安知鱼
 */
import type { FormRules } from "element-plus";
export const localRules: FormRules = {
  base_path: [
    { required: true, message: "Blob 存储目录为必填项", trigger: "blur" }
  ],
  virtual_path: [
    { required: true, message: "Blob 挂载目录为必填项", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (value === "/") {
          callback(
            new Error(
              "不能将存储策略挂载到根目录 '/'，请修改为子目录路径（如 /local、/cos、/onedrive 等）"
            )
          );
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ]
};
