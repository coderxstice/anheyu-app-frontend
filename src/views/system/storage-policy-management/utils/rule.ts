/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-15 14:37:32
 * @LastEditTime: 2025-06-24 10:03:33
 * @LastEditors: 安知鱼
 */
import { reactive } from "vue";
import type { FormRules } from "element-plus";

export const formRules = reactive<FormRules>({
  name: [{ required: true, message: "策略名称为必填项", trigger: "blur" }],
  type: [{ required: true, message: "存储类型为必选项", trigger: "change" }],
  base_path: [
    { required: true, message: "目录命名规则为必填项", trigger: "blur" }
  ],
  virtual_path: [
    { required: true, message: "挂载路径为必填项", trigger: "blur" }
  ],
  max_size: [
    { required: true, message: "文件大小限制为必填项", trigger: "change" }
  ],
  "settings.chunk_size": [
    { required: true, message: "上传分片大小为必填项", trigger: "change" }
  ]
});
