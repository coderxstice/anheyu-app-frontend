// src/views/system/storage-policy-management/utils/rule.ts
import { reactive } from "vue";
import type { FormRules } from "element-plus";

// 只保留所有策略都通用的规则
export const commonFormRules = reactive<FormRules>({
  name: [{ required: true, message: "策略名称为必填项", trigger: "blur" }],
  type: [{ required: true, message: "存储类型为必选项", trigger: "change" }],
  max_size: [
    { required: true, message: "文件大小限制为必填项", trigger: "change" }
  ],
  "settings.chunk_size": [
    { required: true, message: "上传分片大小为必填项", trigger: "change" }
  ]
});
