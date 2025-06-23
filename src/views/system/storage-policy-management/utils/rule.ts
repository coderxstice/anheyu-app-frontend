/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-15 14:37:32
 * @LastEditTime: 2025-06-23 17:26:41
 * @LastEditors: 安知鱼
 */
import { reactive } from "vue";
import type { FormRules } from "element-plus";

export const formRules = reactive<FormRules>({
  name: [{ required: true, message: "策略名称为必填项", trigger: "blur" }],
  type: [{ required: true, message: "存储类型为必选项", trigger: "change" }],
  dir_name_rule: [
    { required: true, message: "目录命名规则为必填项", trigger: "blur" }
  ],
  file_name_rule: [
    { required: true, message: "文件命名规则为必填项", trigger: "blur" }
  ]
});
